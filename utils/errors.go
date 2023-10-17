package utils

import (
	"log"
	"net/http"
)

func HandleError(w http.ResponseWriter, statusCode int, err error, logMessage string) {
    log.Printf("%s: %s", logMessage, err)
    http.Error(w, http.StatusText(statusCode), statusCode)
}