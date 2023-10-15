package main

import (
	"bytes"
	"encoding/json"
	"github.com/go-echarts/go-echarts/v2/charts"
	"github.com/go-echarts/go-echarts/v2/opts"
	chartrender "github.com/go-echarts/go-echarts/v2/render"
	"html/template"
	"log"
	"net/http"
	"sort"
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

type AnalysisResult struct {
	TotalWeight      int
	TopHeaviestItems []TravelItem
	BagWeights       map[string]int
}

type CategoryWeight struct {
	Category string
	Weight   int
}

func main() {
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/process", processHandler)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
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
	categoryWeights := extractCategoryWeights(items)
	chart := categoryWeightPieChart(categoryWeights)

	data := struct {
		Analysis AnalysisResult
		Chart    template.HTML
	}{
		Analysis: results,
		Chart:    chart,
	}

	tmpl, err := template.ParseFiles("./templates/analysis.html")
	if err != nil {
		http.Error(w, "could not load template", http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		http.Error(w, "Error executing template: "+err.Error(), http.StatusInternalServerError)
	}
}

func dataProcessing(items []TravelItem) AnalysisResult {
	totalWeight := 0
	bagWeights := make(map[string]int)

	for _, item := range items {
		itemWeightInt := item.Weight
		itemAmountInt := item.Amount
		itemTotalWeight := itemWeightInt * itemAmountInt
		totalWeight += itemTotalWeight
		bagWeights[item.BagType] += itemTotalWeight
	}

	sort.Slice(items, func(i, j int) bool {
		weightI := items[i].Weight
		weightJ := items[j].Weight
		return weightI > weightJ
	})

	topItemsCount := 5
	if len(items) < topItemsCount {
		topItemsCount = len(items)
	}

	topHeaviestItems := items[:topItemsCount]

	return AnalysisResult{
		TotalWeight:      totalWeight,
		TopHeaviestItems: topHeaviestItems,
		BagWeights:       bagWeights,
	}
}

func extractCategoryWeights(items []TravelItem) []CategoryWeight {
	categoryWeightMap := make(map[string]int)

	for _, item := range items {
		itemWeightInt := item.Weight
		itemAmountInt := item.Amount
		weight := itemWeightInt * itemAmountInt
		categoryWeightMap[item.Category] += weight
	}

	var categoryWeights []CategoryWeight
	for category, weight := range categoryWeightMap {
		categoryWeights = append(categoryWeights, CategoryWeight{
			Category: category,
			Weight:   weight,
		})
	}
	return categoryWeights
}

func generatePieItems(data []CategoryWeight) []opts.PieData {
	var items []opts.PieData
	for _, item := range data {
		items = append(items, opts.PieData{Name: item.Category, Value: item.Weight})
	}
	return items
}

func renderToHtml(c interface{}) template.HTML {
	var buf bytes.Buffer
	r := c.(chartrender.Renderer)
	err := r.Render(&buf)
	if err != nil {
		log.Printf("Failed to render chart: %s", err)
		return ""
	}

	return template.HTML(buf.String())
}

func categoryWeightPieChart(data []CategoryWeight) template.HTML {
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
	return renderToHtml(pie)
}
