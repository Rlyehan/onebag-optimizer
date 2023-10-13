package main

import (
	"net/http"
	"strings"
	"strconv"
	"html/template"
	"encoding/json"
	"sort"
	"fmt"
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
	tmpl, err := template.ParseFiles("index.html")
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

		fmt.Println("Received form data:", r.PostForm)

		names := r.PostForm["Name[]"]
		amounts := r.PostForm["Amount[]"]
		weights := r.PostForm["Weight[]"]
		categories := r.PostForm["Category[]"]
		subcategories := r.PostForm["subcategory[]"]
		priorities := r.PostForm["priority[]"]
		bagTypes := r.PostForm["bagtype[]"]

		fmt.Println("Names length:", len(names))
		fmt.Println("Amounts length:", len(amounts))
		fmt.Println("Weights length:", len(weights))
		fmt.Println("Categories length:", len(categories))
		fmt.Println("Subcategories length:", len(subcategories))
		fmt.Println("Priorities length:", len(priorities))
		fmt.Println("BagTypes length:", len(bagTypes))

		var items []TravelItem

		i := 1
		for {
			nameKey := fmt.Sprintf("Name%d", i)
			if _, ok := r.PostForm[nameKey]; !ok {
				break
			}

			item := TravelItem{
				Name:        strings.TrimSpace(r.PostFormValue(fmt.Sprintf("Name%d", i))),
				Amount:      atoi(r.PostFormValue(fmt.Sprintf("Amount%d", i)), 1),
				Weight:      atoi(r.PostFormValue(fmt.Sprintf("Weight%d", i)), 0),
				Category:    r.PostFormValue(fmt.Sprintf("Category%d", i)),
				Subcategory: strings.TrimSpace(r.PostFormValue(fmt.Sprintf("Subcategory%d", i))),
				Priority:    atoi(r.PostFormValue(fmt.Sprintf("Priority%d", i)), 1),
				BagType:     atoi(r.PostFormValue(fmt.Sprintf("BagType%d", i)), 1),
			}

			items = append(items, item)
			i++
		}
		
		fmt.Println("Processed items:", items)

		results := dataProcessing(items)

		fmt.Println("Analysis results:", results)

		tmpl, err := template.ParseFiles("analysis.html")
		if err != nil {
			http.Error(w, "could not load template", http.StatusInternalServerError)
			return
		}

		err = tmpl.Execute(w, results)
		if err != nil {
			http.Error(w, "Error executing template"+err.Error(), http.StatusInternalServerError)
		}
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