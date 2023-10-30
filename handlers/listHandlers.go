package handlers

import (
	"encoding/json"
	"errors"
	"github.com/Rlyehan/onebag-optimizer/utils"
	"html"
	"log"
	"net/http"
	"regexp"
	"unicode/utf8"
)

func saveList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.HandleError(w, http.StatusMethodNotAllowed, errors.New("method not allowed"), "Method Not Allowed")
		return
	}

	var list []map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&list); err != nil {
		utils.HandleError(w, http.StatusBadRequest, err, "JSON parsing failed")
		return
	}

	sanitizedList, err := sanitizeList(list)
	if err != nil {
		utils.HandleError(w, http.StatusBadRequest, err, "Invalid input")
		return
	}

	// Log the sanitized list for now
	log.Printf("Sanitized List: %+v", sanitizedList)

	// TODO: Send list to DB

	response := map[string]string{"message": "List received and processed"}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err, "Failed to write response")
		return
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
