package main

import (
	"net/http"
	"strings"
	"strconv"
	"html/template"
	"encoding/json"
	"sort"
)

type TravelItem struct {
	Name        string  `json:"name"`
	Amount      int     `json:"amount"`
	Weight      int		`json:"weight"`
	Category    string  `json:"category"`
	Subcategory string  `json:"subcategory"`
	Priority    int	    `json:"priority"`
	BagType     int     `json:"bagtype"`
}

type AnalysisResult struct {
	TotalWeight          int
	TopHeaviestItems     []TravelItem
	BagWeights           map[int]int
}

func main() {
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/process", processHandler)
	http.ListenAndServe(":8080", nil)
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/index.html")
	if err != nil {
		http.Error(w, "Could not load template", http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Could not parse form", http.StatusBadRequest)
			return
		}

		names := r.PostForm["Name[]"]
		amounts := r.PostForm["Amount[]"]
		weights := r.PostForm["Weight[]"]
		categories := r.PostForm["Category[]"]
		subcategories := r.PostForm["subcategory[]"]
		priorities := r.PostForm["priority[]"]
		bagTypes := r.PostForm["bagtype[]"]

		var items []TravelItem

		for i, _ := range names {
			item := TravelItem{
				Name:        strings.TrimSpace(names[i]),
				Amount:      atoi(amounts[i], 0),
				Weight:      atoi(weights[i], 0),
				Category:    categories[i],
				Subcategory: strings.TrimSpace(subcategories[i]),
				Priority:    atoi(priorities[i], 1),
				BagType:     atoi(bagTypes[i], 1),
			}
			items = append(items, item)
		}
		sendJSON(w, items)
	}
}

func atoi(s string, defaultValue int) int {
	value, err := strconv.Atoi(s)
	if err != nil {
		return defaultValue
	}
	return value
}

func generateJSON(items []TravelItem) ([]byte, error) {
	return json.Marshal(items)
}

func sendJSON(w http.ResponseWriter, items []TravelItem) {
	jsonData, err := generateJSON(items)
	if err != nil {
		http.Error(w, "Failed to generate JSON", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=travelItems.json")
	w.Write(jsonData)
}

func dataProcessing(items []TravelItem) AnalysisResult {
	totalWeight := 0
	bagWeights := make(map[int]int)

	for _, item := range items {
		itemTotalWeight := item.Weight * item.Amount
		totalWeight += itemTotalWeight
		bagWeights[item.BagType] += itemTotalWeight
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Weight > items[j].Weight
	})

	topItemsCount := 5
	if len(items) < topItemsCount {
		topItemsCount = len(items)
	}

	topHeaviestItems := items[:topItemsCount]

	return AnalysisResult{
		TotalWeight:          totalWeight,
		TopHeaviestItems:     topHeaviestItems,
		BagWeights:           bagWeights,
	}
}