package main

import (
	"context"
	"github.com/Rlyehan/onebag-optimizer/handlers"
	"github.com/Rlyehan/onebag-optimizer/middleware"
	"github.com/Rlyehan/onebag-optimizer/session"
	"github.com/Rlyehan/onebag-optimizer/utils"
	"go.uber.org/zap"
	"net/http"
	"os"
	"time"
)

func main() {

	if err := utils.SetupLogger("logs/app.log"); err != nil {
		panic(err)
	}

	ctx := context.TODO()
	cfg, err := utils.LoadConfig(ctx)
	if err != nil {
		utils.Logger.Fatal("Couldn't load AWS config: %v", zap.Error(err))
	}

	_, uploader := utils.SetupS3Client(cfg)
	bucketName := os.Getenv("S3_BUCKET_NAME")
	if bucketName == "" {
		utils.Logger.Fatal("S3_BUCKET_NAME environment variable is not set.")
	}

	basics := handlers.S3Uploader{Uploader: uploader}

	sessionExpiry := 12 * time.Hour
	if value, exists := os.LookupEnv("SESSION_EXPIRY"); exists {
		duration, err := time.ParseDuration(value)
		if err == nil {
			sessionExpiry = duration
		}
	}

	sessionManager := session.NewSessionManager(sessionExpiry)

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	cleanupInterval := 1 * time.Hour
	if value, exists := os.LookupEnv("SESSION_CLEANUP_INTERVAL"); exists {
		duration, err := time.ParseDuration(value)
		if err == nil {
			cleanupInterval = duration
		}
	}

	go func() {
		for {
			time.Sleep(cleanupInterval)
			sessionManager.Cleanup()
		}
	}()

	utils.Logger.Info("Server is starting", zap.String("port", "8080"))

	http.HandleFunc("/", middleware.SessionMiddleware(handlers.RootHandler, sessionManager))
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	http.HandleFunc("/upload", handlers.UploadHandler(basics, bucketName))
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		utils.Logger.Fatal("Failed to listen and serve", zap.Error(err))
	}
}
