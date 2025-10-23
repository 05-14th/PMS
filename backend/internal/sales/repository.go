// File: backend/internal/sales/repository.go
package sales

import (
	"chickmate-api/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// GetActiveBatchesForSale fetches active batches and calculates pre-ordered quantities.
func (r *Repository) GetActiveBatchesForSale(ctx context.Context) ([]models.BatchForSale, error) {
	query := `
		SELECT 
			b.BatchID, b.BatchName, b.ExpectedHarvestDate, b.TotalChicken, b.CurrentChicken,
			COALESCE((
				SELECT SUM(sd.QuantitySold) 
				FROM cm_sales_orders so
				JOIN cm_sales_details sd ON so.SaleID = sd.SaleID
				WHERE so.BatchID = b.BatchID AND so.Status = 'Pending'
			), 0) as PreOrderedChicken
		FROM cm_batches b
		WHERE b.Status = 'Active';`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var batches []models.BatchForSale
	for rows.Next() {
		var b models.BatchForSale
		if err := rows.Scan(&b.BatchID, &b.BatchName, &b.ExpectedHarvestDate, &b.TotalChicken, &b.CurrentChicken, &b.PreOrderedChicken); err != nil {
			return nil, err
		}
		batches = append(batches, b)
	}
	return batches, nil
}

// CreatePreOrder creates a new sale with a 'Pending' status.
func (r *Repository) CreatePreOrder(ctx context.Context, payload models.SalePayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	saleQuery := "INSERT INTO cm_sales_orders (CustomerID, BatchID, SaleDate, Status, PaymentMethod, Notes) VALUES (?, ?, ?, 'Pending', ?, ?)"
	res, err := tx.ExecContext(ctx, saleQuery, payload.CustomerID, payload.BatchID, payload.SaleDate, payload.PaymentMethod, payload.Notes)
	if err != nil {
		return 0, err
	}
	saleID, _ := res.LastInsertId()

	detailQuery := "INSERT INTO cm_sales_details (SaleID, ProductType, QuantitySold) VALUES (?, ?, ?)"
	for _, item := range payload.Items {
		if _, err := tx.ExecContext(ctx, detailQuery, saleID, item.ProductType, item.QuantitySold); err != nil {
			return 0, err
		}
	}

	return saleID, tx.Commit()
}

// GetSalesHistory now fetches additional order information like status and batch name.
func (r *Repository) GetSalesHistory(ctx context.Context) ([]models.SaleHistoryRecord, error) {
	query := `
		SELECT s.SaleID, s.SaleDate, c.Name, s.TotalAmount, s.Status, COALESCE(b.BatchName, 'N/A'), s.Discount 
		FROM cm_sales_orders s
		JOIN cm_customers c ON s.CustomerID = c.CustomerID
		LEFT JOIN cm_batches b ON s.BatchID = b.BatchID
		WHERE s.IsActive = 1
		ORDER BY s.SaleDate DESC;`
	
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []models.SaleHistoryRecord
	for rows.Next() {
		var rec models.SaleHistoryRecord
		if err := rows.Scan(&rec.SaleID, &rec.SaleDate, &rec.CustomerName, &rec.TotalAmount, &rec.Status, &rec.BatchName, &rec.Discount); err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	return records, nil
}

func (r *Repository) FulfillOrder(ctx context.Context, saleID int, payload models.FulfillmentPayload) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    var totalAmount float64

    for _, item := range payload.Items {
        var currentQty int
        var orderedQty int
        var currentWeight float64
        
        err = tx.QueryRowContext(ctx, "SELECT QuantitySold FROM cm_sales_details WHERE SaleDetailID = ?", item.SaleDetailID).Scan(&orderedQty)
        if err != nil {
            return errors.New("sale detail not found")
        }

        err = tx.QueryRowContext(ctx, "SELECT QuantityRemaining, WeightRemainingKg FROM cm_harvest_products WHERE HarvestProductID = ? FOR UPDATE", item.HarvestProductID).Scan(&currentQty, &currentWeight)
        if err != nil {
            return errors.New("harvested product not found")
        }

        if currentQty < orderedQty {
            return fmt.Errorf("insufficient stock for the selected product. Required: %d, Available: %d", orderedQty, currentQty)
        }
        
        // Update sale details with ACTUAL weight and price (no adjustment)
        updateDetailQuery := "UPDATE cm_sales_details SET TotalWeightKg = ?, PricePerKg = ? WHERE SaleDetailID = ? AND SaleID = ?"
        _, err = tx.ExecContext(ctx, updateDetailQuery, item.TotalWeightKg, item.PricePerKg, item.SaleDetailID, saleID)
        if err != nil {
            return err
        }

        // Calculate new quantity and weight based on ACTUAL usage
        newQtyRemaining := currentQty - orderedQty
        
        // NEW: Calculate weight remaining, but set to 0 if it would go negative
        // This allows recording actual weights while preventing negative inventory
        newWeightRemaining := currentWeight - item.TotalWeightKg
        if newWeightRemaining < 0 {
            newWeightRemaining = 0
            // Log this discrepancy for auditing
            fmt.Printf("Weight discrepancy: Product %d, Available: %.2fkg, Used: %.2fkg, Setting remaining to 0\n", 
                item.HarvestProductID, currentWeight, item.TotalWeightKg)
        }

        // Determine if we should deactivate the product
        isActive := 1
        if newQtyRemaining <= 0 {
            isActive = 0
        }

        updateStockQuery := `
            UPDATE cm_harvest_products 
            SET QuantityRemaining = ?, 
                WeightRemainingKg = ?,
                IsActive = ?
            WHERE HarvestProductID = ?`
        _, err = tx.ExecContext(ctx, updateStockQuery, newQtyRemaining, newWeightRemaining, isActive, item.HarvestProductID)
        if err != nil {
            return err
        }
        
        // Use ACTUAL weight for pricing
        totalAmount += item.TotalWeightKg * item.PricePerKg
    }

    finalTotal := totalAmount - payload.Discount
    updateOrderQuery := "UPDATE cm_sales_orders SET Status = 'Fulfilled', TotalAmount = ?, Discount = ? WHERE SaleID = ?"
    _, err = tx.ExecContext(ctx, updateOrderQuery, finalTotal, payload.Discount, saleID)
    if err != nil {
        return err
    }

    return tx.Commit()
}


func (r *Repository) GetPaymentMethods(ctx context.Context) ([]string, error) {
	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_sales_orders' AND COLUMN_NAME = 'PaymentMethod'`
	
	var enumStr string
	if err := r.db.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		return nil, err
	}
	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	return strings.Split(cleanedStr, ","), nil
}


func (r *Repository) GetSaleDetails(ctx context.Context, saleID int) ([]models.SaleDetail, error) {
    query := `
        SELECT 
            sd.SaleDetailID, 
            sd.ProductType,
            sd.QuantitySold, 
            COALESCE(sd.TotalWeightKg, 0) as TotalWeightKg, 
            COALESCE(sd.PricePerKg, 0) as PricePerKg,
            b.BatchName
        FROM cm_sales_details sd
        JOIN cm_sales_orders so ON sd.SaleID = so.SaleID
        LEFT JOIN cm_batches b ON so.BatchID = b.BatchID
        WHERE sd.SaleID = ?
        ORDER BY sd.SaleDetailID;`

    rows, err := r.db.QueryContext(ctx, query, saleID)
    if err != nil {
        return nil, fmt.Errorf("failed to query sale details: %w", err)
    }
    defer rows.Close()

    var details []models.SaleDetail
    for rows.Next() {
        var d models.SaleDetail
        var batchName sql.NullString
        
        if err := rows.Scan(
            &d.SaleDetailID, 
            &d.ProductType, 
            &d.QuantitySold, 
            &d.TotalWeightKg, 
            &d.PricePerKg,
            &batchName,
        ); err != nil {
            return nil, fmt.Errorf("failed to scan sale detail: %w", err)
        }
        
        if batchName.Valid {
            d.BatchName = batchName.String
        }
        
        details = append(details, d)
    }
    
    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("error iterating rows: %w", err)
    }
    
    return details, nil
}

// --- FIX: ADDED MISSING REPORTING FUNCTIONS BACK ---

func (r *Repository) GetTotalRevenueForBatch(ctx context.Context, batchID int) (float64, error) {
	var totalRevenue float64
	// Updated query to use the final TotalAmount from fulfilled orders
	query := `
		SELECT COALESCE(SUM(so.TotalAmount), 0)
		FROM cm_sales_orders so
		WHERE so.BatchID = ? AND so.Status = 'Fulfilled' AND so.IsActive = 1`
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(&totalRevenue)
	return totalRevenue, err
}

func (r *Repository) GetRevenueTimeline(ctx context.Context) (map[string]float64, error) {
	// Updated query to only count fulfilled orders
	query := `
		SELECT DATE(SaleDate), SUM(TotalAmount) 
		FROM cm_sales_orders 
		WHERE SaleDate >= CURDATE() - INTERVAL 30 DAY AND IsActive = 1 AND Status = 'Fulfilled'
		GROUP BY DATE(SaleDate)`
	
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	revenueMap := make(map[string]float64)
	for rows.Next() {
		var date string
		var revenue float64
		if err := rows.Scan(&date, &revenue); err != nil {
			return nil, err
		}
		revenueMap[date] = revenue
	}
	return revenueMap, nil
}

func (r *Repository) GetHistoricalAvgPricePerKg(ctx context.Context) (float64, error) { 
	var avgPrice sql.NullFloat64
	// This logic remains valid as it averages across all completed sales details
	query := `
		SELECT SUM(sd.TotalWeightKg * sd.PricePerKg) / NULLIF(SUM(sd.TotalWeightKg), 0)
		FROM cm_sales_details sd
		JOIN cm_sales_orders so ON sd.SaleID = so.SaleID
		WHERE so.Status = 'Fulfilled'`
	err := r.db.QueryRowContext(ctx, query).Scan(&avgPrice)
	if err != nil && err != sql.ErrNoRows {
		return 160.0, err // Return default on error
	}
	if !avgPrice.Valid {
		return 160.0, nil // Return default if there's no historical data
	}
	return avgPrice.Float64, nil
}


func (r *Repository) GetRevenueByActiveBatch(ctx context.Context) (map[int]float64, error) {
	// Updated query to use new schema and only count fulfilled orders
	query := `
		SELECT so.BatchID, COALESCE(SUM(so.TotalAmount), 0)
		FROM cm_sales_orders so
		WHERE so.BatchID IN (SELECT BatchID FROM cm_batches WHERE Status = 'Active') 
		AND so.Status = 'Fulfilled' AND so.IsActive = 1
		GROUP BY so.BatchID`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	revenueMap := make(map[int]float64)
	for rows.Next() {
		var batchID int
		var totalRevenue float64
		if err := rows.Scan(&batchID, &totalRevenue); err != nil {
			return nil, err
		}
		revenueMap[batchID] = totalRevenue
	}
	return revenueMap, nil
}

func (r *Repository) GetHarvestedProducts(ctx context.Context, productType string) ([]models.HarvestedProduct, error) { // <--- ADD productType string
    query := `
        SELECT 
            hp.HarvestProductID, 
            h.HarvestDate,
            hp.ProductType, 
            hp.QuantityHarvested,
            hp.QuantityRemaining, 
            hp.WeightHarvestedKg, 
            hp.WeightRemainingKg,
            b.BatchName
        FROM cm_harvest_products hp
        JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
        JOIN cm_batches b ON h.BatchID = b.BatchID
        WHERE hp.QuantityRemaining > 0 AND hp.IsActive = 1`
        
    var args []interface{}
    if productType != "" {
        query += " AND hp.ProductType = ?"
        args = append(args, productType)
    }
    query += " ORDER BY h.HarvestDate DESC"

    rows, err := r.db.QueryContext(ctx, query, args...)
    if err != nil {
        log.Printf("ERROR: GetHarvestedProducts query failed: %v", err)
        return []models.HarvestedProduct{}, err
    }
    defer rows.Close()

    var products []models.HarvestedProduct
    for rows.Next() {
        var p models.HarvestedProduct
        var harvestDate, productType, batchName sql.NullString
        
        err := rows.Scan(
            &p.HarvestProductID,
            &harvestDate,
            &productType,
            &p.QuantityHarvested,
            &p.QuantityRemaining,
            &p.WeightHarvestedKg,
            &p.WeightRemainingKg,
            &batchName,
        )
        if err != nil {
            log.Printf("ERROR: GetHarvestedProducts scan failed: %v", err)
            return []models.HarvestedProduct{}, err
        }
        
        p.HarvestDate = harvestDate.String
        p.ProductType = productType.String
        p.BatchName = batchName.String
        
        products = append(products, p)
    }
    
    if err := rows.Err(); err != nil {
        log.Printf("ERROR: GetHarvestedProducts rows error: %v", err)
        return []models.HarvestedProduct{}, err
    }
    
    log.Printf("DEBUG: GetHarvestedProducts found %d active products with remaining quantity", len(products))
    for i, p := range products {
        log.Printf("DEBUG: Product %d - ID: %d, Type: %s, Remaining: %d, Batch: %s", 
            i, p.HarvestProductID, p.ProductType, p.QuantityRemaining, p.BatchName)
    }
    
    return products, nil
}

// In sales/repository.go - Complete fix for VoidSale
func (r *Repository) VoidSale(ctx context.Context, saleID int) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }
    defer tx.Rollback()

    // 1. First, check if sale exists and get its current status
    var currentStatus string
    var batchID sql.NullInt64
    err = tx.QueryRowContext(ctx, 
        "SELECT Status, BatchID FROM cm_sales_orders WHERE SaleID = ?", 
        saleID,
    ).Scan(&currentStatus, &batchID)
    
    if err != nil {
        if err == sql.ErrNoRows {
            return fmt.Errorf("sale with ID %d not found", saleID)
        }
        return fmt.Errorf("failed to fetch sale: %w", err)
    }

    // 2. Prevent voiding already cancelled sales
    if currentStatus == "Cancelled" {
        return fmt.Errorf("sale is already cancelled")
    }

    // 3. Get sale details to return to inventory
    detailsQuery := `
        SELECT 
            sd.SaleDetailID,
            sd.ProductType,
            sd.QuantitySold,
            COALESCE(sd.TotalWeightKg, 0) as TotalWeightKg
        FROM cm_sales_details sd
        WHERE sd.SaleID = ?`
    
    rows, err := tx.QueryContext(ctx, detailsQuery, saleID)
    if err != nil {
        return fmt.Errorf("failed to fetch sale details: %w", err)
    }
    defer rows.Close()

    type saleDetail struct {
        SaleDetailID  int
        ProductType   string
        QuantitySold  int
        TotalWeightKg float64
    }
    
    var details []saleDetail
    for rows.Next() {
        var d saleDetail
        if err := rows.Scan(&d.SaleDetailID, &d.ProductType, &d.QuantitySold, &d.TotalWeightKg); err != nil {
            return fmt.Errorf("failed to scan sale detail: %w", err)
        }
        details = append(details, d)
    }

    if err := rows.Err(); err != nil {
        return fmt.Errorf("error iterating sale details: %w", err)
    }

    // 4. Return products to inventory
    // Since we don't have direct HarvestProductID mapping, we'll update the harvest products
    // based on the batch and product type
    for _, detail := range details {
        if batchID.Valid && detail.QuantitySold > 0 {
            // CORRECTED QUERY: Removed the "AND hp.IsActive = 0" condition
            updateQuery := `
                UPDATE cm_harvest_products hp
                JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
                SET
                    hp.QuantityRemaining = hp.QuantityRemaining + ?,
                    hp.WeightRemainingKg = hp.WeightRemainingKg + ?,
                    hp.IsActive = 1
                WHERE
                    h.BatchID = ?
                    AND hp.ProductType = ?
                ORDER BY hp.HarvestProductID DESC
                LIMIT 1`

            result, err := tx.ExecContext(ctx, updateQuery,
                detail.QuantitySold,
                detail.TotalWeightKg,
                batchID.Int64,
                detail.ProductType,
            )
            
            if err != nil {
                return fmt.Errorf("failed to update inventory for product %s: %w", detail.ProductType, err)
            }
            
            rowsAffected, err := result.RowsAffected()
            if err != nil {
                return fmt.Errorf("failed to check inventory update: %w", err)
            }
            
            if rowsAffected == 0 {
                log.Printf("Warning: No harvest product found to return for batch %d, product %s", 
                    batchID.Int64, detail.ProductType)
                // Continue anyway - we'll still cancel the sale
            }
        }
    }

    // 5. Update the sale status to Cancelled
    updateSaleQuery := "UPDATE cm_sales_orders SET Status = 'Cancelled', IsActive = 0 WHERE SaleID = ?"
    result, err := tx.ExecContext(ctx, updateSaleQuery, saleID)
    if err != nil {
        return fmt.Errorf("failed to cancel sale: %w", err)
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return fmt.Errorf("failed to check sale update: %w", err)
    }

    if rowsAffected == 0 {
        return fmt.Errorf("sale was not updated - may have been modified by another process")
    }

    // 6. Commit the transaction
    if err := tx.Commit(); err != nil {
        return fmt.Errorf("failed to commit transaction: %w", err)
    }

    return nil
}

func (r *Repository) GetSalesByBatch(ctx context.Context, batchID int) ([]models.SaleHistoryRecord, error) {
	query := `
		SELECT s.SaleID, s.SaleDate, c.Name, s.TotalAmount, s.Status, COALESCE(b.BatchName, 'N/A'), s.Discount 
		FROM cm_sales_orders s
		JOIN cm_customers c ON s.CustomerID = c.CustomerID
		LEFT JOIN cm_batches b ON s.BatchID = b.BatchID
		WHERE s.IsActive = 1 AND s.BatchID = ?
		ORDER BY s.SaleDate DESC;`
	
	rows, err := r.db.QueryContext(ctx, query, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []models.SaleHistoryRecord
	for rows.Next() {
		var rec models.SaleHistoryRecord
		if err := rows.Scan(&rec.SaleID, &rec.SaleDate, &rec.CustomerName, &rec.TotalAmount, &rec.Status, &rec.BatchName, &rec.Discount); err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	return records, nil
}

func (r *Repository) CreateDirectSale(ctx context.Context, payload models.DirectSalePayload) (int64, error) {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return 0, err
    }
    defer tx.Rollback()

    // 1. Create the sale order (no batch ID for direct sales)
saleQuery := `INSERT INTO cm_sales_orders 
                  (CustomerID, SaleDate, Status, PaymentMethod, Notes, BatchID, IsActive) 
                  VALUES (?, ?, 'Fulfilled', ?, ?, ?, 1)` 
    
    res, err := tx.ExecContext(ctx, saleQuery, 
        payload.CustomerID, payload.SaleDate, payload.PaymentMethod, payload.Notes, payload.BatchID) 
    if err != nil {
        return 0, fmt.Errorf("failed to create sale order: %w", err)
    }
    
    saleID, err := res.LastInsertId()
    if err != nil {
        return 0, fmt.Errorf("failed to get sale ID: %w", err)
    }

    var totalAmount float64

    // 2. Process each sale item
    for _, item := range payload.Items {
        // Get current inventory
        var currentQty int
        var currentWeight float64
        err := tx.QueryRowContext(ctx,
            "SELECT QuantityRemaining, WeightRemainingKg FROM cm_harvest_products WHERE HarvestProductID = ? FOR UPDATE",
            item.HarvestProductID,
        ).Scan(&currentQty, &currentWeight)
        if err != nil {
            return 0, fmt.Errorf("failed to get product inventory: %w", err)
        }

        // Check quantity
        if currentQty < item.QuantitySold {
            return 0, fmt.Errorf("insufficient stock. Available: %d, Requested: %d", currentQty, item.QuantitySold)
        }

        // Calculate new quantities
        newQty := currentQty - item.QuantitySold
        newWeight := currentWeight - item.TotalWeightKg
        if newWeight < 0 {
            newWeight = 0
        }

        // Update inventory
        updateQuery := `UPDATE cm_harvest_products 
                       SET QuantityRemaining = ?, WeightRemainingKg = ?, IsActive = ?
                       WHERE HarvestProductID = ?`
        
        _, err = tx.ExecContext(ctx, updateQuery, 
            newQty, newWeight, newQty > 0, item.HarvestProductID)
        if err != nil {
            return 0, fmt.Errorf("failed to update inventory: %w", err)
        }

        // Add sale detail
        detailQuery := `INSERT INTO cm_sales_details 
                       (SaleID, ProductType, QuantitySold, TotalWeightKg, PricePerKg) 
                       VALUES (?, ?, ?, ?, ?)`
        
        _, err = tx.ExecContext(ctx, detailQuery,
            saleID, item.ProductType, item.QuantitySold, item.TotalWeightKg, item.PricePerKg)
        if err != nil {
            return 0, fmt.Errorf("failed to create sale detail: %w", err)
        }

        // Calculate item total
        totalAmount += item.TotalWeightKg * item.PricePerKg
    }

    // 3. Update sale total amount
    updateSaleQuery := "UPDATE cm_sales_orders SET TotalAmount = ? WHERE SaleID = ?"
    _, err = tx.ExecContext(ctx, updateSaleQuery, totalAmount, saleID)
    if err != nil {
        return 0, fmt.Errorf("failed to update sale total: %w", err)
    }

    // 4. Commit transaction
    if err := tx.Commit(); err != nil {
        return 0, fmt.Errorf("failed to commit transaction: %w", err)
    }

    return saleID, nil
}
