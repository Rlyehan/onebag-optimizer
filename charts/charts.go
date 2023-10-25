package charts

import (
	"bytes"
	"html/template"

	"github.com/Rlyehan/onebag-optimizer/models"
)

type DataPoint struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}

type StackedBarDataPoint struct {
	Label string    `json:"label"`
	Data  []float64 `json:"data"`
}

type ChartData struct {
	ID     string    `json:"id"`
	Labels []string  `json:"labels"`
	Label  string    `json:"label"`
	Data   []float64 `json:"data"`
}

type StackedBarData struct {
	ID       string                `json:"id"`
	Labels   []string              `json:"labels"`
	Datasets []StackedBarDataPoint `json:"datasets"`
}

func CreatePieChart(id string, dataPoints []DataPoint) (template.HTML, error) {
	tmpl, err := template.ParseFiles("templates/pieChart.html")
	if err != nil {
		return "", err
	}

	labels := make([]string, len(dataPoints))
	data := make([]float64, len(dataPoints))
	for i, dp := range dataPoints {
		labels[i] = dp.Label
		data[i] = dp.Value
	}

	chartData := ChartData{
		ID:     id,
		Labels: labels,
		Label:  "Category Weights",
		Data:   data,
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, chartData)
	if err != nil {
		return "", err
	}

	return template.HTML(buf.String()), nil
}

func CreateStackedBarChart(id string, labels []string, datasets []StackedBarDataPoint) (template.HTML, error) {
	tmpl, err := template.ParseFiles("templates/stackedBarChart.html")
	if err != nil {
		return "", err
	}

	stackedBarData := StackedBarData{
		ID:       id,
		Labels:   labels,
		Datasets: datasets,
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, stackedBarData)
	if err != nil {
		return "", err
	}

	return template.HTML(buf.String()), nil
}

func GenerateStackedBarData(id string, items []models.TravelItem) StackedBarData {
	bagTypeCategoryMap := make(map[string]map[string]float64)
	var bagTypesMap = make(map[string]bool)
	var categoriesMap = make(map[string]bool)

	for _, item := range items {
		if _, exists := bagTypeCategoryMap[item.BagType]; !exists {
			bagTypeCategoryMap[item.BagType] = make(map[string]float64)
		}
		bagTypeCategoryMap[item.BagType][item.Category] += float64(item.Weight)

		bagTypesMap[item.BagType] = true
		categoriesMap[item.Category] = true
	}

	bagTypes := make([]string, 0, len(bagTypesMap))
	for bagType := range bagTypesMap {
		bagTypes = append(bagTypes, bagType)
	}

	var datasets []StackedBarDataPoint
	for category := range categoriesMap {
		data := make([]float64, len(bagTypes))
		for i, bagType := range bagTypes {
			data[i] = bagTypeCategoryMap[bagType][category]
		}
		datasets = append(datasets, StackedBarDataPoint{
			Label: category,
			Data:  data,
		})
	}

	return StackedBarData{
		ID:       id,
		Labels:   bagTypes,
		Datasets: datasets,
	}
}
