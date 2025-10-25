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

func (r *Repository) CreateSupplier(ctx context.Context, s models.Supplier) (int64, error) {
	query := "INSERT INTO cm_suppliers (SupplierName, ContactPerson, PhoneNumber, Email, Address, Notes) VALUES (?, ?, ?, ?, ?, ?)"
	res, err := r.db.ExecContext(ctx, query, s.SupplierName, s.ContactPerson, s.PhoneNumber, s.Email, s.Address, s.Notes)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateSupplier(ctx context.Context, s models.Supplier, supplierID int) error {
	query := "UPDATE cm_suppliers SET SupplierName = ?, ContactPerson = ?, PhoneNumber = ?, Email = ?, Address = ?, Notes = ? WHERE SupplierID = ?"
	_, err := r.db.ExecContext(ctx, query, s.SupplierName, s.ContactPerson, s.PhoneNumber, s.Email, s.Address, s.Notes, supplierID)
	return err
}

// DeleteSupplier performs a soft delete by setting IsActive to 0.
func (r *Repository) DeleteSupplier(ctx context.Context, supplierID int) error {
	query := "UPDATE cm_suppliers SET IsActive = 0 WHERE SupplierID = ?"
	_, err := r.db.ExecContext(ctx, query, supplierID)
	return err
}

func (r *Repository) HasPurchaseRecords(ctx context.Context, supplierID int) (bool, error) {
	var count int
	query := "SELECT COUNT(*) FROM cm_inventory_purchases WHERE SupplierID = ?"
	err := r.db.QueryRowContext(ctx, query, supplierID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}