// File: backend/internal/planning/repository.go
package planning

import (
	"context"
	"database/sql"
)

type Repository struct {
	db *sql.DB
}

// This struct holds the final calculated rate from the DB
type ConsumptionRate struct {
	SubCategory string
	ItemName    string
	Category    string
	Unit        string // <-- ADD THIS
	AmountPerBird float64 // <-- RENAME KgPerBird for clarity
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetHistoricalAvgDuration(ctx context.Context) (float64, error) {
	var avgDuration sql.NullFloat64
	query := `SELECT AVG(DATEDIFF((SELECT MAX(h.HarvestDate) FROM cm_harvest h WHERE h.BatchID = b.BatchID), b.StartDate)) + 1 FROM cm_batches b WHERE b.Status = 'Sold'`
	err := r.db.QueryRowContext(ctx, query).Scan(&avgDuration)
	if err != nil || !avgDuration.Valid {
		return 40, err // Default duration
	}
	return avgDuration.Float64, nil
}

func (r *Repository) GetBatchStatus(ctx context.Context, batchID int) (string, error) {
    var status string
    err := r.db.QueryRowContext(ctx, "SELECT Status FROM cm_batches WHERE BatchID = ?", batchID).Scan(&status)
    return status, err
}

// This simpler query gets the total lifetime consumption per bird for each feed type.
func (r *Repository) GetHistoricalConsumptionPerBird(ctx context.Context) ([]ConsumptionRate, error) {
	// 3. UPDATE the query to SELECT the unit and rename the final column
	query := `
		SELECT
			COALESCE(i.SubCategory, i.ItemName) as GroupName,
			i.ItemName,
			i.Category,
			i.Unit, -- <-- ADD THIS
			SUM(iu.QuantityUsed) / (
				SELECT SUM(b_inner.TotalChicken)
				FROM cm_batches b_inner WHERE b_inner.Status = 'Sold'
			) as AmountPerBird -- <-- RENAME this column
		FROM cm_inventory_usage iu
		JOIN cm_items i ON iu.ItemID = i.ItemID
		JOIN cm_batches b ON iu.BatchID = b.BatchID
		WHERE b.Status = 'Sold'
		GROUP BY GroupName, i.ItemName, i.Category, i.Unit;
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil { return nil, err }
	defer rows.Close()

	var rates []ConsumptionRate
	for rows.Next() {
		var rate ConsumptionRate
		// 4. UPDATE the Scan call to include the new Unit field
		if err := rows.Scan(&rate.SubCategory, &rate.ItemName, &rate.Category, &rate.Unit, &rate.AmountPerBird); err != nil {
			return nil, err
		}
		rates = append(rates, rate)
	}
	return rates, nil
}