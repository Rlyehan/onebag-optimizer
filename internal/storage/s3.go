package storage

import (
	"bytes"
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Client struct {
	client   *s3.Client
	uploader *manager.Uploader
}

func NewS3Client(ctx context.Context, cfg aws.Config) (*S3Client, error) {
	client := s3.NewFromConfig(cfg)
	uploader := manager.NewUploader(client)

	return &S3Client{
		client:   client,
		uploader: uploader,
	}, nil
}

func (c *S3Client) UploadData(bucketName, objectKey string, data []byte) error {
	_, err := c.uploader.Upload(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
		Body:   bytes.NewReader(data),
	})
	return err
}
