package main

import (
	"reflect"
	"testing"
	"os"
	"io/ioutil"
	"strings"
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

func TestAddItemHandler(t *testing.T) {
	itemsList = []TravelItem{}

	r1 := httptest.NewRequest("POST", "/add", strings.NewReader("itemName=TestItem1&itemAmount=1&itemWeight=100&itemCategory=Bags&itemSubcategory=Backpack&itemPriority=1&itemBagType=1"))
	r1.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	w1 := httptest.NewRecorder()

	addItemHandler(w1, r1)

	r2 := httptest.NewRequest("POST", "/add", strings.NewReader("itemName=TestItem2&itemAmount=2&itemWeight=200&itemCategory=Electronics&itemSubcategory=Camera&itemPriority=2&itemBagType=2"))
	r2.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	w2 := httptest.NewRecorder()

	addItemHandler(w2, r2)

	if len(itemsList) != 2 {
		t.Fatalf("Expected 2 items in itemsList, but got %d", len(itemsList))
	}

	item1 := itemsList[0]
	if item1.Name != "TestItem1" {
		t.Errorf("Expected first item name to be TestItem1, but got %s", item1.Name)
	}

	item2 := itemsList[1]
	if item2.Name != "TestItem2" {
		t.Errorf("Expected second item name to be TestItem2, but got %s", item2.Name)
	}
}