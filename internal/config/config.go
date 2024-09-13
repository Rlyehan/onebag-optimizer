package config

import (
	"context"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
)

type Config struct {
	AWSConfig              aws.Config
	S3BucketName           string
	ServerPort             string
	SessionExpiry          time.Duration
	SessionCleanupInterval time.Duration
}

func Load(ctx context.Context) (*Config, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}

	return &Config{
		AWSConfig:              cfg,
		S3BucketName:           getEnv("S3_BUCKET_NAME", ""),
		ServerPort:             getEnv("SERVER_PORT", "8080"),
		SessionExpiry:          getDuration("SESSION_EXPIRY", 12*time.Hour),
		SessionCleanupInterval: getDuration("SESSION_CLEANUP_INTERVAL", 1*time.Hour),
	}, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getDuration(key string, fallback time.Duration) time.Duration {
	if value, exists := os.LookupEnv(key); exists {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return fallback
}
