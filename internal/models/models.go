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
