// File: backend/internal/report/repository.go
package report

import (
	"context"
	"database/sql"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// GetOtherCostsForBatch fetches all production costs EXCEPT for the initial chick purchase.
func (r *Repository) GetOtherCostsForBatch(ctx context.Context, batchID int) (map[string]float64, error) {
	query := `
		SELECT CostType, COALESCE(SUM(Amount), 0) as TotalAmount 
		FROM cm_production_cost 
		WHERE BatchID = ? AND CostType != 'Chick Purchase' 
		GROUP BY CostType`
	rows, err := r.db.QueryContext(ctx, query, batchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	costs := make(map[string]float64)
	for rows.Next() {
		var costType string
		var amount float64
		if err := rows.Scan(&costType, &amount); err != nil {
			return nil, err
		}
		costs[costType] = amount
	}
	return costs, nil
}