package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Rlyehan/onebag-optimizer/internal/api"
	"github.com/Rlyehan/onebag-optimizer/internal/config"
	"github.com/Rlyehan/onebag-optimizer/internal/metrics"
	"github.com/Rlyehan/onebag-optimizer/internal/session"
	"github.com/Rlyehan/onebag-optimizer/internal/storage"
	"go.uber.org/zap"
)

func main() {
	if err := run(); err != nil {
		panic(err)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	logger, err := setupLogger()
	if err != nil {
		return err
	}
	defer logger.Sync()

	tp, err := metrics.SetupTracing("onebag-optimizer")
	if err != nil {
		logger.Error("Failed to set up tracing", zap.Error(err))
	} else {
		defer func() {
			if err := tp.Shutdown(context.Background()); err != nil {
				logger.Error("Error shutting down tracer provider", zap.Error(err))
			}
		}()
	}

	cfg, err := config.Load(ctx)
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	s3Client, err := storage.NewS3Client(ctx, cfg.AWSConfig)
	if err != nil {
		logger.Fatal("Failed to create S3 client", zap.Error(err))
	}

	sessionManager := session.NewManager(cfg.SessionExpiry)
	go sessionManager.StartCleanupTask(cfg.SessionCleanupInterval)

	router := api.NewRouter(logger, s3Client, sessionManager, cfg)

	server := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      router.SetupRoutes(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info("Server is starting", zap.String("port", cfg.ServerPort))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Server error", zap.Error(err))
		}
	}()

	<-ctx.Done()
	logger.Info("Shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("Server forced to shutdown", zap.Error(err))
		return err
	}

	logger.Info("Server gracefully stopped")
	return nil
}

func setupLogger() (*zap.Logger, error) {
	config := zap.NewProductionConfig()
	config.OutputPaths = []string{"stdout", "logs/app.log"}
	return config.Build()
}
