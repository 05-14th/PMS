// File: backend/internal/planning/service.go
package planning

import (
	"context"
	"fmt"
	"math"
	"sort"
)

type Service struct {
	repo *Repository
}
type ProcurementItem struct {
	ItemName string  `json:"itemName"`
	Quantity float64 `json:"quantity"`
	Unit     string  `json:"unit"`
}

type PhasePlan struct {
		Phase string            `json:"phase"`
		Items []ProcurementItem `json:"items"`
	}
type CategoryPlan struct {
	Category string            `json:"category"`
	Items    []ProcurementItem `json:"items"`
}

type ProcurementPlan struct {
	AverageDuration float64        `json:"averageDuration"`
	ChickenCount    int            `json:"chickenCount"`
	Plan            []CategoryPlan `json:"plan"`
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetBatchStatus(ctx context.Context, batchID int) (string, error) {
    return s.repo.GetBatchStatus(ctx, batchID)
}

func (s *Service) GenerateProcurementPlan(ctx context.Context, chickenCount int, durationDays int) (*ProcurementPlan, error) {
	avgDuration, err := s.repo.GetHistoricalAvgDuration(ctx)
	if err != nil { return nil, err }

	historicalFinisherName, err := s.repo.GetHistoricalFinisherFeedName(ctx)
	if err != nil { return nil, err }

	dailyIntakeGrams := []float64{
		0, 12, 16, 20, 24, 27, 31, 35, 39, 44, 48, 105, 111, 117, 122, 128, 134, 139, 145, 150, 156,
		52, 57, 62, 67, 72, 77, 83, 88, 94, 100, 161, 166, 171, 176, 180, 185, 189, 193, 197, 201,
		204, 207, 211, 213, 216, 219, 221, 223, 225, 227, 229, 230, 231, 233, 233, 234,
	}

	calculatePhaseConsumption := func(startDay, endDay int) float64 {
		var totalGramsPerBird float64
		for day := startDay; day <= int(math.Min(float64(endDay), float64(durationDays))); day++ {
			if day < len(dailyIntakeGrams) {
				totalGramsPerBird += dailyIntakeGrams[day]
			}
		}
		return (totalGramsPerBird * float64(chickenCount)) / 1000.0
	}

	// REFACTORED: Build the plan by category from the start
	planByCategory := make(map[string][]ProcurementItem)

	// Step 1: Calculate feeds and add them directly to the "Feeds" category
	var feedItems []ProcurementItem
	if starterQtyKg := calculatePhaseConsumption(1, 14); starterQtyKg > 0 {
		feedItems = append(feedItems, ProcurementItem{ItemName: "B-Meg Integra 1000 (or other starter feeds)", Quantity: starterQtyKg, Unit: "kg"})
	}
	if growerQtyKg := calculatePhaseConsumption(15, 21); growerQtyKg > 0 {
		feedItems = append(feedItems, ProcurementItem{ItemName: "B-Meg Integra 2000 (or other grower feeds)", Quantity: growerQtyKg, Unit: "kg"})
	}
	if finisherQtyKg := calculatePhaseConsumption(22, durationDays); finisherQtyKg > 0 {
		finisherItemName := "B-Meg Integra 2000 (or other finisher feeds)"
		if historicalFinisherName != "" {
			finisherItemName = fmt.Sprintf("%s (or other finisher feeds)", historicalFinisherName)
		}
		feedItems = append(feedItems, ProcurementItem{ItemName: finisherItemName, Quantity: finisherQtyKg, Unit: "kg"})
	}
	if len(feedItems) > 0 {
		planByCategory["Feeds"] = feedItems
	}

	// Step 2: Add historical items using their category from the database
	historicalRates, err := s.repo.GetHistoricalConsumptionPerBird(ctx)
	if err != nil { return nil, err }
	for _, rate := range historicalRates {
		if rate.Category != "Feed" { // Feeds are already calculated, so we skip them here
			totalQtyNeeded := rate.AmountPerBird * float64(chickenCount)
			if rate.Unit == "pcs" || rate.Unit == "sachet" { // Round up discrete units
				totalQtyNeeded = math.Ceil(totalQtyNeeded)
			}
			// Use the category directly from the DB (e.g., "Vitamins")
			planByCategory[rate.Category] = append(planByCategory[rate.Category], ProcurementItem{
				ItemName: rate.ItemName, Quantity: totalQtyNeeded, Unit: rate.Unit,
			})
		}
	}

	// Step 3: Convert map to slice for the final response
	var finalPlan []CategoryPlan
	for category, items := range planByCategory {
		finalPlan = append(finalPlan, CategoryPlan{Category: category, Items: items})
	}
	
	// Step 4: Sort the categories for a consistent display order
	sort.Slice(finalPlan, func(i, j int) bool {
		order := map[string]int{"Feeds": 1, "Vitamins": 2, "Medicine": 3}
		iOrder, okI := order[finalPlan[i].Category]
		if !okI { iOrder = 99 }
		jOrder, okJ := order[finalPlan[j].Category]
		if !okJ { jOrder = 99 }
		return iOrder < jOrder
	})

	return &ProcurementPlan{AverageDuration: avgDuration, ChickenCount: chickenCount, Plan: finalPlan}, nil
}