// File: backend/internal/batch/repository.go
package batch

import (
	"chickmate-api/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

// Repository is the data access layer that interacts with the database.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new batch repository.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// GetBatches retrieves a filtered list of batches from the database.
func (r *Repository) GetBatches(ctx context.Context, searchTerm, statusFilter string) ([]models.Batch, error) {
	query := `
		SELECT BatchID, BatchName, StartDate, ExpectedHarvestDate, TotalChicken, CurrentChicken, Status, Notes 
		FROM cm_batches 
		WHERE 1=1`
	var args []interface{}

	if searchTerm != "" {
		query += " AND BatchName LIKE ?"
		args = append(args, "%"+searchTerm+"%")
	}
	if statusFilter != "" && statusFilter != "All" {
		query += " AND Status = ?"
		args = append(args, statusFilter)
	}
	query += " ORDER BY StartDate DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var batches []models.Batch
	for rows.Next() {
		var b models.Batch
		if err := rows.Scan(&b.BatchID, &b.BatchName, &b.StartDate, &b.ExpectedHarvestDate, &b.TotalChicken, &b.CurrentChicken, &b.Status, &b.Notes); err != nil {
			return nil, err
		}
		batches = append(batches, b)
	}
	return batches, nil
}

// CreateBatch inserts a new batch and its initial chick cost into the database.
func (r *Repository) CreateBatch(ctx context.Context, payload models.NewBatchPayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	batchQuery := `
		INSERT INTO cm_batches 
		(BatchName, StartDate, ExpectedHarvestDate, TotalChicken, CurrentChicken, Status, Notes) 
		VALUES (?, ?, ?, ?, ?, 'Active', ?)`
	res, err := tx.ExecContext(ctx, batchQuery, payload.BatchName, payload.StartDate, payload.ExpectedHarvestDate, payload.TotalChicken, payload.TotalChicken, payload.Notes)
	if err != nil {
		return 0, err
	}
	newBatchID, _ := res.LastInsertId()

	if payload.ChickCost > 0 {
		costDescription := fmt.Sprintf("Initial purchase of %d chicks.", payload.TotalChicken)
		costQuery := `
			INSERT INTO cm_production_cost (BatchID, Date, CostType, Amount, Description)
			VALUES (?, ?, 'Chick Purchase', ?, ?)`
		if _, err := tx.ExecContext(ctx, costQuery, newBatchID, payload.StartDate, payload.ChickCost, costDescription); err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return newBatchID, nil
}

func (r *Repository) GetBatchVitals(ctx context.Context, batchID int) (*models.BatchVitals, error) {
	var vitals models.BatchVitals
	var startDateStr, status string

	query := "SELECT BatchName, StartDate, Status, CurrentChicken FROM cm_batches WHERE BatchID = ?"
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(&vitals.BatchName, &startDateStr, &status, &vitals.CurrentPopulation)
	if err != nil {
		return nil, err
	}
	vitals.StartDate = startDateStr

	startDateParsed, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse start date: %w", err)
	}

	if status == "Sold" {
		var lastHarvestDate sql.NullString
		endDateQuery := `SELECT MAX(HarvestDate) FROM cm_harvest WHERE BatchID = ?`
		if err := r.db.QueryRowContext(ctx, endDateQuery, batchID).Scan(&lastHarvestDate); err == nil && lastHarvestDate.Valid {
			vitals.EndDate = &lastHarvestDate.String
			endDateParsed, _ := time.Parse("2006-01-02", lastHarvestDate.String)
			vitals.AgeInDays = int(endDateParsed.Sub(startDateParsed).Hours() / 24)
		}
	} else {
		vitals.AgeInDays = int(time.Since(startDateParsed).Hours() / 24)
	}
	

	mortalityQuery := "SELECT COALESCE(SUM(BirdsLoss), 0) FROM cm_mortality WHERE BatchID = ?"
	if err := r.db.QueryRowContext(ctx, mortalityQuery, batchID).Scan(&vitals.TotalMortality); err != nil {
		return nil, err
	}

	return &vitals, nil
}

func (r *Repository) GetBatchCosts(ctx context.Context, batchID int) ([]map[string]interface{}, error) {
	query := `SELECT CostID, Date, CostType, Description, Amount 
            FROM cm_production_cost 
            WHERE BatchID = ? ORDER BY Date DESC`

	rows, err := r.db.QueryContext(ctx, query, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var costs []map[string]interface{}
	for rows.Next() {
		var costID int
		var date, costType string
		// Use sql.NullString and sql.NullFloat64 to safely handle NULLs
		var description sql.NullString
		var amount sql.NullFloat64
		
		if err := rows.Scan(&costID, &date, &costType, &description, &amount); err != nil {
			return nil, err // This is where the original error was likely happening
		}
		
		costs = append(costs, map[string]interface{}{
			"id":          costID,
			"date":        date,
			"type":        costType,
			"description": description.String, // .String gives "" for NULL
			"amount":      amount.Float64,   // .Float64 gives 0.0 for NULL
		})
	}
	return costs, nil
}

func (r *Repository) GetBatchEvents(ctx context.Context, batchID int) ([]map[string]interface{}, error) {
	query := `
		SELECT 
			UsageID AS EventID, 'consumption' AS EventType, iu.Date AS EventDate,
			i.ItemName AS Details, CONCAT(iu.QuantityUsed, ' ', i.Unit) AS QtyCount
		FROM cm_inventory_usage iu
		JOIN cm_items i ON iu.ItemID = i.ItemID
		WHERE iu.BatchID = ?
		UNION ALL
		SELECT 
			MortalityID AS EventID, 'mortality' AS EventType, m.Date AS EventDate, 
			m.Notes AS Details, m.BirdsLoss AS QtyCount
		FROM cm_mortality m
		WHERE m.BatchID = ?
		ORDER BY EventDate DESC;
	`
	rows, err := r.db.QueryContext(ctx, query, batchID, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []map[string]interface{}
	for rows.Next() {
		var eventID int
		var eventType, eventDate, qtyCount string
		var details sql.NullString // Use NullString for safety

		if err := rows.Scan(&eventID, &eventType, &eventDate, &details, &qtyCount); err != nil {
			return nil, err
		}

		parsedDate, _ := time.Parse("2006-01-02 15:04:05", eventDate)
		
		events = append(events, map[string]interface{}{
			"id":      eventID,
			"type":    eventType,
			"date":    parsedDate.Format("2006-01-02"),
			"event":   strings.Title(eventType),
			"details": details.String,
			"qty":     qtyCount,
		})
	}
	return events, nil
}

func (r *Repository) CreateDirectCost(ctx context.Context, batchID int, payload models.DirectCostPayload) (int64, error) {
	query := "INSERT INTO cm_production_cost (BatchID, Date, CostType, Amount, Description) VALUES (?, ?, ?, ?, ?)"
	res, err := r.db.ExecContext(ctx, query, batchID, payload.Date, payload.CostType, payload.Amount, payload.Description)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) DeleteEvent(ctx context.Context, eventType string, eventID int) error {
	var query string
	// This function can be expanded later to handle deleting other event types
	switch eventType {
	case "cost":
		query = "DELETE FROM cm_production_cost WHERE CostID = ?"
	default:
		return fmt.Errorf("unknown event type for deletion: %s", eventType)
	}
	
	_, err := r.db.ExecContext(ctx, query, eventID)
	return err
}

func (r *Repository) DeleteCost(ctx context.Context, costID int) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM cm_production_cost WHERE CostID = ?", costID)
	return err
}

func (r *Repository) DeleteMortalityEvent(ctx context.Context, mortalityID int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() 

	var birdsLoss, batchID int
	err = tx.QueryRowContext(ctx, "SELECT BirdsLoss, BatchID FROM cm_mortality WHERE MortalityID = ?", mortalityID).Scan(&birdsLoss, &batchID)
	if err != nil {
		return err // Record not found or other DB error
	}

	_, err = tx.ExecContext(ctx, "UPDATE cm_batches SET CurrentChicken = CurrentChicken + ? WHERE BatchID = ?", birdsLoss, batchID)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, "DELETE FROM cm_mortality WHERE MortalityID = ?", mortalityID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *Repository) GetHarvestsForBatch(ctx context.Context, batchID int) ([]models.HarvestedProduct, error) {
	query := `
		SELECT
			hp.HarvestProductID, h.HarvestDate, hp.ProductType,
			hp.QuantityHarvested, hp.QuantityRemaining,
			hp.WeightHarvestedKg, hp.WeightRemainingKg
		FROM cm_harvest_products hp
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		WHERE h.BatchID = ?
		ORDER BY h.HarvestDate DESC`

	rows, err := r.db.QueryContext(ctx, query, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.HarvestedProduct
	for rows.Next() {
		var p models.HarvestedProduct
		if err := rows.Scan(
			&p.HarvestProductID, &p.HarvestDate, &p.ProductType,
			&p.QuantityHarvested, &p.QuantityRemaining,
			&p.WeightHarvestedKg, &p.WeightRemainingKg,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *Repository) CreateMortality(ctx context.Context, payload models.MortalityPayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 1. Get current chicken count
	var currentChicken int
	err = tx.QueryRowContext(ctx, "SELECT CurrentChicken FROM cm_batches WHERE BatchID = ? FOR UPDATE", payload.BatchID).Scan(&currentChicken)
	if err != nil {
		return 0, err
	}
	
	// The business rule check is in the service, but we double-check here inside the transaction
	if payload.BirdsLoss > currentChicken {
		return 0, errors.New("birds loss cannot be greater than current population")
	}

	// 2. Insert the mortality record
	insertQuery := "INSERT INTO cm_mortality (BatchID, Date, BirdsLoss, Notes) VALUES (?, ?, ?, ?)"
	res, err := tx.ExecContext(ctx, insertQuery, payload.BatchID, payload.Date, payload.BirdsLoss, payload.Notes)
	if err != nil {
		return 0, err
	}
	mortalityID, _ := res.LastInsertId()

	// 3. Update the batch's chicken count
	newPopulation := currentChicken - payload.BirdsLoss
	updateQuery := "UPDATE cm_batches SET CurrentChicken = ? WHERE BatchID = ?"
	_, err = tx.ExecContext(ctx, updateQuery, newPopulation, payload.BatchID)
	if err != nil {
		return 0, err
	}

	return mortalityID, tx.Commit()
}

func (r *Repository) CreateUsage(ctx context.Context, payload models.InventoryUsagePayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 1. Find all available stock for the item, oldest first (FIFO)
	stockQuery := `
		SELECT PurchaseID, QuantityRemaining FROM cm_inventory_purchases 
		WHERE ItemID = ? AND IsActive = 1 AND QuantityRemaining > 0 
		ORDER BY PurchaseDate ASC`
	rows, err := tx.QueryContext(ctx, stockQuery, payload.ItemID)
	if err != nil {
		return 0, err
	}

	type purchaseStock struct {
		ID           int
		QtyRemaining float64
	}
	var availablePurchases []purchaseStock
	var totalStockAvailable float64
	for rows.Next() {
		var ps purchaseStock
		if err := rows.Scan(&ps.ID, &ps.QtyRemaining); err != nil {
			rows.Close()
			return 0, err
		}
		totalStockAvailable += ps.QtyRemaining
		availablePurchases = append(availablePurchases, ps)
	}
	rows.Close()

	if payload.QuantityUsed > totalStockAvailable {
		return 0, fmt.Errorf("not enough stock. Required: %.2f, Available: %.2f", payload.QuantityUsed, totalStockAvailable)
	}

	// 2. Create the main usage record
	usageQuery := "INSERT INTO cm_inventory_usage (BatchID, ItemID, Date, QuantityUsed) VALUES (?, ?, ?, ?)"
	res, err := tx.ExecContext(ctx, usageQuery, payload.BatchID, payload.ItemID, payload.Date, payload.QuantityUsed)
	if err != nil {
		return 0, err
	}
	usageID, _ := res.LastInsertId()

	// 3. Deduct from purchases using FIFO and log the details
	quantityToDeduct := payload.QuantityUsed
	for _, purchase := range availablePurchases {
		if quantityToDeduct <= 0 { break }

		quantityDrawn := 0.0
		if quantityToDeduct >= purchase.QtyRemaining {
			quantityDrawn = purchase.QtyRemaining
		} else {
			quantityDrawn = quantityToDeduct
		}

		// Update the purchase record
		_, err := tx.ExecContext(ctx, "UPDATE cm_inventory_purchases SET QuantityRemaining = QuantityRemaining - ? WHERE PurchaseID = ?", quantityDrawn, purchase.ID)
		if err != nil { return 0, err }

		// Log the detail of which purchase was used
		_, err = tx.ExecContext(ctx, "INSERT INTO cm_inventory_usage_details (UsageID, PurchaseID, QuantityDrawn) VALUES (?, ?, ?)", usageID, purchase.ID, quantityDrawn)
		if err != nil { return 0, err }

		quantityToDeduct -= quantityDrawn
	}

	return usageID, tx.Commit()
}

func (r *Repository) GetBatchTransactions(ctx context.Context, batchID int) ([]models.Transaction, error) {
	query := `
		SELECT Date, 'Cost' AS Type, Description, -Amount AS Amount
		FROM cm_production_cost WHERE BatchID = ?
		UNION ALL
		SELECT DATE(iu.Date), 'Cost', CONCAT('Feed Usage: ', i.ItemName), -SUM(iud.QuantityDrawn / NULLIF(ip.QuantityPurchased, 0) * ip.UnitCost)
		FROM cm_inventory_usage iu
		JOIN cm_items i ON iu.ItemID = i.ItemID
		JOIN cm_inventory_usage_details iud ON iu.UsageID = iud.UsageID
		JOIN cm_inventory_purchases ip ON iud.PurchaseID = ip.PurchaseID
		WHERE iu.BatchID = ?
		GROUP BY iu.UsageID, DATE(iu.Date), i.ItemName
		UNION ALL
		SELECT DATE(so.SaleDate), 'Revenue', CONCAT('Sale to ', c.Name), SUM(sd.TotalWeightKg * sd.PricePerKg)
		FROM cm_sales_details sd
		JOIN cm_sales_orders so ON sd.SaleID = so.SaleID
		JOIN cm_customers c ON so.CustomerID = c.CustomerID
		JOIN cm_harvest_products hp ON sd.HarvestProductID = hp.HarvestProductID
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		WHERE h.BatchID = ? AND so.IsActive = 1
		GROUP BY so.SaleID, DATE(so.SaleDate), c.Name
		ORDER BY Date DESC;`

	rows, err := r.db.QueryContext(ctx, query, batchID, batchID, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		var amount sql.NullFloat64
		if err := rows.Scan(&t.Date, &t.Type, &t.Description, &amount); err != nil {
			return nil, err
		}
		if amount.Valid {
			t.Amount = amount.Float64
		}
		
		// Ensure date is formatted correctly
		parsedDate, err := time.Parse("2006-01-02 15:04:05", t.Date)
		if err == nil {
			t.Date = parsedDate.Format("2006-01-02")
		} else {
			parsedDate, _ = time.Parse("2006-01-02", t.Date)
			t.Date = parsedDate.Format("2006-01-02")
		}
		transactions = append(transactions, t)
	}
	return transactions, nil
}

func (r *Repository) GetBatchForReport(ctx context.Context, batchID int) (*models.Batch, error) {
	var b models.Batch
	query := "SELECT BatchID, BatchName, StartDate, ExpectedHarvestDate, TotalChicken, CurrentChicken, Status FROM cm_batches WHERE BatchID = ?"
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(&b.BatchID, &b.BatchName, &b.StartDate, &b.ExpectedHarvestDate, &b.TotalChicken, &b.CurrentChicken, &b.Status)
	return &b, err
}

func (r *Repository) GetDashboardMetrics(ctx context.Context) (models.AtAGlanceData, []models.ActiveBatchInternal, error) {
	var glance models.AtAGlanceData
	var activeBatches []models.ActiveBatchInternal // <-- Returns our new internal struct

	// At a Glance metrics
	err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(COUNT(BatchID), 0), COALESCE(SUM(CurrentChicken), 0) 
		FROM cm_batches WHERE Status = 'Active'`).Scan(&glance.ActiveBatchCount, &glance.CurrentPopulation)
	if err != nil {
		return glance, activeBatches, err
	}
	err = r.db.QueryRowContext(ctx, `SELECT COALESCE(SUM(TotalChicken), 0) FROM cm_batches`).Scan(&glance.TotalBirds)
	if err != nil {
		return glance, activeBatches, err
	}

	// Active Batches List
	rows, err := r.db.QueryContext(ctx, `SELECT BatchID, BatchName, StartDate, ExpectedHarvestDate, CurrentChicken FROM cm_batches WHERE Status = 'Active' ORDER BY StartDate ASC`)
	if err != nil {
		return glance, activeBatches, err
	}
	defer rows.Close()

	for rows.Next() {
		var b models.ActiveBatchInternal 
		// Scan into its fields
		if err := rows.Scan(&b.BatchID, &b.Name, &b.StartDate, &b.ExpectedHarvestDate, &b.Population); err != nil {
			return glance, activeBatches, err
		}
		activeBatches = append(activeBatches, b)
	}
	return glance, activeBatches, nil
}

func (r *Repository) GetCostsForActiveBatches(ctx context.Context) (float64, float64, float64, error) {
	var feedCost, chickCost, otherCost float64
	
	err := r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(iud.QuantityDrawn / NULLIF(ip.QuantityPurchased, 0) * ip.UnitCost), 0) 
		FROM cm_inventory_usage_details iud 
		JOIN cm_inventory_usage iu ON iud.UsageID = iu.UsageID 
		JOIN cm_inventory_purchases ip ON iud.PurchaseID = ip.PurchaseID 
		WHERE iu.BatchID IN (SELECT BatchID FROM cm_batches WHERE Status = 'Active')`).Scan(&feedCost)
	if err != nil { return 0,0,0, err }

	err = r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(Amount), 0) FROM cm_production_cost 
		WHERE CostType = 'Chick Purchase' AND BatchID IN (SELECT BatchID FROM cm_batches WHERE Status = 'Active')`).Scan(&chickCost)
	if err != nil { return 0,0,0, err }

	err = r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(Amount), 0) FROM cm_production_cost 
		WHERE CostType != 'Chick Purchase' AND BatchID IN (SELECT BatchID FROM cm_batches WHERE Status = 'Active')`).Scan(&otherCost)
	if err != nil { return 0,0,0, err }

	return feedCost, chickCost, otherCost, nil
}

func (r *Repository) UpdateBatch(ctx context.Context, p models.UpdateBatchPayload, batchID int) error {
	query := `
		UPDATE cm_batches 
		SET BatchName = ?, ExpectedHarvestDate = ?, Notes = ?, Status = ?
		WHERE BatchID = ?`
	_, err := r.db.ExecContext(ctx, query, p.BatchName, p.ExpectedHarvestDate, p.Notes, p.Status, batchID)
	return err
}

func (r *Repository) DeleteBatch(ctx context.Context, batchID int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// BUSINESS RULE: Check all child tables to ensure there is no activity.
	childTables := []string{"cm_harvest", "cm_inventory_usage", "cm_mortality", "cm_production_cost", "cm_health_checks"}
	for _, table := range childTables {
		var count int
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE BatchID = ?", table)
		if err := tx.QueryRowContext(ctx, query, batchID).Scan(&count); err != nil {
			return fmt.Errorf("failed to check batch activity in %s: %w", table, err)
		}
		if count > 0 {
			return errors.New("cannot delete a batch with existing monitoring or harvest records")
		}
	}

	// If all checks pass, delete the batch.
	if _, err := tx.ExecContext(ctx, "DELETE FROM cm_batches WHERE BatchID = ?", batchID); err != nil {
		return err
	}

	return tx.Commit()
}
