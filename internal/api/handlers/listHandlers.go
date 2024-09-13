package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"regexp"
	"unicode/utf8"

	"github.com/Rlyehan/onebag-optimizer/internal/models"
	"github.com/Rlyehan/onebag-optimizer/internal/storage"
	"github.com/Rlyehan/onebag-optimizer/internal/utils"
	"go.uber.org/zap"
)

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

type ListHandler struct {
	logger     *zap.Logger
	s3Client   *storage.S3Client
	bucketName string
}

func NewListHandler(logger *zap.Logger, s3Client *storage.S3Client, bucketName string) *ListHandler {
	return &ListHandler{
		logger:     logger,
		s3Client:   s3Client,
		bucketName: bucketName,
	}
}

func (h *ListHandler) UploadList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.HandleError(w, h.logger, http.StatusMethodNotAllowed, nil, "Only POST method allowed", "UploadList")
		return
	}

	objectKey := r.Header.Get("X-Object-Key")
	if objectKey == "" {
		utils.HandleError(w, h.logger, http.StatusBadRequest, nil, "Object Key Header missing", "UploadList")
		return
	}

	var list []models.TravelItem
	if err := json.NewDecoder(r.Body).Decode(&list); err != nil {
		utils.HandleError(w, h.logger, http.StatusBadRequest, err, "JSON parsing failed", "UploadList")
		return
	}

	sanitizedList, err := h.sanitizeList(list)
	if err != nil {
		utils.HandleError(w, h.logger, http.StatusBadRequest, err, "Invalid input", "UploadList")
		return
	}

	jsonData, err := json.Marshal(sanitizedList)
	if err != nil {
		utils.HandleError(w, h.logger, http.StatusInternalServerError, err, "Error preparing upload data", "UploadList")
		return
	}

	err = h.s3Client.UploadData(h.bucketName, objectKey, jsonData)
	if err != nil {
		utils.HandleError(w, h.logger, http.StatusInternalServerError, err, "Failed data upload", "UploadList")
		return
	}

	fmt.Fprintf(w, "Upload successful for: %v", objectKey)
}

func (h *ListHandler) sanitizeList(list []models.TravelItem) ([]models.TravelItem, error) {
	if len(list) > MaxListLength {
		return nil, errors.New("list length exceeds maximum allowed")
	}

	sanitizedList := make([]models.TravelItem, 0, len(list))

	for _, item := range list {
		if utf8.RuneCountInString(item.Name) > MaxItemNameLength {
			return nil, errors.New("Item name is too long")
		}

		if urlPattern.MatchString(item.Name) || htmlPattern.MatchString(item.Name) || sqlPattern.MatchString(item.Name) {
			return nil, errors.New("item name contains disallowed content")
		}

		item.Name = html.EscapeString(item.Name)

		if item.Weight <= 0 || item.Weight > MaxItemWeight {
			return nil, errors.New("item weight is invalid")
		}

		sanitizedList = append(sanitizedList, item)
	}

	return sanitizedList, nil
}
