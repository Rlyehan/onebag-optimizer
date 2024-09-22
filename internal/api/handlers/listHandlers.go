package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Rlyehan/onebag-optimizer/internal/metrics"
	"github.com/Rlyehan/onebag-optimizer/internal/models"
	"github.com/Rlyehan/onebag-optimizer/internal/storage"
	"github.com/Rlyehan/onebag-optimizer/internal/utils"
	"go.uber.org/zap"
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

	if err := models.ValidateList(list); err != nil {
		utils.HandleError(w, h.logger, http.StatusBadRequest, err, "Invalid input", "UploadList")
		return
	}

	metrics.UploadRequests.Inc()
	metrics.ListItemCount.Observe(float64(len(list)))

	jsonData, err := json.Marshal(list)
	if err != nil {
		utils.HandleError(w, h.logger, http.StatusInternalServerError, err, "Error preparing upload data", "UploadList")
		return
	}

	err = h.s3Client.UploadData(h.bucketName, objectKey, jsonData)
	if err != nil {
		utils.HandleError(w, h.logger, http.StatusInternalServerError, err, "Failed data upload", "UploadList")
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Upload successful"))
}
