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
	var data models.DashboardData
	var wg sync.WaitGroup
	errs := make(chan error, 5)

	var activeBatchesInternal []models.ActiveBatchInternal
	var feedCost, chickCost, otherCost float64

	// 1. Fetch Batch Metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		glance, batches, err := s.batchRepo.GetDashboardMetrics(ctx)
		if err != nil {
			errs <- err; return
		}
		data.AtAGlance = glance
		activeBatchesInternal = batches
	}()

	// 2. Fetch Sales & Revenue Chart Metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		revenueMap, err := s.salesRepo.GetRevenueTimeline(ctx)
		if err != nil {
			errs <- err; return
		}
		
		var monthlyRevenue float64
		var timeline []models.RevenueDataPoint
		
		// Create a full 30-day timeline, filling in gaps
		for i := 29; i >= 0; i-- {
			day := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
			revenue := revenueMap[day] // Will be 0.00 if the date is not in the map
			
			monthlyRevenue += revenue
			timeline = append(timeline, models.RevenueDataPoint{Date: day, Revenue: revenue})
		}
		
		data.AtAGlance.MonthlyRevenue = monthlyRevenue
		data.Charts.RevenueTimeline = timeline
	}()

	// 3. Fetch Harvest Metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		sellableInventory, err := s.harvestRepo.GetSellableInventory(ctx)
		if err != nil {
			errs <- err; return
		}
		data.AtAGlance.SellableInventory = sellableInventory
	}()

	// 4. Fetch Stock Status & Alerts
	wg.Add(1)
	go func() {
		defer wg.Done()
		stockItems, err := s.inventoryRepo.GetStockStatus(ctx)
		if err != nil {
			errs <- err; return
		}
		// Threshold & Alert Logic
		thresholds := map[string]float64{"Feed": 50.0, "Vitamins": 10.0, "Medicine": 15.0}
		for i, item := range stockItems {
			if threshold, ok := thresholds[item.Category]; ok {
				if item.RawQty < threshold {
					stockItems[i].Level, stockItems[i].Status = 15, "low"
					alertMsg := fmt.Sprintf("%s stock is low (%.2f %s remaining).", item.Name, item.RawQty, item.Unit)
					data.Alerts = append(data.Alerts, models.Alert{Type: "warning", Message: alertMsg})
				} else {
					stockItems[i].Level, stockItems[i].Status = 85, "good"
				}
			}
		}
		data.StockItems = stockItems
	}()
	
	// 5. Fetch Cost Data
	wg.Add(1)
	go func() {
		defer wg.Done()
		var err error
		feedCost, chickCost, otherCost, err = s.batchRepo.GetCostsForActiveBatches(ctx)
		if err != nil {
			errs <- err; return
		}
	}()
	
	// ---- WAIT FOR ALL CONCURRENT FETCHING TO FINISH ----
	wg.Wait()
	close(errs)

	for err := range errs {
		if err != nil {
			return nil, err
		}
	}
	
	// ---- NOW, PERFORM CALCULATIONS WITH THE FETCHED DATA ----

	// Convert internal batch data to frontend-facing model
	for _, b := range activeBatchesInternal {
		parsedStartDate, _ := time.Parse("2006-01-02", b.StartDate)
		age := int(time.Since(parsedStartDate).Hours() / 24)
		data.ActiveBatches = append(data.ActiveBatches, models.ActiveBatch{
			ID: b.Name, Age: age, Population: b.Population,
		})
	}
	
	// Financial Forecast Calculation
	for _, batch := range activeBatchesInternal {
		var forecast models.FinancialForecastData
		forecast.BatchID, forecast.BatchName = strconv.Itoa(batch.BatchID), batch.Name
		if len(activeBatchesInternal) > 0 {
			forecast.AccruedCost = (feedCost + chickCost + otherCost) / float64(len(activeBatchesInternal))
		}
		forecast.EstimatedRevenue = float64(batch.Population) * 1.8 * 160
		
		start, _ := time.Parse("2006-01-02", batch.StartDate)
		end, _ := time.Parse("2006-01-02", batch.ExpectedHarvestDate)
		totalDuration, currentDuration := end.Sub(start).Hours()/24, float64(int(time.Since(start).Hours()/24))

		if totalDuration > 0 {
			forecast.Progress = int((currentDuration / totalDuration) * 100)
			if forecast.Progress > 100 { forecast.Progress = 100 }
		}
		data.FinancialForecasts = append(data.FinancialForecasts, forecast)
	}

	// Cost Breakdown Chart
	data.Charts.CostBreakdown = append(data.Charts.CostBreakdown, 
		models.CostBreakdownPoint{Name: "Feed Cost", Value: feedCost},
		models.CostBreakdownPoint{Name: "Chick Purchase", Value: chickCost},
		models.CostBreakdownPoint{Name: "Other Costs", Value: otherCost},
	)
	
	// Final check to prevent null slices in JSON
	if data.ActiveBatches == nil { data.ActiveBatches = make([]models.ActiveBatch, 0) }
	if data.StockItems == nil { data.StockItems = make([]models.StockStatus, 0) }
	if data.Alerts == nil { data.Alerts = make([]models.Alert, 0) }
	if data.Charts.CostBreakdown == nil { data.Charts.CostBreakdown = make([]models.CostBreakdownPoint, 0) }
	if data.FinancialForecasts == nil { data.FinancialForecasts = make([]models.FinancialForecastData, 0) }
	if data.Charts.RevenueTimeline == nil { data.Charts.RevenueTimeline = make([]models.RevenueDataPoint, 0) }

	return &data, nil
}
