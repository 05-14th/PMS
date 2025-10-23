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
	errs := make(chan error, 8) // Increased for new goroutine

	// --- Local variables to hold all concurrent results ---
	var glanceData models.AtAGlanceData
	var activeBatchesInternal []models.ActiveBatchInternal
	var stockItems []models.StockStatus
	var alerts []models.Alert
	var monthlyRevenue float64
	var revenueTimeline []models.RevenueDataPoint
	var feedCost, chickCost, otherCost float64
	var histAvgWeight, histAvgPrice float64
	var sellableInventory int
	var prodCostsMap, feedCostsMap, revenueByBatchMap map[int]float64

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
		
		// Reworked Thresholds (These are the MINIMUM values for the next-highest status)
		// 150.0 kg is now the Low limit (below this is CRITICAL/OUT OF STOCK)
		// 300.0 kg is now the Adequate limit (below this is LOW)
		const (
			ADEQUATE_THRESHOLD_MULTIPLIER = 4.0 // e.g., 4 sacks is adequate
			PLENTY_THRESHOLD_MULTIPLIER   = 8.0 // e.g., 8 sacks is plenty
		)

		// Low Threshold is the point below which stock is considered insufficient (e.g., 2 sacks or 100 kg)
		lowThresholds := map[string]float64{
			"Feed":     100.0, // Low threshold is 100 kg (2 sacks). Below this is CRITICAL/OUT OF STOCK.
			"Vitamins": 10.0,
			"Medicine": 15.0,
		}
		
		for i, item := range stockItems {
			if lowThreshold, ok := lowThresholds[item.Category]; ok {
				adequateThreshold := lowThreshold * ADEQUATE_THRESHOLD_MULTIPLIER // e.g., 100 * 4 = 400 kg is adequate
				plentyThreshold := lowThreshold * PLENTY_THRESHOLD_MULTIPLIER     // e.g., 100 * 8 = 800 kg is plenty
				
				if item.RawQty <= 0 {
					stockItems[i].Level, stockItems[i].Status = 0, "Out of Stock"
					alerts = append(alerts, models.Alert{Type: "critical", Message: fmt.Sprintf("%s is out of stock.", item.Name)})
				} else if item.RawQty < lowThreshold {
					stockItems[i].Level, stockItems[i].Status = 25, "Critical" // Below 100 kg is critical
					alerts = append(alerts, models.Alert{Type: "critical", Message: fmt.Sprintf("%s stock is critical (%.2f %s remaining).", item.Name, item.RawQty, item.Unit)})
				} else if item.RawQty < adequateThreshold {
					stockItems[i].Level, stockItems[i].Status = 50, "Low" // Between 100 kg and 400 kg is low
					alerts = append(alerts, models.Alert{Type: "warning", Message: fmt.Sprintf("%s stock is low (%.2f %s remaining). Reorder soon.", item.Name, item.RawQty, item.Unit)})
				} else if item.RawQty < plentyThreshold {
					stockItems[i].Level, stockItems[i].Status = 75, "Good" // Between 400 kg and 800 kg is good
				} else {
					stockItems[i].Level, stockItems[i].Status = 100, "Plenty" // Above 800 kg is plenty
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

	// 7. NEW: Fetch all forecast costs at once to fix N+1 problem
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		prodCostsMap, err = s.batchRepo.GetProductionCostsByActiveBatch(ctx)
		if err != nil { errs <- err; return }
		feedCostsMap, err = s.inventoryRepo.GetFeedCostsByActiveBatch(ctx)
		if err != nil { errs <- err }
	}()

		// 8. NEW: Fetch all forecast revenues at once
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		revenueByBatchMap, err = s.salesRepo.GetRevenueByActiveBatch(ctx)
		if err != nil { errs <- err }
	}()

	// ---- WAIT FOR ALL CONCURRENT FETCHING TO FINISH (ONLY ONCE) ----
	wg.Wait()
	close(errs)
	for err := range errs { if err != nil { return nil, err } }

	
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

			// Fast cost lookup from our maps
			forecast.AccruedCost = prodCostsMap[batch.BatchID] + feedCostsMap[batch.BatchID]
			
			// --- THIS IS THE CORRECTED REVENUE LOGIC ---
			revenueAlreadyEarned := revenueByBatchMap[batch.BatchID] // Fast lookup
			estimatedRevenueFromRemaining := float64(batch.Population) * histAvgWeight * histAvgPrice
			forecast.EstimatedRevenue = revenueAlreadyEarned + estimatedRevenueFromRemaining
			// --- END OF CORRECTION ---
			
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
