// File: backend/internal/report/service.go
package report

import (
	"chickmate-api/internal/batch"
	"chickmate-api/internal/harvest"
	"chickmate-api/internal/inventory"
	"chickmate-api/internal/models"
	"chickmate-api/internal/sales"
	"context"
	"sync"
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
	var wg sync.WaitGroup
	errs := make(chan error, 5)

	// Variables to hold the data fetched concurrently
	var baseBatch *models.Batch
	var vitals *models.BatchVitals
	var costs []map[string]interface{}
	var totalRevenue, totalFeedCost, totalFeedConsumed, totalWeightHarvested float64

	// 1. Fetch Base Batch Data
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		baseBatch, err = s.batchRepo.GetBatchForReport(ctx, batchID)
		if err != nil { errs <- err }
	}()

	// 2. Fetch Vitals
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		vitals, err = s.batchRepo.GetBatchVitals(ctx, batchID)
		if err != nil { errs <- err }
	}()

	// 3. Fetch All Costs
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		costs, err = s.batchRepo.GetBatchCosts(ctx, batchID)
		if err != nil { errs <- err }
	}()
	
	// 4. Fetch Sales, Inventory, and Harvest data
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		totalRevenue, err = s.salesRepo.GetTotalRevenueForBatch(ctx, batchID)
		if err != nil { errs <- err; return }
		
		totalFeedCost, err = s.inventoryRepo.GetTotalFeedCostForBatch(ctx, batchID)
		if err != nil { errs <- err; return }
		
		totalFeedConsumed, err = s.inventoryRepo.GetTotalFeedConsumedForBatch(ctx, batchID)
		if err != nil { errs <- err; return }

		totalWeightHarvested, err = s.harvestRepo.GetTotalWeightHarvestedForBatch(ctx, batchID)
		if err != nil { errs <- err }
	}()
	
	// Wait for all concurrent fetches to complete
	wg.Wait()
	close(errs)

	for err := range errs {
		if err != nil {
			return nil, err // Return the first error found
		}
	}

	// ---- ALL DATA IS NOW FETCHED, PROCEED WITH CALCULATIONS ----
	
	var report models.BatchReportData
	// (The calculation logic is the same as before, just using the concurrently fetched variables)
	report.BatchName = baseBatch.BatchName
	report.DurationDays = vitals.AgeInDays
	
	op := &report.OperationalAnalytics
	op.InitialBirdCount = baseBatch.TotalChicken
	op.FinalBirdCount = op.InitialBirdCount - vitals.TotalMortality
	op.TotalFeedConsumed = totalFeedConsumed
	op.TotalWeightHarvested = totalWeightHarvested
	
	birdsHarvested := op.FinalBirdCount - baseBatch.CurrentChicken
	if birdsHarvested > 0 {
		op.AverageHarvestWeight = totalWeightHarvested / float64(birdsHarvested)
	}
	if op.InitialBirdCount > 0 {
		op.MortalityRate = (float64(vitals.TotalMortality) / float64(op.InitialBirdCount)) * 100
	}

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