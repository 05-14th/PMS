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


func (r *Repository) CreateCustomer(ctx context.Context, c models.Customer) (int64, error) {
	query := "INSERT INTO cm_customers (Name, BusinessName, ContactNumber, Email, Address) VALUES (?, ?, ?, ?, ?)"
	res, err := r.db.ExecContext(ctx, query, c.Name, c.BusinessName, c.ContactNumber, c.Email, c.Address)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *Repository) UpdateCustomer(ctx context.Context, c models.Customer, customerID int) error {
	query := "UPDATE cm_customers SET Name = ?, BusinessName = ?, ContactNumber = ?, Email = ?, Address = ? WHERE CustomerID = ?"
	_, err := r.db.ExecContext(ctx, query, c.Name, c.BusinessName, c.ContactNumber, c.Email, c.Address, customerID)
	return err
}

func (r *Repository) DeleteCustomer(ctx context.Context, customerID int) error {
	query := "UPDATE cm_customers SET IsActive = 0 WHERE CustomerID = ?"
	_, err := r.db.ExecContext(ctx, query, customerID)
	return err
}

func (r *Repository) HasSalesRecords(ctx context.Context, customerID int) (bool, error) {
	var count int
	query := "SELECT COUNT(*) FROM cm_sales_orders WHERE CustomerID = ?"
	err := r.db.QueryRowContext(ctx, query, customerID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}