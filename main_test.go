package main

import (
	"reflect"
	"testing"
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
