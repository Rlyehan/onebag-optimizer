package handlers

import (
	"encoding/json"
	"html/template"
	"net/http"
	"fmt"
	"github.com/Rlyehan/onebag-optimizer/models"
	"github.com/Rlyehan/onebag-optimizer/processor"
	"github.com/Rlyehan/onebag-optimizer/charts"
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
	if r.Method != http.MethodPost {
		utils.HandleError(w, http.StatusMethodNotAllowed, fmt.Errorf("Method not allowed"), "Only POST method is allowed")
		return
	}

	var items []models.TravelItem
	err := json.NewDecoder(r.Body).Decode(&items)
	if err != nil {
		utils.HandleError(w, http.StatusBadRequest, err, "Error decoding JSON")
		return
	}

	for _, item := range items {
		if !processor.IsValidTravelItem(item) {
			utils.HandleError(w, http.StatusUnprocessableEntity, fmt.Errorf("Invalid travel item data"), "Invalid travel item data")
			return
		}
	}

	results := processor.DataProcessing(items)

	var categoryWeights []models.CategoryWeight
	for category, weight := range results.CategoryWeights {
		categoryWeights = append(categoryWeights, models.CategoryWeight{
			Category: category,
			Weight:   weight,
		})
	}
	chart, err := charts.CategoryWeightPieChart(categoryWeights)
	if err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err, "Failed to generate the pie chart")
		return
	}

	data := struct {
		Analysis models.AnalysisResult
		Chart    template.HTML
	}{
		Analysis: results,
		Chart:    chart,
	}

	tmpl, err := template.ParseFiles("./templates/analysis.html")
	if err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err, "Could not load template")
		return
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err, "Error executing template")
	}
}