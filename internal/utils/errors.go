package utils

import (
	"encoding/json"
	"net/http"

	"go.uber.org/zap"
)

type ErrorResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

func HandleError(w http.ResponseWriter, logger *zap.Logger, statusCode int, err error, message, source string) {
	logger.Error(message,
		zap.Int("status", statusCode),
		zap.Error(err),
		zap.String("source", source),
	)

	response := ErrorResponse{
		Status:  statusCode,
		Message: http.StatusText(statusCode),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}
