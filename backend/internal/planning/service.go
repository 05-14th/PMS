// File: backend/internal/planning/service.go
package planning

import (
	"context"
	"math"
)

type Service struct {
	repo *Repository
}

type ProcurementItem struct {
	ItemName string  `json:"itemName"`
	Quantity float64 `json:"quantity"`
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

func (s *Service) GenerateProcurementPlan(ctx context.Context, chickenCount int, durationDays int) (*ProcurementPlan, error) {
	avgDuration, err := s.repo.GetHistoricalAvgDuration(ctx)
	if err != nil { return nil, err }

	// --- Industry Standards from Ross 308 PDF (Daily Intake in Grams per Bird) ---
	// Data extracted directly from the "Daily Intake (g)" column on page 4 of the PDF
	dailyIntakeGrams := []float64{
		0, 12, 16, 20, 24, 27, 31, 35, 39, 44, 48,  // Days 0-10
		52, 57, 62, 67, 72, 77, 83, 88, 94, 100, // Days 11-20
		105, 111, 117, 122, 128, 134, 139, 145, 150, 156, // Days 21-30
		161, 166, 171, 176, 180, 185, 189, 193, 197, 201, // Days 31-40
		204, 207, 211, 213, 216, 219, 221, 223, 225, 227, // Days 41-50
		229, 230, 231, 233, 233, 234, // Days 51-56
	}

	var finalPlan []PhasePlan
	
	// A helper function to sum up daily values for a phase
	calculatePhaseConsumption := func(startDay, endDay int) float64 {
		var totalGrams float64
		// Loop from startDay to endDay, capping at the batch duration and available data
		for day := startDay; day <= int(math.Min(float64(endDay), float64(durationDays))); day++ {
			if day < len(dailyIntakeGrams) {
				totalGrams += dailyIntakeGrams[day]
			}
		}
		return (totalGrams * float64(chickenCount)) / 1000.0 // Convert final sum to kg
	}

	// --- STARTER CALCULATION (Days 1-14) ---
	starterQtyKg := calculatePhaseConsumption(1, 14)
	if starterQtyKg > 0 {
		finalPlan = append(finalPlan, PhasePlan{
			Phase: "Starter (Days 1-14)",
			Items: []ProcurementItem{{ItemName: "Starter Feed (e.g., Integra 1000)", Quantity: starterQtyKg}},
		})
	}

	// --- GROWER CALCULATION (Days 15-21) ---
	growerQtyKg := calculatePhaseConsumption(15, 21)
	if growerQtyKg > 0 {
		finalPlan = append(finalPlan, PhasePlan{
			Phase: "Grower (Days 15-21)",
			Items: []ProcurementItem{{ItemName: "Grower Feed (e.g., Integra 2000)", Quantity: growerQtyKg}},
		})
	}

	// --- FINISHER CALCULATION (Days 22+) ---
	finisherQtyKg := calculatePhaseConsumption(22, durationDays)
	if finisherQtyKg > 0 {
		finalPlan = append(finalPlan, PhasePlan{
			Phase: "Finisher (Days 22+)",
			Items: []ProcurementItem{{ItemName: "Finisher Feed (or Grower)", Quantity: finisherQtyKg}},
		})
	}

	return &ProcurementPlan{AverageDuration: avgDuration, Plan: finalPlan}, nil
}
