// File: backend/internal/planning/service.go
package planning

import (
	"context"
	"fmt"
	"math"
)

type Service struct {
	repo *Repository
}

// These response structs remain the same
type ProcurementItem struct {
	ItemName string  `json:"itemName"`
	Quantity float64 `json:"quantity"`
	Unit     string  `json:"unit"`
}
type PhasePlan struct {
		Phase string            `json:"phase"`
		Items []ProcurementItem `json:"items"`
	}
type ProcurementPlan struct {
		AverageDuration float64     `json:"averageDuration"`
		Plan            []PhasePlan `json:"plan"`
	}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetBatchStatus(ctx context.Context, batchID int) (string, error) {
    return s.repo.GetBatchStatus(ctx, batchID)
}

// THIS IS THE FINAL, CORRECTED VERSION OF THE FUNCTION
func (s *Service) GenerateProcurementPlan(ctx context.Context, chickenCount int, durationDays int) (*ProcurementPlan, error) {
	avgDuration, err := s.repo.GetHistoricalAvgDuration(ctx)
	if err != nil { return nil, err }

	historicalRates, err := s.repo.GetHistoricalConsumptionPerBird(ctx)
	if err != nil { return nil, err }

	var finalPlan []PhasePlan
	var generalItems []ProcurementItem

	// --- Process historical data for General Supplies ---
	for _, rate := range historicalRates {
		if rate.Category != "Feed" {
			totalQtyNeeded := rate.AmountPerBird * float64(chickenCount)
			
			// Round up non-kg items
			if rate.Unit != "kg" {
				totalQtyNeeded = math.Ceil(totalQtyNeeded)
			}
			
			generalItems = append(generalItems, ProcurementItem{
				ItemName: rate.ItemName,
				Quantity: totalQtyNeeded,
				Unit:     rate.Unit,
			})
		}
	}
	
	// --- Feed Calculation (using Ross 308 standards) ---
	dailyIntakeGrams := []float64{
		0, 12, 16, 20, 24, 27, 31, 35, 39, 44, 48, 
		52, 57, 62, 67, 72, 77, 83, 88, 94, 100,
		105, 111, 117, 122, 128, 134, 139, 145, 150, 156,
		161, 166, 171, 176, 180, 185, 189, 193, 197, 201,
		204, 207, 211, 213, 216, 219, 221, 223, 225, 227,
		229, 230, 231, 233, 233, 234,
	}

	calculatePhaseConsumption := func(startDay, endDay int) float64 {
		var totalGramsPerBird float64
		for day := startDay; day <= int(math.Min(float64(endDay), float64(durationDays))); day++ {
			if day < len(dailyIntakeGrams) {
				totalGramsPerBird += dailyIntakeGrams[day]
			}
		}
		return (totalGramsPerBird * float64(chickenCount)) / 1000.0 // Result in KG
	}

	// --- Assemble Feed Plan ---
	starterQtyKg := calculatePhaseConsumption(1, 14)
	if starterQtyKg > 0 {
		sacks := math.Ceil(starterQtyKg / 50.0) // Calculate sacks
		itemName := fmt.Sprintf("Starter Feed (e.g., Integra 1000) (approx. %.0f sacks)", sacks)
		finalPlan = append(finalPlan, PhasePlan{
			Phase: "Starter (Week 1-2)",
			Items: []ProcurementItem{{ItemName: itemName, Quantity: starterQtyKg, Unit: "kg"}},
		})
	}

	growerQtyKg := calculatePhaseConsumption(15, 21)
	if growerQtyKg > 0 {
		sacks := math.Ceil(growerQtyKg / 50.0) // Calculate sacks
		itemName := fmt.Sprintf("Grower Feed (e.g., Integra 2000) (approx. %.0f sacks)", sacks)
		finalPlan = append(finalPlan, PhasePlan{
			Phase: "Grower (Week 3)",
			Items: []ProcurementItem{{ItemName: itemName, Quantity: growerQtyKg, Unit: "kg"}},
		})
	}

	finisherQtyKg := calculatePhaseConsumption(22, durationDays)
	if finisherQtyKg > 0 {
		sacks := math.Ceil(finisherQtyKg / 50.0) // Calculate sacks
		itemName := fmt.Sprintf("Finisher Feed (or Grower) (approx. %.0f sacks)", sacks)
		finalPlan = append(finalPlan, PhasePlan{
			Phase: "Finisher (Week 4+)",
			Items: []ProcurementItem{{ItemName: itemName, Quantity: finisherQtyKg, Unit: "kg"}},
		})
	}

	// --- Add General Supplies to the plan ---
	if len(generalItems) > 0 {
		finalPlan = append(finalPlan, PhasePlan{
			Phase: "General Supplies (Vitamins, Medicine, etc.)",
			Items: generalItems,
		})
	}

	return &ProcurementPlan{AverageDuration: avgDuration, Plan: finalPlan}, nil
}