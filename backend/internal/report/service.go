// File: backend/internal/report/service.go
package report

import (
	"chickmate-api/internal/batch"
	"chickmate-api/internal/harvest"
	"chickmate-api/internal/inventory"
	"chickmate-api/internal/models"
	"chickmate-api/internal/sales"
	"context"
)

type Service struct {
	repo          *Repository
	batchRepo     *batch.Repository
	salesRepo     *sales.Repository
	inventoryRepo *inventory.Repository
	harvestRepo   *harvest.Repository
}

func NewService(r *Repository, br *batch.Repository, sr *sales.Repository, ir *inventory.Repository, hr *harvest.Repository) *Service {
	return &Service{
		repo:          r,
		batchRepo:     br,
		salesRepo:     sr,
		inventoryRepo: ir,
		harvestRepo:   hr, // <-- ADD THIS LINE
	}
}

func (s *Service) GenerateBatchReport(ctx context.Context, batchID int) (*models.BatchReportData, error) {
	// 1. Fetch all the raw data (no changes here)
	baseBatch, err := s.batchRepo.GetBatchForReport(ctx, batchID)
	if err != nil { return nil, err }
	
	vitals, err := s.batchRepo.GetBatchVitals(ctx, batchID)
	if err != nil { return nil, err }
	
	costs, err := s.batchRepo.GetBatchCosts(ctx, batchID)
	if err != nil { return nil, err }
	
	totalRevenue, err := s.salesRepo.GetTotalRevenueForBatch(ctx, batchID)
	if err != nil { return nil, err }

	totalFeedCost, err := s.inventoryRepo.GetTotalFeedCostForBatch(ctx, batchID)
	if err != nil { return nil, err }

	totalFeedConsumed, err := s.inventoryRepo.GetTotalFeedConsumedForBatch(ctx, batchID)
	if err != nil { return nil, err }

	totalWeightHarvested, err := s.harvestRepo.GetTotalWeightHarvestedForBatch(ctx, batchID)
	if err != nil { return nil, err }

	// 2. Perform Calculations
	var report models.BatchReportData
	report.BatchName = baseBatch.BatchName
	report.DurationDays = vitals.AgeInDays

	op := &report.OperationalAnalytics
	op.InitialBirdCount = baseBatch.TotalChicken
	op.FinalBirdCount = op.InitialBirdCount - vitals.TotalMortality
	op.TotalFeedConsumed = totalFeedConsumed
	op.TotalWeightHarvested = totalWeightHarvested
	
	// Use vitals.TotalMortality directly for calculations
	birdsHarvested := op.FinalBirdCount - baseBatch.CurrentChicken
	
	if birdsHarvested > 0 {
	op.AverageHarvestWeight = totalWeightHarvested / float64(birdsHarvested)
}
	if op.InitialBirdCount > 0 {
		op.MortalityRate = (float64(vitals.TotalMortality) / float64(op.InitialBirdCount)) * 100
	}

	// Financial Calculations
	var chickPurchaseCost, otherCostsTotal float64
	for _, cost := range costs {
		if cost["type"] == "Chick Purchase" {
			chickPurchaseCost = cost["amount"].(float64)
		} else {
			otherCostsTotal += cost["amount"].(float64)
		}
	}
	totalCost := chickPurchaseCost + otherCostsTotal + totalFeedCost
	
	exec := &report.ExecutiveSummary
	exec.NetProfit = totalRevenue - totalCost
	if totalCost > 0 {
		exec.ROI = (exec.NetProfit / totalCost) * 100
	}
	if totalWeightHarvested > 0 {
		exec.CostPerKg = totalCost / totalWeightHarvested
		if totalFeedConsumed > 0 {
			exec.FeedConversionRatio = totalFeedConsumed / totalWeightHarvested
		}
	}
	if op.InitialBirdCount > 0 {
		exec.HarvestRecovery = (float64(birdsHarvested) / float64(op.InitialBirdCount)) * 100
	}
	
	// Financial Breakdown
	if totalCost > 0 && op.InitialBirdCount > 0 {
		var breakdown []models.FinancialBreakdownItem
		perBirdDivisor := float64(op.InitialBirdCount)
		breakdown = append(breakdown, models.FinancialBreakdownItem{Category: "Total Revenue", Amount: totalRevenue, PerBird: totalRevenue / perBirdDivisor})
		breakdown = append(breakdown, models.FinancialBreakdownItem{Category: "Total Costs", Amount: -totalCost, PerBird: -totalCost / perBirdDivisor})
		breakdown = append(breakdown, models.FinancialBreakdownItem{Category: "- Chick Purchase", Amount: -chickPurchaseCost, PerBird: -chickPurchaseCost / perBirdDivisor})
		breakdown = append(breakdown, models.FinancialBreakdownItem{Category: "- Feed Cost", Amount: -totalFeedCost, PerBird: -totalFeedCost / perBirdDivisor})
		for _, cost := range costs {
			costType, ok1 := cost["type"].(string)
			costAmount, ok2 := cost["amount"].(float64)
			if ok1 && ok2 && costType != "Chick Purchase" {
				breakdown = append(breakdown, models.FinancialBreakdownItem{
					Category: "- " + costType,
					Amount:   -costAmount,
					PerBird:  -costAmount / perBirdDivisor,
				})
			}
		}
		report.FinancialBreakdown = breakdown
	}

	return &report, nil
}