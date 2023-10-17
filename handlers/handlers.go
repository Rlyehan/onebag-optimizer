package handlers

import (
	"encoding/json"
	"html/template"
	"net/http"
	"fmt"
	"log"
	"github.com/Rlyehan/onebag-optimizer/models"
	"github.com/Rlyehan/onebag-optimizer/processor"
	"github.com/Rlyehan/onebag-optimizer/charts"
	"github.com/Rlyehan/onebag-optimizer/utils"
	"io/ioutil"
    "bytes"
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

    // Log the raw payload
    bodyBytes, _ := ioutil.ReadAll(r.Body)
    log.Printf("Received payload: %s", bodyBytes)
    r.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))  // Reset the body so it can be read again

    if r.Method != http.MethodPost {
        log.Println("Method is not POST")
        utils.HandleError(w, http.StatusMethodNotAllowed, fmt.Errorf("Method not allowed"), "Only POST method is allowed")
        return
    }

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

    var categoryWeights []models.CategoryWeight
    for category, weight := range results.CategoryWeights {
        categoryWeights = append(categoryWeights, models.CategoryWeight{
            Category: category,
            Weight:   weight,
        })
    }

    chart, err := charts.CategoryWeightPieChart(categoryWeights)
    if err != nil {
        log.Printf("Pie chart generation error: %v", err)
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