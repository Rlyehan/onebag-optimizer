package main

import (
	"net/http"
	"strings"
	"strconv"
	"html/template"
	"encoding/json"
	"sort"
	"fmt"
	"github.com/go-echarts/go-echarts/v2/charts"
	"github.com/go-echarts/go-echarts/v2/opts"
	"bytes"
)

var itemsList []TravelItem

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
	http.HandleFunc("/add", addItemHandler)
	http.HandleFunc("/process", processHandler)
	http.HandleFunc("/download", downloadHandler)
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

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	items, err := parseTravelItems(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	sendJSON(w, items)
}

func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	items := itemsList
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

func atoi(s string, defaultValue int) int {
	value, err := strconv.Atoi(s)
	if err != nil {
		return defaultValue
	}
	return value
}

func addItemHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	item := TravelItem{
		Name:        r.FormValue("itemName"),
		Amount:      atoi(r.FormValue("itemAmount"), 1),
		Weight:      atoi(r.FormValue("itemWeight"), 0),
		Category:    r.FormValue("itemCategory"),
		Subcategory: r.FormValue("itemSubcategory"),
		Priority:    atoi(r.FormValue("itemPriority"), 1),
		BagType:     atoi(r.FormValue("itemBagType"), 1),
	}

	itemsList = append(itemsList, item)

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Item added")
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

func parseTravelItems(r *http.Request) ([]TravelItem, error) {
	err := r.ParseForm()
	if err != nil {
		return nil, fmt.Errorf("error parsing data: %v", err)
	}

	var items []TravelItem
	i := 1
	for {
		nameKey := fmt.Sprintf("Name%d", i)
		if _, ok := r.PostForm[nameKey]; !ok {
			break
		}

		item := TravelItem{
			Name:        strings.TrimSpace(r.PostFormValue(nameKey)),
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

	return items, nil
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
