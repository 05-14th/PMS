// File: backend/internal/sales/repository.go
package sales

import (
	"chickmate-api/internal/models"
	"context"
	"database/sql"
	"strings"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetSalesHistory(ctx context.Context) ([]models.SaleHistoryRecord, error) {
	query := `
		SELECT s.SaleID, s.SaleDate, c.Name, s.TotalAmount 
		FROM cm_sales_orders s
		JOIN cm_customers c ON s.CustomerID = c.CustomerID
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
		if err := rows.Scan(&rec.SaleID, &rec.SaleDate, &rec.CustomerName, &rec.TotalAmount); err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	return records, nil
}

func (r *Repository) GetAvailableProducts(ctx context.Context, productType string) ([]models.SaleProduct, error) {
	query := "SELECT HarvestProductID, ProductType, QuantityRemaining, WeightRemainingKg FROM cm_harvest_products WHERE IsActive = 1 AND (QuantityRemaining > 0 OR WeightRemainingKg > 0)"
	var args []interface{}
	if productType != "" {
		query += " AND ProductType = ?"
		args = append(args, productType)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.SaleProduct
	for rows.Next() {
		var p models.SaleProduct
		if err := rows.Scan(&p.HarvestProductID, &p.ProductType, &p.QuantityRemaining, &p.WeightRemainingKg); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *Repository) GetSaleDetails(ctx context.Context, saleID int) ([]models.SaleDetailItem, error) {
	query := `
		SELECT 
			sd.SaleDetailID, hp.ProductType, sd.QuantitySold, 
			sd.TotalWeightKg, sd.PricePerKg
		FROM cm_sales_details sd
		JOIN cm_harvest_products hp ON sd.HarvestProductID = hp.HarvestProductID
		WHERE sd.SaleID = ?;`

	rows, err := r.db.QueryContext(ctx, query, saleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var details []models.SaleDetailItem
	for rows.Next() {
		var d models.SaleDetailItem
		if err := rows.Scan(&d.SaleDetailID, &d.ItemName, &d.QuantitySold, &d.TotalWeightKg, &d.PricePerKg); err != nil {
			return nil, err
		}
		details = append(details, d)
	}
	return details, nil
}

func (r *Repository) CreateSale(ctx context.Context, payload models.SalePayload, totalAmount float64) (int64, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	saleQuery := "INSERT INTO cm_sales_orders (CustomerID, SaleDate, TotalAmount, PaymentMethod, Notes, IsActive) VALUES (?, ?, ?, ?, ?, 1)"
	res, err := tx.ExecContext(ctx, saleQuery, payload.CustomerID, payload.SaleDate, totalAmount, payload.PaymentMethod, payload.Notes)
	if err != nil {
		return 0, err
	}
	saleID, _ := res.LastInsertId()

	for _, item := range payload.Items {
		var currentQty, currentWeight float64
		checkQuery := "SELECT QuantityRemaining, WeightRemainingKg FROM cm_harvest_products WHERE HarvestProductID = ? FOR UPDATE"
		if err := tx.QueryRowContext(ctx, checkQuery, item.HarvestProductID).Scan(&currentQty, &currentWeight); err != nil {
			return 0, err
		}

		newQtyRemaining := currentQty - item.QuantitySold
		newWeightRemaining := currentWeight - item.TotalWeightKg

		if newQtyRemaining < 0 || newWeightRemaining < 0 {
			return 0, sql.ErrNoRows // Using this error to signify insufficient stock
		}

		updateStockQuery := "UPDATE cm_harvest_products SET QuantityRemaining = ?, WeightRemainingKg = ? WHERE HarvestProductID = ?"
		_, err = tx.ExecContext(ctx, updateStockQuery, newQtyRemaining, newWeightRemaining, item.HarvestProductID)
		if err != nil {
			return 0, err
		}

		if newQtyRemaining <= 0 && newWeightRemaining <= 0 {
			_, err = tx.ExecContext(ctx, "UPDATE cm_harvest_products SET IsActive = 0 WHERE HarvestProductID = ?", item.HarvestProductID)
			if err != nil {
				return 0, err
			}
		}

		detailQuery := "INSERT INTO cm_sales_details (SaleID, HarvestProductID, QuantitySold, TotalWeightKg, PricePerKg) VALUES (?, ?, ?, ?, ?)"
		if _, err := tx.ExecContext(ctx, detailQuery, saleID, item.HarvestProductID, item.QuantitySold, item.TotalWeightKg, item.PricePerKg); err != nil {
			return 0, err
		}
	}

	return saleID, tx.Commit()
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

func (r *Repository) GetTotalRevenueForBatch(ctx context.Context, batchID int) (float64, error) {
	var totalRevenue float64
	query := `
		SELECT COALESCE(SUM(sd.TotalWeightKg * sd.PricePerKg), 0)
		FROM cm_sales_details sd
		JOIN cm_harvest_products hp ON sd.HarvestProductID = hp.HarvestProductID
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		WHERE h.BatchID = ?`
	err := r.db.QueryRowContext(ctx, query, batchID).Scan(&totalRevenue)
	return totalRevenue, err
}

func (r *Repository) GetMonthlyRevenue(ctx context.Context) (float64, error) {
	var monthlyRevenue float64
	query := `SELECT COALESCE(SUM(TotalAmount), 0) FROM cm_sales_orders WHERE SaleDate >= CURDATE() - INTERVAL 30 DAY AND IsActive = 1`
	err := r.db.QueryRowContext(ctx, query).Scan(&monthlyRevenue)
	return monthlyRevenue, err
}

func (r *Repository) GetRevenueTimeline(ctx context.Context) (map[string]float64, error) {
	query := `
		SELECT DATE(SaleDate), SUM(TotalAmount) 
		FROM cm_sales_orders 
		WHERE SaleDate >= CURDATE() - INTERVAL 30 DAY AND IsActive = 1 
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