package models

import (
	"fmt"
	"regexp"
	"unicode/utf8"
)

type TravelItem struct {
	Name        string `json:"itemName"`
	Amount      int    `json:"itemAmount"`
	Weight      int    `json:"itemWeight"`
	Category    string `json:"itemCategory"`
	Subcategory string `json:"itemSubcategory"`
	Priority    string `json:"itemPriority"`
	BagType     string `json:"itemBagType"`
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

func ValidateList(list []TravelItem) error {
	if len(list) > MaxListLength {
		return fmt.Errorf("list length exceeds maximum allowed (%d)", MaxListLength)
	}

	for _, item := range list {
		if err := ValidateItem(item); err != nil {
			return err
		}
	}

	return nil
}

func ValidateItem(item TravelItem) error {
	if utf8.RuneCountInString(item.Name) > MaxItemNameLength {
		return fmt.Errorf("item name '%s' exceeds maximum length (%d)", item.Name, MaxItemNameLength)
	}

	if item.Amount <= 0 {
		return fmt.Errorf("item '%s' has invalid amount (%d)", item.Name, item.Amount)
	}

	if item.Weight <= 0 || item.Weight > MaxItemWeight {
		return fmt.Errorf("item '%s' has invalid weight (%d)", item.Name, item.Weight)
	}

	if item.Category == "" {
		return fmt.Errorf("item '%s' is missing category", item.Name)
	}

	if item.Priority == "" {
		return fmt.Errorf("item '%s' is missing priority", item.Name)
	}

	if item.BagType == "" {
		return fmt.Errorf("item '%s' is missing bag type", item.Name)
	}

	return nil
}
