package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
	"regexp"
	"unicode/utf8"

	"github.com/Rlyehan/onebag-optimizer/utils"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go.uber.org/zap"
)

type S3Uploader struct {
	Uploader *manager.Uploader
}

func (basics S3Uploader) UploadData(bucketName, objectKey string, stream io.Reader) error {
	_, err := basics.Uploader.Upload(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
		Body:   stream,
	})
	if err != nil {
		utils.Logger.Error("Couldn't upload",
			zap.String("bucket", bucketName),
			zap.String("Object", objectKey),
			zap.Error(err),
		)
	}
	return err
}

func UploadHandler(basics S3Uploader, bucketName string) http.HandlerFunc {
	return func(res http.ResponseWriter, req *http.Request) {
		if req.Method != "POST" {
			utils.HandleError(res, http.StatusMethodNotAllowed, errors.New("Only POST method allowed"), "Method Not Allowed", "UploadHandler")
			return
		}
		objectKey := req.Header.Get("X-Object-Key")
		if objectKey == "" {
			utils.HandleError(res, http.StatusBadRequest, errors.New("Object Key Header missing"), "Object Key Header Missing", "UploadHandler")
			return
		}

		var list []map[string]interface{}
		if err := json.NewDecoder(req.Body).Decode(&list); err != nil {
			utils.HandleError(res, http.StatusBadRequest, err, "JSON parsing failed", "UploadHandler")
			return
		}

		sanitizedList, err := sanitizeList(list)
		if err != nil {
			utils.HandleError(res, http.StatusBadRequest, err, "Invalid input", "UploadHandler")
			return
		}

		jsonData, err := json.Marshal(sanitizedList)
		if err != nil {
			utils.HandleError(res, http.StatusInternalServerError, err, "Error preparing upload data", "UploadHandler")
			return
		}

		err = basics.UploadData(bucketName, objectKey, bytes.NewReader(jsonData))
		if err != nil {
			utils.HandleError(res, http.StatusInternalServerError, err, "Failed data upload", "UploadHandler")
			return
		}
		fmt.Fprintf(res, "Upload successful for: %v", objectKey)
	}
}

const (
	MaxItemNameLength = 256
	MaxListLength     = 256
	MaxItemWeight     = 10000
)

var (
	urlPattern  = regexp.MustCompile(`https?://`)
	htmlPattern = regexp.MustCompile(`<[^>]*>`)
	sqlPattern  = regexp.MustCompile(`(?i)(select|union|insert|delete|update|drop|;|--|\x00)`)
)

func sanitizeList(list []map[string]interface{}) ([]map[string]interface{}, error) {
	if len(list) > MaxListLength {
		return nil, errors.New("list length exceeds maximum allowed")
	}

	sanitizedList := make([]map[string]interface{}, 0, len(list))

	for _, item := range list {
		itemName, ok := item["itemName"].(string)
		if !ok || utf8.RuneCountInString(itemName) > MaxItemNameLength {
			return nil, errors.New("Item name is invalid or too long.")
		}

		if urlPattern.MatchString(itemName) || htmlPattern.MatchString(itemName) || sqlPattern.MatchString(itemName) {
			return nil, errors.New("item name contains disallowed content")
		}

		item["itemName"] = html.EscapeString(itemName)

		itemWeight, ok := item["itemWeight"].(int)
		if !ok || itemWeight <= 0 || itemWeight > MaxItemWeight {
			return nil, errors.New("item weight is invalid")
		}

		sanitizedList = append(sanitizedList, item)
	}
	return sanitizedList, nil
}
