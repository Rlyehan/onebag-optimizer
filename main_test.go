package main

import (
	"reflect"
	"testing"
	"os"
	"io/ioutil"
	"strings"
	"bytes"
	"net/http"
	"net/http/httptest"
)

func TestDataProcessing(t *testing.T) {
	items := []TravelItem{
		{Name: "Item1", Weight: 200, Amount: 2, BagType: 1},
		{Name: "Item2", Weight: 300, Amount: 1, BagType: 2},
		{Name: "Item3", Weight: 100, Amount: 3, BagType: 1},
		{Name: "HeavyItem", Weight: 500, Amount: 2, BagType: 2},
	}

	result := dataProcessing(items)

	if result.TotalWeight != 2000 {
		t.Errorf("Expected total weight to be 2000 but got %d", result.TotalWeight)
	}

	if len(result.TopHeaviestItems) != 4 { 
		t.Errorf("Expected top items count to be 4 but got %d", len(result.TopHeaviestItems))
	}

	if result.TopHeaviestItems[0].Name != "HeavyItem" {
		t.Errorf("Expected the heaviest item to be 'HeavyItem' but got %s", result.TopHeaviestItems[0].Name)
	}

	expectedBagWeights := map[int]int{
		1: 700,
		2: 1300,
	}

	if !reflect.DeepEqual(result.BagWeights, expectedBagWeights) {
		t.Errorf("Expected bag weights to be %+v but got %+v", expectedBagWeights, result.BagWeights)
	}
}

func TestCategoryWeightPieChart(t *testing.T) {
	data := []CategoryWeight{
		{Category: "Clothing", Weight: 2000},
		{Category: "Electronics", Weight: 1500},
		{Category: "Grooming", Weight: 1200},
	}

	htmlContent := categoryWeightPieChart(data)

	err := ioutil.WriteFile("pie.html", []byte(htmlContent), 0644)
	if err != nil {
		t.Fatalf("Error writing to pie.html: %v", err)
	}

	if _, err := os.Stat("pie.html"); os.IsNotExist(err) {
		t.Fatalf("Expected pie.html to be generated, but it wasn't.")
	}

	content, err := ioutil.ReadFile("pie.html")
	if err != nil {
		t.Fatalf("Could not read pie.html: %v", err)
	}

	if !strings.Contains(string(content), "Weight distribution per Category") {
		t.Fatalf("Expected title not found in pie.html")
	}
}

func TestProcessHandler(t *testing.T) {

	reqBody := `[
		{
			"name": "TestItem1",
			"amount": 2,
			"weight": 500,
			"category": "clothing",
			"subcategory": "shirts",
			"priority": 1,
			"bagtype": 1
		},
		{
			"name": "TestItem2",
			"amount": 1,
			"weight": 1000,
			"category": "electronics",
			"subcategory": "laptop",
			"priority": 2,
			"bagtype": 2
		}
	]`
	req, err := http.NewRequest("POST", "/process", bytes.NewBufferString(reqBody))
	if err != nil {
		t.Fatal(err)
	}

	recorder := httptest.NewRecorder()

	processHandler(recorder, req)

	if status := recorder.Code; status != http.StatusOK {
		t.Errorf("Handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
}