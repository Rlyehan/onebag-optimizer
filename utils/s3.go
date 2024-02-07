package utils

import (
	"context"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func LoadConfig(ctx context.Context) (aws.Config, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return aws.Config{}, err
	}
	return cfg, nil
}

func SetupS3Client(cfg aws.Config) (*s3.Client, *manager.Uploader) {
	client := s3.NewFromConfig(cfg)
	uploader := manager.NewUploader(client)
	return client, uploader
}
