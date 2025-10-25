// File: backend/internal/inventory/repository.go
package inventory

import (
	"chickmate-api/internal/models"
	"context"
	"database/sql"
	"fmt"
	"strings"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// CreateItem creates a simple item without an initial purchase.
func (r *Repository) CreateItem(ctx context.Context, item models.InventoryItem) (int64, error) {
	query := "INSERT INTO cm_items (ItemName, Category, Unit, SubCategory) VALUES (?, ?, ?, ?)"
	res, err := r.db.ExecContext(ctx, query, item.ItemName, item.Category, item.Unit, item.SubCategory)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

// CreateStockItem handles the transaction of creating a new item AND its initial purchase.
func (r *Repository) CreateStockItem(ctx context.Context, payload models.NewStockItemPayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}

	var supplierID int64
	if payload.ExistingSupplierID != nil {
		supplierID = int64(*payload.ExistingSupplierID)
	} else if payload.NewSupplierName != nil {
		supplierQuery := "INSERT INTO cm_suppliers (SupplierName, ContactPerson, PhoneNumber, Email, Address, Notes) VALUES (?, ?, ?, ?, ?, ?)"
		res, err := tx.ExecContext(ctx, supplierQuery, payload.NewSupplierName, payload.ContactPerson, payload.PhoneNumber, payload.Email, payload.Address, payload.Notes)
		if err != nil {
			tx.Rollback()
			return 0, err
		}
		supplierID, _ = res.LastInsertId()
	}

	itemQuery := "INSERT INTO cm_items (ItemName, Category, Unit, SubCategory) VALUES (?, ?, ?, ?)"
	res, err := tx.ExecContext(ctx, itemQuery, payload.ItemName, payload.Category, payload.Unit, payload.SubCategory)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	itemID, _ := res.LastInsertId()

	purchaseQuery := "INSERT INTO cm_inventory_purchases (ItemID, SupplierID, PurchaseDate, QuantityPurchased, UnitCost, QuantityRemaining, ReceiptInfo) VALUES (?, ?, ?, ?, ?, ?, ?)"
	
    // --- FIX: Use payload.UnitCost instead of payload.AmountPaid ---
	_, err = tx.ExecContext(ctx, purchaseQuery, itemID, supplierID, payload.PurchaseDate, payload.QuantityPurchased, payload.UnitCost, payload.QuantityPurchased, payload.ReceiptInfo)
	if err != nil {
		tx.Rollback()
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		tx.Rollback()
		return 0, err
	}

	return itemID, nil
}


// CreatePurchase adds a new purchase record for an existing item.
func (r *Repository) CreatePurchase(ctx context.Context, p models.PurchasePayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, "UPDATE cm_items SET IsActive = 1 WHERE ItemID = ?", p.ItemID)
	if err != nil {
		return 0, err
	}

	query := "INSERT INTO cm_inventory_purchases (ItemID, SupplierID, PurchaseDate, QuantityPurchased, UnitCost, QuantityRemaining, ReceiptInfo) VALUES (?, ?, ?, ?, ?, ?, ?)"
	res, err := tx.ExecContext(ctx, query, p.ItemID, p.SupplierID, p.PurchaseDate, p.QuantityPurchased, p.UnitCost, p.QuantityPurchased, p.ReceiptInfo)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

// GetItems retrieves all active items.
func (r *Repository) GetItems(ctx context.Context, category string) ([]models.InventoryItem, error) {
	query := `
		SELECT
			i.ItemID, i.ItemName, i.Category, i.Unit, i.SubCategory,
			COALESCE(SUM(p.QuantityRemaining), 0) as TotalQuantityRemaining
		FROM cm_items i
		LEFT JOIN cm_inventory_purchases p ON i.ItemID = p.ItemID AND p.IsActive = 1
		WHERE i.IsActive = 1`
	var args []interface{}
	if category != "" {
		query += " AND i.Category = ?"
		args = append(args, category)
	}
	query += " GROUP BY i.ItemID, i.ItemName, i.Category, i.Unit, i.SubCategory ORDER BY i.ItemName;"
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.InventoryItem
	for rows.Next() {
		var item models.InventoryItem
		if err := rows.Scan(&item.ItemID, &item.ItemName, &item.Category, &item.Unit, &item.SubCategory, &item.TotalQuantityRemaining); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

// UpdateItem updates an existing item's details.
func (r *Repository) UpdateItem(ctx context.Context, item models.InventoryItem, itemID int) error {
	query := "UPDATE cm_items SET ItemName = ?, Category = ?, Unit = ?, SubCategory = ? WHERE ItemID = ?"
	_, err := r.db.ExecContext(ctx, query, item.ItemName, item.Category, item.Unit, item.SubCategory, itemID)
	return err
}

// DeleteItem archives an item by setting its IsActive flag to 0.
func (r *Repository) DeleteItem(ctx context.Context, itemID int) error {
	query := "UPDATE cm_items SET IsActive = 0 WHERE ItemID = ?"
	_, err := r.db.ExecContext(ctx, query, itemID)
	return err
}

// DeleteUsage reverses a usage record and restores stock quantities.
func (r *Repository) DeleteUsage(ctx context.Context, usageID int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	type reversalDetail struct {
		PurchaseID    int
		QuantityDrawn float64
	}
	var details []reversalDetail

	rows, err := tx.QueryContext(ctx, "SELECT PurchaseID, QuantityDrawn FROM cm_inventory_usage_details WHERE UsageID = ?", usageID)
	if err != nil {
		return fmt.Errorf("failed to find usage details for reversal: %w", err)
	}

	for rows.Next() {
		var d reversalDetail
		if err := rows.Scan(&d.PurchaseID, &d.QuantityDrawn); err != nil {
			rows.Close()
			return err
		}
		details = append(details, d)
	}
	rows.Close()

	for _, d := range details {
		_, err = tx.ExecContext(ctx, "UPDATE cm_inventory_purchases SET QuantityRemaining = QuantityRemaining + ? WHERE PurchaseID = ?", d.QuantityDrawn, d.PurchaseID)
		if err != nil {
			return fmt.Errorf("failed to restore inventory stock: %w", err)
		}
	}

	if _, err := tx.ExecContext(ctx, "DELETE FROM cm_inventory_usage_details WHERE UsageID = ?", usageID); err != nil {
		return fmt.Errorf("failed to delete usage details: %w", err)
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM cm_inventory_usage WHERE UsageID = ?", usageID); err != nil {
		return fmt.Errorf("failed to delete usage record: %w", err)
	}

	return tx.Commit()
}

// GetPurchaseHistory retrieves all purchases for a specific item.
func (r *Repository) GetPurchaseHistory(ctx context.Context, itemID int) ([]models.PurchaseHistoryDetail, error) {
	query := `
		SELECT p.PurchaseID, p.PurchaseDate, p.QuantityPurchased, p.QuantityRemaining, p.UnitCost, s.SupplierName, p.ReceiptInfo
		FROM cm_inventory_purchases p
		JOIN cm_suppliers s ON p.SupplierID = s.SupplierID
		WHERE p.ItemID = ? AND p.IsActive = 1
		ORDER BY p.PurchaseDate DESC;`

	rows, err := r.db.QueryContext(ctx, query, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var details []models.PurchaseHistoryDetail
	for rows.Next() {
		var d models.PurchaseHistoryDetail
		if err := rows.Scan(&d.PurchaseID, &d.PurchaseDate, &d.QuantityPurchased, &d.QuantityRemaining, &d.UnitCost, &d.SupplierName, &d.ReceiptInfo); err != nil {
			return nil, err
		}
		details = append(details, d)
	}
	return details, nil
}

// UpdatePurchase updates a specific purchase record.
func (r *Repository) UpdatePurchase(ctx context.Context, p models.PurchasePayload, purchaseID int) error {
	query := "UPDATE cm_inventory_purchases SET SupplierID = ?, PurchaseDate = ?, QuantityPurchased = ?, UnitCost = ?, QuantityRemaining = ?, ReceiptInfo = ? WHERE PurchaseID = ?"
	_, err := r.db.ExecContext(ctx, query, p.SupplierID, p.PurchaseDate, p.QuantityPurchased, p.UnitCost, p.QuantityPurchased, p.ReceiptInfo, purchaseID)
	return err
}

// DeletePurchase archives a specific purchase record.
func (r *Repository) DeletePurchase(ctx context.Context, purchaseID int) error {
	query := "UPDATE cm_inventory_purchases SET IsActive = 0 WHERE PurchaseID = ?"
	_, err := r.db.ExecContext(ctx, query, purchaseID)
	return err
}

// GetStockLevels retrieves a summary of all items and their total remaining stock.
func (r *Repository) GetStockLevels(ctx context.Context) ([]models.StockLevelSummary, error) {
	query := `
		SELECT
			i.ItemID, i.ItemName, COALESCE(SUM(p.QuantityRemaining), 0),
			i.Unit, i.IsActive, i.Category
		FROM cm_items i
		LEFT JOIN cm_inventory_purchases p ON i.ItemID = p.ItemID AND p.IsActive = 1
		WHERE i.IsActive = 1
		GROUP BY i.ItemID, i.ItemName, i.Unit, i.IsActive, i.Category
		ORDER BY i.ItemName;`
	
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []models.StockLevelSummary
	for rows.Next() {
		var s models.StockLevelSummary
		if err := rows.Scan(&s.ItemID, &s.ItemName, &s.TotalQuantityRemaining, &s.Unit, &s.IsActive, &s.Category); err != nil {
			return nil, err
		}
		summaries = append(summaries, s)
	}
	return summaries, nil
}

// GetStockStatus retrieves item stock for the dashboard.
func (r *Repository) GetStockStatus(ctx context.Context) ([]models.StockStatus, error) {
	query := `
		SELECT i.ItemName, i.Unit, i.Category, COALESCE(SUM(p.QuantityRemaining), 0) as TotalStock
		FROM cm_items i
		LEFT JOIN cm_inventory_purchases p ON i.ItemID = p.ItemID AND p.IsActive = 1
		WHERE i.IsActive = 1
		GROUP BY i.ItemID, i.ItemName, i.Unit, i.Category`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stockList []models.StockStatus
	for rows.Next() {
		var s models.StockStatus
		if err := rows.Scan(&s.Name, &s.Unit, &s.Category, &s.RawQty); err != nil {
			return nil, err
		}
		
		s.ID = strings.ToLower(strings.ReplaceAll(s.Name, " ", "-"))
		s.Quantity = fmt.Sprintf("%.2f %s left", s.RawQty, s.Unit)
		stockList = append(stockList, s)
	}
	return stockList, nil
}

// GetTotalFeedCostForBatch calculates total feed cost for a given batch.
func (r *Repository) GetTotalFeedCostForBatch(ctx context.Context, batchID int) (float64, error) {
	var feedCost float64
	query := `
		SELECT COALESCE(SUM(iud.QuantityDrawn / NULLIF(ip.QuantityPurchased, 0) * ip.UnitCost), 0) 
		FROM cm_inventory_usage iu
		JOIN cm_inventory_usage_details iud ON iu.UsageID = iud.UsageID
		JOIN cm_inventory_purchases ip ON iud.PurchaseID = ip.PurchaseID
		JOIN cm_items i ON iu.ItemID = i.ItemID
		WHERE iu.BatchID = ? AND i.Category = 'Feed'`
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(&feedCost)
	return feedCost, err
}

// GetTotalFeedConsumedForBatch calculates total feed consumed for a given batch.
func (r *Repository) GetTotalFeedConsumedForBatch(ctx context.Context, batchID int) (float64, error) {
	var totalFeed float64
	query := `
		SELECT COALESCE(SUM(iu.QuantityUsed), 0) FROM cm_inventory_usage iu 
		JOIN cm_items i ON iu.ItemID = i.ItemID 
		WHERE iu.BatchID = ? AND i.Category = 'Feed'`
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(&totalFeed)
	return totalFeed, err
}

// GetFeedCostsByActiveBatch calculates feed costs for all active batches.
func (r *Repository) GetFeedCostsByActiveBatch(ctx context.Context) (map[int]float64, error) {
	query := `
		SELECT iu.BatchID, COALESCE(SUM(iud.QuantityDrawn / NULLIF(ip.QuantityPurchased, 0) * ip.UnitCost), 0)
		FROM cm_inventory_usage iu
		JOIN cm_inventory_usage_details iud ON iu.UsageID = iud.UsageID
		JOIN cm_inventory_purchases ip ON iud.PurchaseID = ip.PurchaseID
		JOIN cm_items i ON iu.ItemID = i.ItemID
		WHERE iu.BatchID IN (SELECT BatchID FROM cm_batches WHERE Status = 'Active') AND i.Category = 'Feed'
		GROUP BY iu.BatchID`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	costMap := make(map[int]float64)
	for rows.Next() {
		var batchID int
		var totalCost float64
		if err := rows.Scan(&batchID, &totalCost); err != nil {
			return nil, err
		}
		costMap[batchID] = totalCost
	}
	return costMap, nil
}

// GetTotalStockForItem gets the remaining stock for a single item.
func (r *Repository) GetTotalStockForItem(ctx context.Context, itemID int) (float64, error) {
	var totalStock float64
	query := "SELECT COALESCE(SUM(QuantityRemaining), 0) FROM cm_inventory_purchases WHERE ItemID = ? AND IsActive = 1"
	err := r.db.QueryRowContext(ctx, query, itemID).Scan(&totalStock)
	return totalStock, err
}

// IsPurchaseUsed checks if a purchase has been drawn from.
func (r *Repository) IsPurchaseUsed(ctx context.Context, purchaseID int) (bool, error) {
	var qtyPurchased, qtyRemaining float64
	query := "SELECT QuantityPurchased, QuantityRemaining FROM cm_inventory_purchases WHERE PurchaseID = ?"
	err := r.db.QueryRowContext(ctx, query, purchaseID).Scan(&qtyPurchased, &qtyRemaining)
	if err != nil {
		return false, err
	}
	return qtyPurchased != qtyRemaining, nil
}

// Helper function to get ENUM values from a table column
func (r *Repository) getEnumValues(ctx context.Context, tableName, columnName string) ([]string, error) {
	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`
	
	var enumStr string
	if err := r.db.QueryRowContext(ctx, query, tableName, columnName).Scan(&enumStr); err != nil {
		return nil, err
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	return strings.Split(cleanedStr, ","), nil
}

func (r *Repository) GetCategories(ctx context.Context) ([]string, error) {
	return r.getEnumValues(ctx, "cm_items", "Category")
}

func (r *Repository) GetUnits(ctx context.Context) ([]string, error) {
	return r.getEnumValues(ctx, "cm_items", "Unit")
}

func (r *Repository) GetSubCategories(ctx context.Context) ([]string, error) {
	return r.getEnumValues(ctx, "cm_items", "SubCategory")
}



// File: backend/internal/inventory/repository.go

func (r *Repository) GetHarvestedProducts(ctx context.Context, productType string, batchID int) ([]models.HarvestedInventoryItem, error) {
	
	query := `
			SELECT 
				hp.HarvestProductID, 
				h.HarvestDate, 
				hp.ProductType, 
				b.BatchName AS BatchName, 
				hp.QuantityHarvested, 
				hp.WeightHarvestedKg, 
				hp.QuantityRemaining, 
				hp.WeightRemainingKg
			FROM cm_harvest_products hp
			LEFT JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
			LEFT JOIN cm_batches b ON h.BatchID = b.BatchID
			WHERE 1=1`
	
	var args []interface{}
	
	// This logic correctly adds the filter for product type to the query
	if productType != "All" && productType != "" {
		query += " AND hp.ProductType = ?"
		args = append(args, productType)
	}
	
	// This logic correctly adds the filter for batch ID to the query
	if batchID > 0 {
		query += " AND h.BatchID = ?"
		args = append(args, batchID)
	}

	query += " ORDER BY h.HarvestDate DESC;"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.HarvestedInventoryItem
	for rows.Next() {
		var item models.HarvestedInventoryItem
		if err := rows.Scan(
			&item.HarvestProductID, 
			&item.HarvestDate, 
			&item.ProductType, 
			&item.BatchName,
			&item.QuantityHarvested, 
			&item.WeightHarvestedKg, 
			&item.QuantityRemaining, 
			&item.WeightRemainingKg,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}


func (r *Repository) GetHarvestedProductsSummary(ctx context.Context, productType string, batchID int) (models.HarvestedProductsSummary, error) {
	summary := models.HarvestedProductsSummary{}

	query := `
		SELECT 
			COALESCE(SUM(CASE WHEN hp.ProductType = 'Dressed' THEN hp.QuantityRemaining ELSE 0 END), 0) AS TotalDressed,
			COALESCE(SUM(CASE WHEN hp.ProductType = 'Live' THEN hp.QuantityRemaining ELSE 0 END), 0) AS TotalLive,
			COALESCE(SUM(CASE WHEN hp.ProductType NOT IN ('Dressed', 'Live') THEN hp.WeightRemainingKg ELSE 0 END), 0) AS TotalByproductWeight
		FROM cm_harvest_products hp
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		WHERE hp.IsActive = 1`

	var args []interface{}

	if productType != "All" && productType != "" {
		if productType != "Dressed" && productType != "Live" {
			query += " AND hp.ProductType = ?"
			args = append(args, productType)
		}
	}
	
	if batchID > 0 {
		query += " AND h.BatchID = ?"
		args = append(args, batchID)
	}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&summary.TotalDressed,
		&summary.TotalLive,
		&summary.TotalByproductWeight,
	)

	if productType == "Live" {
		summary.TotalDressed = 0
		summary.TotalByproductWeight = 0
	} else if productType == "Dressed" {
		summary.TotalLive = 0
		summary.TotalByproductWeight = 0
	} else if productType != "All" && productType != "" {
		summary.TotalDressed = 0
		summary.TotalLive = 0
	}

	if err != nil {
		return models.HarvestedProductsSummary{}, err
	}

	return summary, nil
}