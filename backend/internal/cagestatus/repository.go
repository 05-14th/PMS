package cagestatus

import (
	"context"
	"database/sql"
	"os"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// GetActiveBatches returns the list of active batches.
// Adjust the table and column names to match your schema.
func (r *Repository) GetActiveBatches(ctx context.Context) ([]ActiveBatch, error) {
	query := os.Getenv("GET_ACTIVE_BATCHES")

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ActiveBatch

	for rows.Next() {
		var b ActiveBatch
		if err := rows.Scan(&b.BatchID, &b.BatchName, &b.CageNum); err != nil {
			return nil, err
		}
		result = append(result, b)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}
