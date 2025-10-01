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
	KgPerBird   float64
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

// This simpler query gets the total lifetime consumption per bird for each feed type.
func (r *Repository) GetHistoricalConsumptionPerBird(ctx context.Context) ([]ConsumptionRate, error) {
	query := `
		SELECT
			i.SubCategory,
			SUM(iu.QuantityUsed) / SUM(b.TotalChicken) as KgPerBird
		FROM cm_inventory_usage iu
		JOIN cm_items i ON iu.ItemID = i.ItemID
		JOIN cm_batches b ON iu.BatchID = b.BatchID
		WHERE b.Status = 'Sold' AND i.Category = 'Feed' AND i.SubCategory IS NOT NULL
		GROUP BY i.SubCategory;
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rates []ConsumptionRate
	for rows.Next() {
		var rate ConsumptionRate
		if err := rows.Scan(&rate.SubCategory, &rate.KgPerBird); err != nil {
			return nil, err
		}
		rates = append(rates, rate)
	}
	return rates, nil
}