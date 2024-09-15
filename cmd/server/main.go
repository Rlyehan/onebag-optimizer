package main

import (
	"context"
	"net/http"
	"time"

	"github.com/Rlyehan/onebag-optimizer/internal/api"
	"github.com/Rlyehan/onebag-optimizer/internal/config"
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
	ctx := context.Background()

	logger, err := setupLogger()
	if err != nil {
		return err
	}
	defer logger.Sync()

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

	logger.Info("Server is starting", zap.String("port", cfg.ServerPort))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("Failed to start server", zap.Error(err))
	}

	return nil
}

func setupLogger() (*zap.Logger, error) {
	config := zap.NewProductionConfig()
	config.OutputPaths = []string{"stdout", "logs/app.log"}
	return config.Build()
}
