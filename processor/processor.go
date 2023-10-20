package processor

import (
	"github.com/Rlyehan/onebag-optimizer/models"
	"sort"
)

func formatBagType(bagType string) string {
	switch bagType {
	case "carryOn":
		return "Carry On"
	case "personalItem":
		return "Personal Item"
	default:
		return bagType
	}
}


func DataProcessing(items []models.TravelItem) models.AnalysisResult {
	totalWeight := 0
	bagWeights := make(map[string]int)
	categoryWeights := make(map[string]int)
	priorityWeights := make(map[string]int)

	for _, item := range items {
		itemWeightInt := item.Weight
		itemAmountInt := item.Amount
		itemTotalWeight := itemWeightInt * itemAmountInt
		totalWeight += itemTotalWeight
		priorityWeights[item.Priority] += itemTotalWeight
		categoryWeights[item.Category] += itemTotalWeight
		formattedBagType := formatBagType(item.BagType)
		bagWeights[formattedBagType] += itemTotalWeight
	}

	averageWeight := 0
	if len(items) > 0 {
		averageWeight = totalWeight / len(items)
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

	categoryWeightPercentage := make(map[string]float64)
	for category, weight := range categoryWeights {
		categoryWeightPercentage[category] = float64(weight) / float64(totalWeight) * 100
	}

	return models.AnalysisResult{
		TotalWeight:      totalWeight,
		TopHeaviestItems: topHeaviestItems,
		BagWeights:       bagWeights,
		AverageWeight:	  averageWeight,
		PriorityWeights:  priorityWeights,
		CategoryWeights:   categoryWeights,
		CategoryWeightPercentage: categoryWeightPercentage,
	}
}

func IsValidTravelItem(item models.TravelItem) bool {
    if item.Name == "" {
        return false
    }
    if item.Amount < 0 {
        return false
    }
    if item.Weight < 0 {
        return false
    }
    return true
}