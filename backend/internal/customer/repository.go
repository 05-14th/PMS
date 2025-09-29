// File: backend/internal/customer/repository.go
package customer

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

func (r *Repository) GetCustomers(ctx context.Context) ([]models.Customer, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT CustomerID, Name, BusinessName, ContactNumber, Email, Address, DateAdded FROM cm_customers WHERE IsActive = 1 ORDER BY Name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var customers []models.Customer
	for rows.Next() {
		var c models.Customer
		if err := rows.Scan(&c.CustomerID, &c.Name, &c.BusinessName, &c.ContactNumber, &c.Email, &c.Address, &c.DateAdded); err != nil {
			return nil, err
		}
		customers = append(customers, c)
	}
	return customers, nil
}