package utils

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
	"net/http"
	"os"
)

var Logger *zap.Logger

func SetupLogger(filePath string) error {
	config := zap.NewProductionEncoderConfig()
	config.TimeKey = "time"
	config.EncodeTime = zapcore.ISO8601TimeEncoder

	logRotationConfig := lumberjack.Logger{
		Filename:   filePath,
		MaxSize:    10,
		MaxBackups: 3,
		MaxAge:     30,
		Compress:   true,
	}

	fileSyncer := zapcore.AddSync(&logRotationConfig)
	consoleSyncer := zapcore.AddSync(os.Stdout)

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(config),
		zapcore.NewMultiWriteSyncer(fileSyncer, consoleSyncer),
		zap.InfoLevel,
	)

	Logger = zap.New(core)
	return nil
}

func HandleError(w http.ResponseWriter, statusCode int, err error, message string, source string) {
	Logger.Error(message,
		zap.Int("status", statusCode),
		zap.String("error", err.Error()),
		zap.String("source", source),
	)
	http.Error(w, http.StatusText(statusCode), statusCode)
}
