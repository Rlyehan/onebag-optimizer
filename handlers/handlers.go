package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"

	"github.com/Rlyehan/onebag-optimizer/charts"
	"github.com/Rlyehan/onebag-optimizer/models"
	"github.com/Rlyehan/onebag-optimizer/processor"
	"github.com/Rlyehan/onebag-optimizer/utils"
)

func RootHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("./static/index.html")
	if err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err, "Failed to load template")
		return
	}
	if err = tmpl.Execute(w, nil); err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err, "Error executing template")
		return
	}
}

func ProcessHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Entered ProcessHandler")

	bodyBytes, _ := io.ReadAll(r.Body)
	log.Printf("Received payload: %s", bodyBytes)
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	if r.Method != http.MethodPost {
		log.Println("Method is not POST")
		utils.HandleError(w, http.StatusMethodNotAllowed, fmt.Errorf("Method not allowed"), "Only POST method is allowed")
		return
	}

	defer r.Body.Close()

	var items []models.TravelItem
	err := json.NewDecoder(r.Body).Decode(&items)
	if err != nil {
		log.Printf("JSON decoding error: %v", err)
		utils.HandleError(w, http.StatusBadRequest, err, "Error decoding JSON")
		return
	}

	log.Printf("Decoded %d items", len(items))

	for _, item := range items {
		if !processor.IsValidTravelItem(item) {
			log.Printf("Invalid item detected: %+v", item)
			utils.HandleError(w, http.StatusUnprocessableEntity, fmt.Errorf("Invalid travel item data"), "Invalid travel item data")
			return
		}
	}

	results := processor.DataProcessing(items)

	var categoryWeights []charts.DataPoint
	for category, weight := range results.CategoryWeights {
		categoryWeights = append(categoryWeights, charts.DataPoint{
			Label: category,
			Value: float64(weight),
		})
	}

	pieChart, err := charts.CreatePieChart("CategoryWeightsPieChart", categoryWeights)
	if err != nil {
		log.Printf("Pie chart generation error: %v", err)
		utils.HandleError(w, http.StatusInternalServerError, err, "Failed to generate the pie chart")
		return
	}

	stackedBarData := charts.GenerateStackedBarData("CategoryWeightsBarChart", items)
	stackedBarChart, err := charts.CreateStackedBarChart(stackedBarData.ID, stackedBarData.Labels, stackedBarData.Datasets)
	if err != nil {
		log.Printf("Stacked bar chart generation error: %v", err)
		utils.HandleError(w, http.StatusInternalServerError, err, "Failed to generate the stacked bar chart")
		return
	}

	data := struct {
		Analysis        models.AnalysisResult
		PieChart        template.HTML
		StackedBarChart template.HTML
	}{
		Analysis:        results,
		PieChart:        pieChart,
		StackedBarChart: stackedBarChart,
	}

	tmpl, err := template.ParseFiles("./templates/analysis.html")
	if err != nil {
		log.Printf("Template loading error: %v", err)
		utils.HandleError(w, http.StatusInternalServerError, err, "Could not load template")
		return
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		log.Printf("Template execution error: %v", err)
		utils.HandleError(w, http.StatusInternalServerError, err, "Error executing template")
	}
}
