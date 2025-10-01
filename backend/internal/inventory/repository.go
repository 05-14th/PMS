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

func (r *Repository) GetItems(ctx context.Context, category string) ([]models.InventoryItem, error) {
	query := `
		SELECT
			i.ItemID, i.ItemName, i.Category, i.Unit,
			COALESCE(SUM(p.QuantityRemaining), 0) as TotalQuantityRemaining
		FROM cm_items i
		LEFT JOIN cm_inventory_purchases p ON i.ItemID = p.ItemID AND p.IsActive = 1
		WHERE i.IsActive = 1`
	var args []interface{}

	if category != "" {
		query += " AND i.Category = ?"
		args = append(args, category)
	}
	query += " GROUP BY i.ItemID, i.ItemName, i.Category, i.Unit ORDER BY i.ItemName;"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.InventoryItem
	for rows.Next() {
		var item models.InventoryItem
		if err := rows.Scan(&item.ItemID, &item.ItemName, &item.Category, &item.Unit, &item.TotalQuantityRemaining); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

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

// CreatePurchase creates a new inventory purchase record.
func (r *Repository) CreatePurchase(ctx context.Context, p models.PurchasePayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Reactivate the item in case it was archived
	_, err = tx.ExecContext(ctx, "UPDATE cm_items SET IsActive = 1 WHERE ItemID = ?", p.ItemID)
	if err != nil {
		return 0, err
	}

	query := `
		INSERT INTO cm_inventory_purchases 
		(ItemID, SupplierID, PurchaseDate, QuantityPurchased, UnitCost, QuantityRemaining, ReceiptInfo) 
		VALUES (?, ?, ?, ?, ?, ?, ?)`
	res, err := tx.ExecContext(ctx, query, p.ItemID, p.SupplierID, p.PurchaseDate, p.QuantityPurchased, p.UnitCost, p.QuantityPurchased, p.ReceiptInfo)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

// CreateNewStockItem handles the complex transaction of creating a new item and its initial purchase.
func (r *Repository) CreateNewStockItem(ctx context.Context, payload models.NewStockItemPayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	var supplierID int64
	if payload.ExistingSupplierID != nil {
		supplierID = int64(*payload.ExistingSupplierID)
	} else if payload.NewSupplierName != nil {
		supplierQuery := "INSERT INTO cm_suppliers (SupplierName, ContactPerson, PhoneNumber, Email, Address, Notes) VALUES (?, ?, ?, ?, ?, ?)"
		res, err := tx.ExecContext(ctx, supplierQuery, payload.NewSupplierName, payload.ContactPerson, payload.PhoneNumber, payload.Email, payload.Address, payload.Notes)
		if err != nil {
			return 0, err
		}
		supplierID, _ = res.LastInsertId()
	}

	itemQuery := "INSERT INTO cm_items (ItemName, Category, Unit) VALUES (?, ?, ?)"
	res, err := tx.ExecContext(ctx, itemQuery, payload.ItemName, payload.Category, payload.Unit)
	if err != nil {
		return 0, err
	}
	itemID, _ := res.LastInsertId()

	purchaseQuery := "INSERT INTO cm_inventory_purchases (ItemID, SupplierID, PurchaseDate, QuantityPurchased, UnitCost, QuantityRemaining, ReceiptInfo) VALUES (?, ?, ?, ?, ?, ?, ?)"
	_, err = tx.ExecContext(ctx, purchaseQuery, itemID, supplierID, payload.PurchaseDate, payload.QuantityPurchased, payload.AmountPaid, payload.QuantityPurchased, payload.ReceiptInfo)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return itemID, nil
}

// Add these functions to backend/internal/inventory/repository.go

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

func (r *Repository) GetTotalFeedConsumedForBatch(ctx context.Context, batchID int) (float64, error) {
	var totalFeed float64
	query := `
		SELECT COALESCE(SUM(iu.QuantityUsed), 0) FROM cm_inventory_usage iu 
		JOIN cm_items i ON iu.ItemID = i.ItemID 
		WHERE iu.BatchID = ? AND i.Category = 'Feed'`
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(&totalFeed)
	return totalFeed, err
}

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
		// Scan into the RawQty and other internal fields
		if err := rows.Scan(&s.Name, &s.Unit, &s.Category, &s.RawQty); err != nil {
			return nil, err
		}
		
		s.ID = strings.ToLower(strings.ReplaceAll(s.Name, " ", "-"))
		// Use the internal fields to create the final display string
		s.Quantity = fmt.Sprintf("%.2f %s left", s.RawQty, s.Unit)
		stockList = append(stockList, s)
	}
	return stockList, nil
}

func (r *Repository) GetTotalStockForItem(ctx context.Context, itemID int) (float64, error) {
	var totalStock float64
	query := "SELECT COALESCE(SUM(QuantityRemaining), 0) FROM cm_inventory_purchases WHERE ItemID = ? AND IsActive = 1"
	err := r.db.QueryRowContext(ctx, query, itemID).Scan(&totalStock)
	return totalStock, err
}

func (r *Repository) CreateItem(ctx context.Context, item models.InventoryItem) (int64, error) {
	query := "INSERT INTO cm_items (ItemName, Category, Unit) VALUES (?, ?, ?)"
	res, err := r.db.ExecContext(ctx, query, item.ItemName, item.Category, item.Unit)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateItem(ctx context.Context, item models.InventoryItem, itemID int) error {
	query := "UPDATE cm_items SET ItemName = ?, Category = ?, Unit = ? WHERE ItemID = ?"
	_, err := r.db.ExecContext(ctx, query, item.ItemName, item.Category, item.Unit, itemID)
	return err
}

// DeleteItem archives an item by setting its IsActive flag to 0.
func (r *Repository) DeleteItem(ctx context.Context, itemID int) error {
	query := "UPDATE cm_items SET IsActive = 0 WHERE ItemID = ?"
	_, err := r.db.ExecContext(ctx, query, itemID)
	return err
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

func (r *Repository) UpdatePurchase(ctx context.Context, p models.PurchasePayload, purchaseID int) error {
	query := "UPDATE cm_inventory_purchases SET SupplierID = ?, PurchaseDate = ?, QuantityPurchased = ?, UnitCost = ?, QuantityRemaining = ?, ReceiptInfo = ? WHERE PurchaseID = ?"
	_, err := r.db.ExecContext(ctx, query, p.SupplierID, p.PurchaseDate, p.QuantityPurchased, p.UnitCost, p.QuantityPurchased, p.ReceiptInfo, purchaseID)
	return err
}

// DeletePurchase soft-deletes a purchase record.
func (r *Repository) DeletePurchase(ctx context.Context, purchaseID int) error {
	query := "UPDATE cm_inventory_purchases SET IsActive = 0 WHERE PurchaseID = ?"
	_, err := r.db.ExecContext(ctx, query, purchaseID)
	return err
}

func (r *Repository) CreateStockItem(ctx context.Context, payload models.NewStockItemPayload) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 1. Determine the Supplier ID (use existing or create new)
	var supplierID int64
	if payload.ExistingSupplierID != nil {
		supplierID = int64(*payload.ExistingSupplierID)
	} else if payload.NewSupplierName != nil {
		supplierQuery := "INSERT INTO cm_suppliers (SupplierName, ContactPerson, PhoneNumber, Email, Address, Notes) VALUES (?, ?, ?, ?, ?, ?)"
		res, err := tx.ExecContext(ctx, supplierQuery, payload.NewSupplierName, payload.ContactPerson, payload.PhoneNumber, payload.Email, payload.Address, payload.Notes)
		if err != nil {
			return 0, err
		}
		supplierID, _ = res.LastInsertId()
	}

	// 2. Create the new item in cm_items
	itemQuery := "INSERT INTO cm_items (ItemName, Category, Unit) VALUES (?, ?, ?)"
	res, err := tx.ExecContext(ctx, itemQuery, payload.ItemName, payload.Category, payload.Unit)
	if err != nil {
		return 0, err
	}
	itemID, _ := res.LastInsertId()

	// 3. Create the initial purchase record in cm_inventory_purchases
	purchaseQuery := "INSERT INTO cm_inventory_purchases (ItemID, SupplierID, PurchaseDate, QuantityPurchased, UnitCost, QuantityRemaining, ReceiptInfo) VALUES (?, ?, ?, ?, ?, ?, ?)"
	_, err = tx.ExecContext(ctx, purchaseQuery, itemID, supplierID, payload.PurchaseDate, payload.QuantityPurchased, payload.AmountPaid, payload.QuantityPurchased, payload.ReceiptInfo)
	if err != nil {
		return 0, err
	}

	// If all steps succeed, commit the transaction
	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return itemID, nil
}

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
