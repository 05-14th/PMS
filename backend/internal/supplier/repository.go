// File: backend/internal/supplier/repository.go
package supplier

import (
	"chickmate-api/internal/models"
	"context"
	"database/sql"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetSuppliers(ctx context.Context) ([]models.Supplier, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT SupplierID, SupplierName, ContactPerson, PhoneNumber, Email, Address, Notes FROM cm_suppliers WHERE IsActive = 1")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var suppliers []models.Supplier
	for rows.Next() {
		var s models.Supplier
		if err := rows.Scan(&s.SupplierID, &s.SupplierName, &s.ContactPerson, &s.PhoneNumber, &s.Email, &s.Address, &s.Notes); err != nil {
			return nil, err
		}
		suppliers = append(suppliers, s)
	}
	return suppliers, nil
}

// Add other functions here like CreateSupplier, UpdateSupplier, etc.