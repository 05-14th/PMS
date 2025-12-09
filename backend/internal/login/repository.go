// File: backend/internal/login/repository.go
package login

import (
	"context"
	"database/sql"
	"errors"
)

// Repository is the data access layer for login validation.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new login repository.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetUserCredentials(ctx context.Context, username string) (string, string, error) {
	var dbPassword, role string
	query := `SELECT password, role FROM cm_users WHERE username = ? LIMIT 1`
	
	err := r.db.QueryRowContext(ctx, query, username).Scan(&dbPassword, &role)
	if errors.Is(err, sql.ErrNoRows) {
		return "", "", errors.New("user not found")
	}
	return dbPassword, role, err
}