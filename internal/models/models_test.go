package models

import (
	"testing"
)

func TestValidateItem(t *testing.T) {
	tests := []struct {
		name    string
		item    TravelItem
		wantErr bool
	}{
		{
			name: "Valid item",
			item: TravelItem{
				Name:     "Test Item",
				Amount:   1,
				Weight:   100,
				Category: "Clothing",
				Priority: "High",
				BagType:  "Carry-on",
			},
			wantErr: false,
		},
		{
			name: "Name too long",
			item: TravelItem{
				Name:     string(make([]rune, MaxItemNameLength+1)),
				Amount:   1,
				Weight:   100,
				Category: "Clothing",
				Priority: "High",
				BagType:  "Carry-on",
			},
			wantErr: true,
		},
		{
			name: "Invalid amount",
			item: TravelItem{
				Name:     "Test Item",
				Amount:   0,
				Weight:   100,
				Category: "Clothing",
				Priority: "High",
				BagType:  "Carry-on",
			},
			wantErr: true,
		},
		{
			name: "Weight too high",
			item: TravelItem{
				Name:     "Test Item",
				Amount:   1,
				Weight:   MaxItemWeight + 1,
				Category: "Clothing",
				Priority: "High",
				BagType:  "Carry-on",
			},
			wantErr: true,
		},
		{
			name: "Missing category",
			item: TravelItem{
				Name:     "Test Item",
				Amount:   1,
				Weight:   100,
				Priority: "High",
				BagType:  "Carry-on",
			},
			wantErr: true,
		},
		// Add more test cases as needed
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateItem(tt.item)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateItem() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestValidateList(t *testing.T) {
	validItem := TravelItem{
		Name:     "Valid Item",
		Amount:   1,
		Weight:   100,
		Category: "Clothing",
		Priority: "High",
		BagType:  "Carry-on",
	}

	tests := []struct {
		name    string
		list    []TravelItem
		wantErr bool
	}{
		{
			name:    "Valid list",
			list:    []TravelItem{validItem, validItem},
			wantErr: false,
		},
		{
			name:    "Empty list",
			list:    []TravelItem{},
			wantErr: false,
		},
		{
			name:    "List too long",
			list:    make([]TravelItem, MaxListLength+1),
			wantErr: true,
		},
		{
			name: "List with invalid item",
			list: []TravelItem{
				validItem,
				{Name: "Invalid Item", Amount: 0},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateList(tt.list)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateList() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
