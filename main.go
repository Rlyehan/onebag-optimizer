package main

import (
	"net/http"
	"html/template"
	"encoding/json"
	"sort"
	"github.com/go-echarts/go-echarts/v2/charts"
	"github.com/go-echarts/go-echarts/v2/opts"
	"bytes"
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

type CategoryWeight struct {
	Category	string
	Weight		int
}

func main() {
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/process", processHandler)
	http.ListenAndServe(":8080", nil)
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("./static/index.html")
	if err != nil {
		http.Error(w, "Could not load template", http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var items []TravelItem
	err := json.NewDecoder(r.Body).Decode(&items)
	if err != nil {
		http.Error(w, "Error decoding JSON", http.StatusBadRequest)
		return
	}

	results := dataProcessing(items)

	tmpl, err := template.ParseFiles("./templates//analysis.html")
	if err != nil {
		http.Error(w, "could not load template", http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, results)
	if err != nil {
		http.Error(w, "Error executing template: "+err.Error(), http.StatusInternalServerError)
	}
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


func generatePieItems(data []CategoryWeight) []opts.PieData {
	var items []opts.PieData
	for _, item := range data {
		items = append(items, opts.PieData{Name: item.Category, Value: item.Weight})
	}
	return items
}

func categoryWeightPieChart(data []CategoryWeight) string {
	pie := charts.NewPie()
	pie.SetGlobalOptions(
		charts.WithTitleOpts(
			opts.Title{
				Title:    "Weight distribution per Category",
				Subtitle: "Analyzed from travel items",
			},
		),
	)
	pie.SetSeriesOptions()
	pie.AddSeries("Category Weights",
		generatePieItems(data)).
		SetSeriesOptions(
			charts.WithPieChartOpts(
				opts.PieChart{
					Radius: 200,
				},
			),
			charts.WithLabelOpts(
				opts.Label{
					Show:      true,
					Formatter: "{b}: {c}",
				},
			),
		)
		buffer := new(bytes.Buffer)
		err := pie.Render(buffer)
		if err != nil {
			return "Could not generate the Pie Chart."
		}
		return buffer.String()
}