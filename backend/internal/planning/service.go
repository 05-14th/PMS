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

type CategoryPlan struct {
	Category string            `json:"category"`
	Items    []ProcurementItem `json:"items"`
}

type ProcurementPlan struct {
	AverageDuration float64        `json:"averageDuration"`
	ChickenCount    int            `json:"chickenCount"`
	Plan            []CategoryPlan `json:"plan"`
}

// Source: Ross 308 Broiler Performance Objectives 2022 (Aviagen)
// Daily Feed Intake per Bird (in Grams) - Averaged for Mixed-Sex Flock
var dailyFeedIntakePerBirdGrams = map[int]float64{
	1: 24, 2: 30, 3: 36, 4: 43, 5: 49, 6: 55, 7: 62,
	8: 68, 9: 74, 10: 81, 11: 87, 12: 93, 13: 99, 14: 105,
	15: 111, 16: 117, 17: 123, 18: 128, 19: 133, 20: 138, 21: 143,
	22: 148, 23: 153, 24: 157, 25: 162, 26: 166, 27: 170, 28: 175,
	29: 179, 30: 183, 31: 187, 32: 191, 33: 195, 34: 199, 35: 202,
	36: 206, 37: 210, 38: 213, 39: 217, 40: 220, 41: 223, 42: 226,
}

// Source: Ross 308 Broiler Performance Objectives 2022 (Aviagen)
// Daily Projected Body Weight per Bird (in Grams)
// NOTE: This map should be fully populated for best accuracy.
var dailyProjectedBodyWeightGrams = map[int]float64{
	0: 42, 1: 44, 2: 58, 3: 75, 4: 93, 5: 115, 6: 140, 7: 189,
	14: 486, 21: 979, 28: 1618, 35: 2360, 42: 3154,
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetBatchStatus(ctx context.Context, batchID int) (string, error) {
	return s.repo.GetBatchStatus(ctx, batchID)
}

func (s *Service) GenerateProcurementPlan(ctx context.Context, chickenCount int, durationDays int) (*ProcurementPlan, error) {
	// This constant represents the energy content of your feed in kcal/kg.
	// This should be configurable based on the actual feed being used.
	const MetabolizableEnergyOfFeed = 3200 // Example: 3200 kcal/kg

	// This 7% buffer accounts for feed wastage and other real-world contingencies.
	const wastageContingencyFactor = 1.07

	avgDuration, err := s.repo.GetHistoricalAvgDuration(ctx)
	if err != nil {
		return nil, err
	}

	historicalFinisherName, err := s.repo.GetHistoricalFinisherFeedName(ctx)
	if err != nil {
		return nil, err
	}

	var totalStarterGrams, totalGrowerGrams, totalFinisherGrams float64

	for day := 1; day <= durationDays; day++ {
		// --- Start of Partitioning Method Calculation ---

		// Step 1: Estimate Mean Body Weight for the day in KG.
		// For planning, we use projected BW. A simple way is to use the projected end-of-day weight.
		// A more complex implementation could interpolate between known data points.
		meanBwGrams := dailyProjectedBodyWeightGrams[day]
		if meanBwGrams == 0 { // Fallback if data is missing
			meanBwGrams = dailyProjectedBodyWeightGrams[day-1] // Use previous day's weight
		}
		meanBwKg := meanBwGrams / 1000.0

		// Step 2: Calculate Feed Intake for Maintenance (FI_m) for one bird 
		// The formula is ME_m (kcal/d) = 136 * meanBW^0.70 
		maintenanceEnergyKcal := 136 * math.Pow(meanBwKg, 0.70)
		fiMaintenanceGrams := (maintenanceEnergyKcal / MetabolizableEnergyOfFeed) * 1000.0

		// Step 3: Calculate Feed Intake for Growth (FI_g) for one bird
		// This is the total ideal daily intake (from Ross) minus the maintenance portion.
		totalDailyIntakeGrams := dailyFeedIntakePerBirdGrams[day]
		if totalDailyIntakeGrams == 0 && day > 42 {
			totalDailyIntakeGrams = dailyFeedIntakePerBirdGrams[42] // Fallback for longer cycles
		}
		fiGrowthGrams := totalDailyIntakeGrams - fiMaintenanceGrams

		// Ensure growth feed isn't negative, which can happen if BW is very high vs. intake
		if fiGrowthGrams < 0 {
			fiGrowthGrams = 0
		}
		
		totalIntakeForDay := fiMaintenanceGrams + fiGrowthGrams

		// Step 4: Sum the totals for each phase
		if day >= 1 && day <= 14 {
			totalStarterGrams += totalIntakeForDay
		} else if day >= 15 && day <= 21 {
			totalGrowerGrams += totalIntakeForDay
		} else { // Day 22 onwards
			totalFinisherGrams += totalIntakeForDay
		}
	}

	// Step 5: Calculate final quantities for the whole flock
	totalChickensFloat := float64(chickenCount)
	starterQtyKg := ((totalStarterGrams * totalChickensFloat) / 1000.0) * wastageContingencyFactor
	growerQtyKg := ((totalGrowerGrams * totalChickensFloat) / 1000.0) * wastageContingencyFactor
	finisherQtyKg := ((totalFinisherGrams * totalChickensFloat) / 1000.0) * wastageContingencyFactor

	// --- The rest of the logic remains the same ---
	planByCategory := make(map[string][]ProcurementItem)
	var feedItems []ProcurementItem
	if starterQtyKg > 0 {
		feedItems = append(feedItems, ProcurementItem{ItemName: "B-Meg Integra 1000 (or other starter feeds)", Quantity: starterQtyKg, Unit: "kg"})
	}
	if growerQtyKg > 0 {
		feedItems = append(feedItems, ProcurementItem{ItemName: "B-Meg Integra 2000 (or other grower feeds)", Quantity: growerQtyKg, Unit: "kg"})
	}
	if finisherQtyKg > 0 {
		finisherItemName := "B-Meg Integra 2000 (or other finisher feeds)"
		if historicalFinisherName != "" {
			finisherItemName = fmt.Sprintf("%s (or other finisher feeds)", historicalFinisherName)
		}
		feedItems = append(feedItems, ProcurementItem{ItemName: finisherItemName, Quantity: finisherQtyKg, Unit: "kg"})
	}
	if len(feedItems) > 0 {
		planByCategory["Feeds"] = feedItems
	}

	historicalRates, err := s.repo.GetHistoricalConsumptionPerBird(ctx)
	if err != nil {
		return nil, err
	}
	for _, rate := range historicalRates {
		if rate.Category != "Feed" {
			totalQtyNeeded := rate.AmountPerBird * float64(chickenCount)
			if rate.Unit == "pcs" || rate.Unit == "sachet" {
				totalQtyNeeded = math.Ceil(totalQtyNeeded)
			}
			planByCategory[rate.Category] = append(planByCategory[rate.Category], ProcurementItem{
				ItemName: rate.ItemName, Quantity: totalQtyNeeded, Unit: rate.Unit,
			})
		}
	}

	var finalPlan []CategoryPlan
	for category, items := range planByCategory {
		finalPlan = append(finalPlan, CategoryPlan{Category: category, Items: items})
	}
	sort.Slice(finalPlan, func(i, j int) bool {
		order := map[string]int{"Feeds": 1, "Vitamins": 2, "Medicine": 3}
		iOrder, okI := order[finalPlan[i].Category]
		if !okI {
			iOrder = 99
		}
		jOrder, okJ := order[finalPlan[j].Category]
		if !okJ {
			jOrder = 99
		}
		return iOrder < jOrder
	})

	return &ProcurementPlan{AverageDuration: avgDuration, ChickenCount: chickenCount, Plan: finalPlan}, nil
}