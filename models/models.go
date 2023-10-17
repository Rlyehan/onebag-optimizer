package models

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
	CategoryWeights  map[string]int
	PriorityWeights  map[string]int
	AverageWeight    int
	CategoryWeightPercentage map[string]float64
}

type CategoryWeight struct {
	Category string
	Weight   int
}
