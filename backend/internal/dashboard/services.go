// File: backend/internal/dashboard/service.go
package dashboard

import (
	"chickmate-api/internal/batch"
	"chickmate-api/internal/harvest"
	"chickmate-api/internal/inventory"
	"chickmate-api/internal/models"
	"chickmate-api/internal/sales"
	"context"
	"fmt"
	"strconv"
	"sync"
	"time"
)

type Service struct {
	batchRepo     *batch.Repository
	salesRepo     *sales.Repository
	inventoryRepo *inventory.Repository
	harvestRepo   *harvest.Repository
}

func NewService(br *batch.Repository, sr *sales.Repository, ir *inventory.Repository, hr *harvest.Repository) *Service {
	return &Service{batchRepo: br, salesRepo: sr, inventoryRepo: ir, harvestRepo: hr}
}

// GenerateDashboardData fetches all dashboard components concurrently.
func (s *Service) GenerateDashboardData(ctx context.Context) (*models.DashboardData, error) {
	var wg sync.WaitGroup
	errs := make(chan error, 6)

	// Local variables to hold results from each goroutine
	var glanceData models.AtAGlanceData
	var activeBatchesInternal []models.ActiveBatchInternal
	var stockItems []models.StockStatus
	var alerts []models.Alert
	var monthlyRevenue float64
	var revenueTimeline []models.RevenueDataPoint
	var feedCost, chickCost, otherCost float64
	var histAvgWeight, histAvgPrice float64
	var sellableInventory int

	// --- ALL GOROUTINES ARE LAUNCHED FIRST ---

	// 1. Fetch Batch Metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		glanceData, activeBatchesInternal, err = s.batchRepo.GetDashboardMetrics(ctx)
		if err != nil { errs <- err }
	}()

	// 2. Fetch Sales & Revenue Chart Metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		revenueMap, err := s.salesRepo.GetRevenueTimeline(ctx)
		if err != nil { errs <- err; return }
		var totalMonthlyRevenue float64
		var timeline []models.RevenueDataPoint
		for i := 29; i >= 0; i-- {
			day := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
			revenue := revenueMap[day]
			totalMonthlyRevenue += revenue
			timeline = append(timeline, models.RevenueDataPoint{Date: day, Revenue: revenue})
		}
		monthlyRevenue = totalMonthlyRevenue
		revenueTimeline = timeline
	}()

	// 3. Fetch Harvest Metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
	
		sellableInventory, err = s.harvestRepo.GetSellableInventory(ctx)
		if err != nil { errs <- err }
	}()

	// 4. Fetch Stock Status & Alerts
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		stockItems, err = s.inventoryRepo.GetStockStatus(ctx)
		if err != nil { errs <- err; return }
		lowThresholds := map[string]float64{"Feed": 50.0, "Vitamins": 10.0, "Medicine": 15.0}
		plentyThresholdMultiplier := 5.0
		for i, item := range stockItems {
			if lowThreshold, ok := lowThresholds[item.Category]; ok {
				plentyThreshold := lowThreshold * plentyThresholdMultiplier
				if item.RawQty <= 0 {
					stockItems[i].Level, stockItems[i].Status = 0, "Out of Stock"
					alerts = append(alerts, models.Alert{Type: "critical", Message: fmt.Sprintf("%s is out of stock.", item.Name)})
				} else if item.RawQty < lowThreshold {
					stockItems[i].Level, stockItems[i].Status = 25, "Low"
					alerts = append(alerts, models.Alert{Type: "warning", Message: fmt.Sprintf("%s stock is low (%.2f %s remaining).", item.Name, item.RawQty, item.Unit)})
				} else if item.RawQty >= plentyThreshold {
					stockItems[i].Level, stockItems[i].Status = 100, "Plenty"
				} else {
					stockItems[i].Level, stockItems[i].Status = 75, "Good"
				}
			}
		}
	}()
	
	// 5. Fetch Cost Data
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		feedCost, chickCost, otherCost, err = s.batchRepo.GetCostsForActiveBatches(ctx)
		if err != nil { errs <- err }
	}()
	
	// 6. Fetch Historical Averages for Smart Forecast
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		histAvgWeight, err = s.batchRepo.GetHistoricalAvgHarvestWeight(ctx)
		if err != nil { errs <- err; return }
		histAvgPrice, err = s.salesRepo.GetHistoricalAvgPricePerKg(ctx)
		if err != nil { errs <- err }
	}()

	// ---- WAIT FOR ALL CONCURRENT FETCHING TO FINISH (ONLY ONCE) ----
	wg.Wait()
	close(errs)

	for err := range errs {
		if err != nil {
			return nil, err
		}
	}
	
	// --- ASSEMBLE THE FINAL DATA STRUCTURE ---
	var data models.DashboardData
	
	glanceData.MonthlyRevenue = monthlyRevenue
	data.AtAGlance = glanceData
	data.StockItems = stockItems
	data.Alerts = alerts
	data.Charts.RevenueTimeline = revenueTimeline
	data.Charts.CostBreakdown = append(data.Charts.CostBreakdown, 
		models.CostBreakdownPoint{Name: "Feed Cost", Value: feedCost},
		models.CostBreakdownPoint{Name: "Chick Purchase", Value: chickCost},
		models.CostBreakdownPoint{Name: "Other Costs", Value: otherCost},
	)

	// Convert internal batch data to frontend-facing model
	for _, b := range activeBatchesInternal {
		parsedStartDate, _ := time.Parse("2006-01-02", b.StartDate)
		age := int(time.Since(parsedStartDate).Hours() / 24)
		data.ActiveBatches = append(data.ActiveBatches, models.ActiveBatch{
			ID: b.Name, Age: age, Population: b.Population, Mortality: b.TotalMortality,
		})
	}

	// Financial Forecast Calculation
for _, batch := range activeBatchesInternal {
		var forecast models.FinancialForecastData
		forecast.BatchID = strconv.Itoa(batch.BatchID)
		forecast.BatchName = batch.Name

		// --- THIS IS THE NEW, CORRECT LOGIC ---
		// 1. Get costs already accrued for THIS specific batch
		productionCosts, err := s.batchRepo.GetTotalProductionCostsForBatch(ctx, batch.BatchID)
		if err != nil { continue }
		feedCostForBatch, err := s.inventoryRepo.GetTotalFeedCostForBatch(ctx, batch.BatchID)
		if err != nil { continue }
		forecast.AccruedCost = productionCosts + feedCostForBatch

		// 2. Get revenue ALREADY earned from this batch
		revenueAlreadyEarned, err := s.salesRepo.GetTotalRevenueForBatch(ctx, batch.BatchID)
		if err != nil { continue }

		// 3. Estimate revenue from the REMAINING birds
		estimatedRevenueFromRemaining := float64(batch.Population) * histAvgWeight * histAvgPrice

		// 4. The final Est. Revenue is the sum of what's earned and what's estimated
		forecast.EstimatedRevenue = revenueAlreadyEarned + estimatedRevenueFromRemaining


		birdsAvailable := batch.InitialPopulation - batch.TotalMortality
		birdsHarvested := batch.InitialPopulation - batch.Population - batch.TotalMortality
		
		if birdsAvailable > 0 {
			forecast.Progress = int((float64(birdsHarvested) / float64(birdsAvailable)) * 100)
		} else {
			forecast.Progress = 0
		}
		data.FinancialForecasts = append(data.FinancialForecasts, forecast)
	}

	// Final check to prevent null slices in JSON
	if data.ActiveBatches == nil { data.ActiveBatches = make([]models.ActiveBatch, 0) }
	if data.StockItems == nil { data.StockItems = make([]models.StockStatus, 0) }
	if data.Alerts == nil { data.Alerts = make([]models.Alert, 0) }
	if data.Charts.CostBreakdown == nil { data.Charts.CostBreakdown = make([]models.CostBreakdownPoint, 0) }
	if data.FinancialForecasts == nil { data.FinancialForecasts = make([]models.FinancialForecastData, 0) }
	if data.Charts.RevenueTimeline == nil { data.Charts.RevenueTimeline = make([]models.RevenueDataPoint, 0) }

	//glanceData.MonthlyRevenue = monthlyRevenue
	glanceData.SellableInventory = sellableInventory
	data.AtAGlance = glanceData
	
	return &data, nil
}
