// File: backend/internal/harvest/repository.go
package harvest

import (
	"chickmate-api/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetHarvestedProductsByBatch(ctx context.Context, batchID int) ([]models.HarvestedInventoryItem, error) {
	query := `
        SELECT
            hp.HarvestProductID, h.HarvestDate, hp.ProductType, b.BatchName,
            hp.QuantityHarvested, hp.WeightHarvestedKg, hp.QuantityRemaining, hp.WeightRemainingKg, hp.IsActive
        FROM cm_harvest_products hp
        JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
        JOIN cm_batches b ON h.BatchID = b.BatchID
        WHERE b.BatchID = ? -- Filters ONLY by batch ID
        ORDER BY h.HarvestDate DESC, hp.HarvestProductID DESC`
	
	rows, err := r.db.QueryContext(ctx, query, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var inventory []models.HarvestedInventoryItem
	for rows.Next() {
		var item models.HarvestedInventoryItem
		// Use temporary variables for DECIMAL/FLOAT SCAN
		var weightHarvestedKgStr, weightRemainingKgStr []byte
		
		if err := rows.Scan(
			&item.HarvestProductID, &item.HarvestDate, &item.ProductType, &item.BatchOrigin, 
			&item.QuantityHarvested, &weightHarvestedKgStr, 
			&item.QuantityRemaining, &weightRemainingKgStr, 
			&item.IsActive); err != nil { 
			// Log the error detail
			fmt.Printf("ERROR scanning Batch History row: %v\n", err)
			return nil, err
		}
		
		// MANUAL CONVERSION
		item.WeightHarvestedKg, _ = strconv.ParseFloat(string(weightHarvestedKgStr), 64)
		item.WeightRemainingKg, _ = strconv.ParseFloat(string(weightRemainingKgStr), 64)

		inventory = append(inventory, item)
	}
	
	if err = rows.Err(); err != nil {
		return nil, err
	}
	
	return inventory, nil
}

func (r *Repository) GetProductTypes(ctx context.Context) ([]string, error) {
	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_harvest_products' AND COLUMN_NAME = 'ProductType'`
	
	var enumStr string
	if err := r.db.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		return nil, err
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	return strings.Split(cleanedStr, ","), nil
}

func (r *Repository) GetBatchList(ctx context.Context) ([]map[string]interface{}, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT BatchID, BatchName FROM cm_batches ORDER BY StartDate DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var batchList []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			return nil, err
		}
		batchList = append(batchList, map[string]interface{}{"BatchID": id, "BatchName": name})
	}
	return batchList, nil
}


// GetHarvestedSummary calculates the summary data for the inventory page.
func (r *Repository) GetHarvestedSummary(ctx context.Context) (map[string]interface{}, error) {
    var totalDressed, totalLive int
    var totalByproductWeight float64

    // Query for Dressed and Live counts - NO IsActive filter
    err := r.db.QueryRowContext(ctx, `
        SELECT 
            COALESCE(SUM(CASE WHEN ProductType = 'Dressed' THEN QuantityRemaining ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN ProductType = 'Live' THEN QuantityRemaining ELSE 0 END), 0)
        FROM cm_harvest_products`).Scan(&totalDressed, &totalLive) // No WHERE clause
    if err != nil {
        return nil, err
    }

    // Query for Byproduct weight - NO IsActive filter
    err = r.db.QueryRowContext(ctx, `
        SELECT COALESCE(SUM(WeightRemainingKg), 0) 
        FROM cm_harvest_products 
        WHERE ProductType NOT IN ('Live', 'Dressed')`).Scan(&totalByproductWeight) // No IsActive filter
    if err != nil {
        return nil, err
    }

    summary := map[string]interface{}{
        "totalDressed":         totalDressed,
        "totalLive":            totalLive,
        "totalByproductWeight": totalByproductWeight,
    }
    
    fmt.Printf("DEBUG: Summary - Dressed: %d, Live: %d, Byproduct: %.2f (including IsActive=0)\n", 
        totalDressed, totalLive, totalByproductWeight)
        
    return summary, nil
}
func (r *Repository) CreateHarvest(ctx context.Context, payload models.HarvestPayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 1. Check current population and update it
	var currentChicken int
	err = tx.QueryRowContext(ctx, "SELECT CurrentChicken FROM cm_batches WHERE BatchID = ? FOR UPDATE", payload.BatchID).Scan(&currentChicken)
	if err != nil {
		return 0, err
	}
	if payload.QuantityHarvested > currentChicken {
		return 0, errors.New("cannot harvest more chickens than are in the batch")
	}
	newPopulation := currentChicken - payload.QuantityHarvested
	_, err = tx.ExecContext(ctx, "UPDATE cm_batches SET CurrentChicken = ? WHERE BatchID = ?", newPopulation, payload.BatchID)
	if err != nil {
		return 0, err
	}

	// If the batch is now empty, mark it as Sold
	if newPopulation <= 0 {
		_, err = tx.ExecContext(ctx, "UPDATE cm_batches SET Status = 'Sold' WHERE BatchID = ?", payload.BatchID)
		if err != nil {
			return 0, err
		}
	}

	// 2. Create the parent harvest record
	harvestNote := fmt.Sprintf("%d %s chickens harvested.", payload.QuantityHarvested, payload.ProductType)
	res, err := tx.ExecContext(ctx, "INSERT INTO cm_harvest (BatchID, HarvestDate, Notes) VALUES (?, ?, ?)", payload.BatchID, payload.HarvestDate, harvestNote)
	if err != nil {
		return 0, err
	}
	harvestID, _ := res.LastInsertId()

	// 3. Handle the harvest product and optional sale
	// vvvv  THIS IS THE NEW LOGIC  vvvv
	if payload.SaleDetails != nil {
		// --- INSTANT SALE LOGIC ---
		// The product is created with 0 remaining quantity because it's sold immediately.
		productQuery := `
			INSERT INTO cm_harvest_products 
			(HarvestID, ProductType, QuantityHarvested, WeightHarvestedKg, QuantityRemaining, WeightRemainingKg, IsActive) 
			VALUES (?, ?, ?, ?, 0, 0.00, 0)`
		res, err = tx.ExecContext(ctx, productQuery, harvestID, payload.ProductType, payload.QuantityHarvested, payload.TotalWeightKg)
		if err != nil {
			return 0, err
		}
		harvestProductID, _ := res.LastInsertId()

		// Create the corresponding sales order
		totalAmount := payload.TotalWeightKg * payload.SaleDetails.PricePerKg
		saleOrderQuery := `
			INSERT INTO cm_sales_orders (CustomerID, SaleDate, TotalAmount, PaymentMethod, Notes) 
			VALUES (?, ?, ?, ?, 'Instant sale from live harvest')`
		res, err = tx.ExecContext(ctx, saleOrderQuery, payload.SaleDetails.CustomerID, payload.HarvestDate, totalAmount, payload.SaleDetails.PaymentMethod)
		if err != nil {
			return 0, err
		}
		saleID, _ := res.LastInsertId()

		// Create the sales detail record linking the sale to the harvest
		saleDetailQuery := `
			INSERT INTO cm_sales_details (SaleID, HarvestProductID, QuantitySold, TotalWeightKg, PricePerKg) 
			VALUES (?, ?, ?, ?, ?)`
		_, err = tx.ExecContext(ctx, saleDetailQuery, saleID, harvestProductID, payload.QuantityHarvested, payload.TotalWeightKg, payload.SaleDetails.PricePerKg)
		if err != nil {
			return 0, err
		}
	} else {
		// --- HARVEST TO INVENTORY LOGIC ---
		// The product is created with its remaining quantity equal to the harvested quantity.
		productQuery := `
			INSERT INTO cm_harvest_products 
			(HarvestID, ProductType, QuantityHarvested, WeightHarvestedKg, QuantityRemaining, WeightRemainingKg) 
			VALUES (?, ?, ?, ?, ?, ?)`
		_, err = tx.ExecContext(ctx, productQuery, harvestID, payload.ProductType, payload.QuantityHarvested, payload.TotalWeightKg, payload.QuantityHarvested, payload.TotalWeightKg)
		if err != nil {
			return 0, err
		}
	}

	return harvestID, tx.Commit()
}

func (r *Repository) DeleteHarvestProduct(ctx context.Context, harvestProductID int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. BUSINESS RULE: Check if the product is part of any sale.
	var saleCount int
	err = tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM cm_sales_details WHERE HarvestProductID = ?", harvestProductID).Scan(&saleCount)
	if err != nil {
		return fmt.Errorf("failed to check for existing sales: %w", err)
	}
	if saleCount > 0 {
		return errors.New("cannot delete a harvested product that is already part of a sale")
	}

	// 2. Get the batch ID and quantity to revert the stock count.
	var batchID, quantityHarvested int
	infoQuery := `
		SELECT h.BatchID, hp.QuantityHarvested 
		FROM cm_harvest_products hp
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		WHERE hp.HarvestProductID = ?`
	err = tx.QueryRowContext(ctx, infoQuery, harvestProductID).Scan(&batchID, &quantityHarvested)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("harvest product not found")
		}
		return err
	}

	// 3. Delete the actual harvest product record.
	if _, err := tx.ExecContext(ctx, "DELETE FROM cm_harvest_products WHERE HarvestProductID = ?", harvestProductID); err != nil {
		return fmt.Errorf("failed to delete harvest product: %w", err)
	}

	// 4. Add the chicken count back to the original batch.
	updateBatchQuery := "UPDATE cm_batches SET CurrentChicken = CurrentChicken + ? WHERE BatchID = ?"
	if _, err := tx.ExecContext(ctx, updateBatchQuery, quantityHarvested, batchID); err != nil {
		return fmt.Errorf("failed to restore batch population: %w", err)
	}

	// 5. If all steps succeed, commit the transaction.
	return tx.Commit()
}

func (r *Repository) GetTotalWeightHarvestedForBatch(ctx context.Context, batchID int) (float64, error) {
	var totalWeight float64
	query := `
		SELECT COALESCE(SUM(WeightHarvestedKg), 0) FROM cm_harvest_products 
		WHERE HarvestID IN (SELECT HarvestID FROM cm_harvest WHERE BatchID = ?)`
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(&totalWeight)
	return totalWeight, err
}

func (r *Repository) GetSellableInventory(ctx context.Context) (int, error) {
	var sellableInventory int
	query := `SELECT COALESCE(SUM(QuantityRemaining), 0) FROM cm_harvest_products WHERE ProductType IN ('Live', 'Dressed') AND IsActive = 1`
	err := r.db.QueryRowContext(ctx, query).Scan(&sellableInventory)
	return sellableInventory, err
}

// Add this function to backend/internal/harvest/repository.go

func (r *Repository) CreateByproducts(ctx context.Context, payload models.ProcessPayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 1. Create a single parent harvest event for this processing action
	harvestNote := fmt.Sprintf("Processed %d Dressed chickens to create byproducts.", payload.QuantityToProcess)
	harvestQuery := "INSERT INTO cm_harvest (BatchID, HarvestDate, Notes) VALUES (?, ?, ?)"
	res, err := tx.ExecContext(ctx, harvestQuery, payload.BatchID, payload.ProcessingDate, harvestNote)
	if err != nil {
		return 0, err
	}
	newHarvestID, _ := res.LastInsertId()

	// 2. Loop through all yielded byproducts and create a record for each
	for _, yield := range payload.Yields {
		byproductQuery := `
			INSERT INTO cm_harvest_products 
			(HarvestID, ProductType, QuantityHarvested, WeightHarvestedKg, QuantityRemaining, WeightRemainingKg)
			VALUES (?, ?, 0, ?, 0, ?)`
		if _, err := tx.ExecContext(ctx, byproductQuery, newHarvestID, yield.ByproductType, yield.ByproductWeightKg, yield.ByproductWeightKg); err != nil {
			return 0, err
		}
	}

	return newHarvestID, tx.Commit()
}

func (r *Repository) AddProductType(ctx context.Context, newType string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil { return err }
	defer tx.Rollback()

	var enumStr string
	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_harvest_products' AND COLUMN_NAME = 'ProductType'`
	if err := tx.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		return err
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	existingTypes := strings.Split(cleanedStr, ",")
	for _, t := range existingTypes {
		if strings.EqualFold(t, newType) {
			return errors.New("this product type already exists")
		}
	}

	newEnumList := enumStr + ",'" + newType + "'"
	alterQuery := fmt.Sprintf("ALTER TABLE cm_harvest_products MODIFY COLUMN ProductType ENUM(%s)", newEnumList)
	if _, err := tx.ExecContext(ctx, alterQuery); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *Repository) GetProductTypeUsage(ctx context.Context) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT DISTINCT ProductType FROM cm_harvest_products")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var usedTypes []string
	for rows.Next() {
		var productType string
		if err := rows.Scan(&productType); err != nil {
			return nil, err
		}
		usedTypes = append(usedTypes, productType)
	}
	return usedTypes, nil
}

func (r *Repository) DeleteProductType(ctx context.Context, typeToDelete string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil { return err }
	defer tx.Rollback()

	var usageCount int
	err = tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM cm_harvest_products WHERE ProductType = ?", typeToDelete).Scan(&usageCount)
	if err != nil { return err }
	if usageCount > 0 {
		return errors.New("cannot delete a product type that is currently in use")
	}

	var enumStr string
	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_harvest_products' AND COLUMN_NAME = 'ProductType'`
	if err := tx.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		return err
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	existingTypes := strings.Split(cleanedStr, ",")
	var newTypes []string
	for _, t := range existingTypes {
		if !strings.EqualFold(t, typeToDelete) {
			newTypes = append(newTypes, "'"+t+"'")
		}
	}
	newEnumList := strings.Join(newTypes, ",")

	alterQuery := fmt.Sprintf("ALTER TABLE cm_harvest_products MODIFY COLUMN ProductType ENUM(%s)", newEnumList)
	if _, err := tx.ExecContext(ctx, alterQuery); err != nil {
		return err
	}

	return tx.Commit()
}

