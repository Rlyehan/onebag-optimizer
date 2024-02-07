package utils

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"net/http"
	"os"
)

var Logger *zap.Logger

func SetupLogger(filePath string) error {
	config := zap.NewProductionEncoderConfig()
	config.TimeKey = "time"
	config.EncodeTime = zapcore.ISO8601TimeEncoder

	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(config),
		zapcore.AddSync(file),
		zap.InfoLevel,
	)

	Logger = zap.New(core)
	return nil
}

func HandleError(w http.ResponseWriter, statusCode int, err error, message string) {
	Logger.Error(message, zap.Int("status", statusCode), zap.String("error", err.Error()))
	http.Error(w, http.StatusText(statusCode), statusCode)
}
