// File: backend/internal/register/repository.go
package register

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"chickmate-api/internal/models"
)

// Repository is the data access layer for user registration.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new register repository.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// CreateUser handles the user registration and inserts the user data.
func (r *Repository) CreateUser(ctx context.Context, user models.UserRegistrationPayload, hashedPassword string, profilePicPath string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO cm_users 
		(username, first_name, last_name, suffix, email, phone_number, password, role, profile_pic, created_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`

	_, err = tx.ExecContext(ctx, query,
		user.Username,
		user.FirstName,
		user.LastName,
		user.Suffix,
		user.Email,
		user.PhoneNumber,
		hashedPassword,
		user.Role,
		profilePicPath,
	)

	if err != nil {
		// Specifically check for MySQL duplicate entry error
		if strings.Contains(err.Error(), "Duplicate entry") {
			return errors.New("username or email already exists")
		}
		return err
	}

	return tx.Commit()
}