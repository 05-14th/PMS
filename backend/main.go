package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"golang.org/x/crypto/bcrypt"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

/* ===========================
   Models
=========================== */

type User struct {
	Name     string `json:"usr_fullname"`
	Username string `json:"usr_username"`
	Role     string `json:"usr_role"`
	Status   string `json:"usr_status"`
}

type Items struct {
	ID         string `json:"ItemID"`
	SupplierID string `json:"SupplierID"`
	Name       string `json:"ItemName"`
	Category   string `json:"Category"`
	Unit       string `json:"Unit"`
}

type Batches struct {
	ID                  string  `json:"BatchNumber"`
	BatchName           string  `json:"BatchName"`
	TotalChicken        int     `json:"TotalChicken"`
	CurrentChicken      int     `json:"CurrentChicken"`
	StartDate           string  `json:"StartDate"`
	ExpectedHarvestDate string  `json:"ExpectedHarvestDate"`
	Status              string  `json:"Status"`
	Notes               string  `json:"Notes"`
	CostType            string  `json:"CostType"`
	Amount              float64 `json:"Amount"`
	Description         string  `json:"Description"`
	BirdsLost           int     `json:"BirdsLost"`
}

type Harvests struct {
	HarvestID     int     `json:"HarvestID"`
	BatchID       int     `json:"BatchNumber"`
	HarvestDate   string  `json:"HarvestDate"`
	Notes         string  `json:"Notes"`
	SaleType      string  `json:"SaleType"`
	BirdQuantity  int     `json:"BirdQuantity"`
	TotalWeightKg float64 `json:"TotalWeightKg"`
	PricePerKg    float64 `json:"PricePerKg"`
	SalesAmount   float64 `json:"SalesAmount"`
}

type Supplier struct {
	SupplierID    int     `json:"SupplierID"`
	SupplierName  string  `json:"SupplierName"`
	ContactPerson *string `json:"ContactPerson"`
	PhoneNumber   *string `json:"PhoneNumber"`
	Email         *string `json:"Email"`
	Address       *string `json:"Address"`
	Notes         *string `json:"Notes"`
}

type Sales struct {
	ID                int     `json:"sales_id"`
	Amount            float64 `json:"sales_amount"`
	Status            string  `json:"sales_status"`
	Date              string  `json:"sales_date"`
	Remarks           string  `json:"sales_remarks"`
	PurchaseNumber    string  `json:"purchase_number"`
	ProductPrice      float64 `json:"product_price"`
	ProductWeight     float64 `json:"product_weight"`
	ProductWeightUnit string  `json:"product_weight_unit"`
	ProductClass      string  `json:"product_class"`
	ProductBatch      string  `json:"product_batch"`
	ProductDays       int     `json:"product_days"`
}

type Product struct {
	ID                int     `json:"product_id"`
	ProductPrice      float64 `json:"product_price"`
	ProductWeight     float64 `json:"product_weight"`
	ProductWeightUnit string  `json:"product_weight_unit"`
}

type MoreProductInfo struct {
	ID                int     `json:"product_id"`
	ProductPrice      float64 `json:"product_price"`
	ProductWeight     float64 `json:"product_weight"`
	ProductWeightUnit string  `json:"product_weight_unit"`
	ProductClass      string  `json:"product_class"`
	ProductBatch      string  `json:"product_batch"`
	ProductDays       int     `json:"product_days"`
}

type SimpleSales struct {
	ID      int     `json:"sales_id"`
	Amount  float64 `json:"sales_amount"`
	Status  string  `json:"sales_status"`
	Date    string  `json:"sales_date"`
	Remarks string  `json:"sales_remarks"`
}

// for inventory items list
type InventoryItem struct {
	ItemID   string `json:"ItemID,omitempty"`
	ItemName string `json:"ItemName"`
	Category string `json:"Category"`
	Unit     string `json:"Unit"`
}

// for inventory stock levels

type StockLevelSummary struct {
	ItemID                 int     `json:"ItemID"`
	ItemName               string  `json:"ItemName"`
	TotalQuantityRemaining float64 `json:"TotalQuantityRemaining"`
	Unit                   string  `json:"Unit"`
}

type PurchaseHistoryDetail struct {
	PurchaseDate      string  `json:"PurchaseDate"`
	QuantityRemaining float64 `json:"QuantityRemaining"`
	QuantityPurchased float64 `json:"QuantityPurchased"`
	UnitCost          float64 `json:"UnitCost"`
	SupplierName      string  `json:"SupplierName"`
}

type PurchasePayload struct {
	ItemID            int     `json:"ItemID"`
	SupplierID        int     `json:"SupplierID"`
	PurchaseDate      string  `json:"PurchaseDate"`
	QuantityPurchased float64 `json:"QuantityPurchased"`
	UnitCost          float64 `json:"UnitCost"`
}

type NewStockItemPayload struct {
	// New Item Details
	ItemName string `json:"ItemName"`
	Unit     string `json:"Unit"`
	Category string `json:"Category"`

	// Initial Purchase Details
	PurchaseDate      string  `json:"PurchaseDate"`
	QuantityPurchased float64 `json:"QuantityPurchased"`
	AmountPaid        float64 `json:"AmountPaid"`

	// Supplier Details (one of these will be provided)
	ExistingSupplierID *int    `json:"ExistingSupplierID,omitempty"`
	NewSupplierName    *string `json:"NewSupplierName,omitempty"`
	ContactPerson      *string `json:"ContactPerson,omitempty"`
	PhoneNumber        *string `json:"PhoneNumber,omitempty"`
	Email              *string `json:"Email,omitempty"`
	Address            *string `json:"Address,omitempty"`
	Notes              *string `json:"Notes,omitempty"`
}

/* ===========================
   Models for IoT
=========================== */

type DhtData struct {
	ID          int     `json:"temp_id"`
	Temperature float64 `json:"temp_temperature"`
	Humidity    float64 `json:"temp_humidity"`
	CageNum     int     `json:"temp_cage_num"`
	CreatedAt   string  `json:"created_at"`
}

/* ===========================
   Globals
=========================== */

var db *sql.DB

/* ===========================
   Bootstrapping / DB
=========================== */

func initDB() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	dsn := mustGetEnv("DB_DSN")

	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Connection pool tuning
	db.SetMaxOpenConns(15)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(45 * time.Minute)

	if err = db.Ping(); err != nil {
		log.Fatal("Database ping failed:", err)
	}

	fmt.Println("Connected to MySQL successfully.")
}

/* ===========================
   Utilities (DRY)
=========================== */

const defaultQueryTimeout = 5 * time.Second

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, defaultQueryTimeout)
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("Missing required env var: %s", key)
	}
	return v
}

func handleError(w http.ResponseWriter, status int, clientMsg string, err error) {
	if err != nil {
		log.Printf("[ERROR] %s: %v", clientMsg, err)
	} else {
		log.Printf("[ERROR] %s", clientMsg)
	}
	http.Error(w, clientMsg, status)
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func decodeJSONBody[T any](w http.ResponseWriter, r *http.Request, dst *T) bool {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		handleError(w, http.StatusBadRequest, "Invalid JSON body", err)
		return false
	}
	return true
}

// Simple CORS middleware (open by default; restrict origins if needed)
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("Access-Control-Allow-Origin", "*")
		h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

/* ===========================
   Handlers
=========================== */

func getUsers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_USERS"))
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch users", err)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.Name, &u.Username, &u.Role, &u.Status); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan users", err)
			return
		}
		users = append(users, u)
	}
	respondJSON(w, http.StatusOK, users)
}

func getAllItems(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_ALL_ITEMS"))
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch items", err)
		return
	}
	defer rows.Close()

	var items []Items
	for rows.Next() {
		var it Items
		if err := rows.Scan(&it.ID, &it.Name, &it.Category, &it.Unit, &it.SupplierID); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan items", err)
			return
		}
		items = append(items, it)
	}
	respondJSON(w, http.StatusOK, items)
}

func getItemByType(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var payload struct {
		ItemType string `json:"item_type"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_ITEMS_BY_TYPE"), payload.ItemType)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch items by type", err)
		return
	}
	defer rows.Close()

	var items []Items
	for rows.Next() {
		var it Items
		if err := rows.Scan(&it.ID, &it.SupplierID, &it.Name, &it.Category, &it.Unit); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan items by type", err)
			return
		}
		items = append(items, it)
	}
	respondJSON(w, http.StatusOK, items)
}

func getBatches(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_BATCHES"))
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch batches", err)
		return
	}
	defer rows.Close()

	var list []Batches
	for rows.Next() {
		var b Batches
		if err := rows.Scan(&b.ID, &b.BatchName, &b.TotalChicken, &b.CurrentChicken, &b.StartDate,
			&b.ExpectedHarvestDate, &b.Status, &b.Notes, &b.CostType, &b.Amount, &b.Description, &b.BirdsLost); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan batches", err)
			return
		}
		list = append(list, b)
	}
	respondJSON(w, http.StatusOK, list)
}

func getHarvests(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_HARVEST"))
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch harvests", err)
		return
	}
	defer rows.Close()

	var list []Harvests
	for rows.Next() {
		var h Harvests
		if err := rows.Scan(&h.HarvestID, &h.BatchID, &h.HarvestDate, &h.Notes, &h.SaleType, &h.BirdQuantity,
			&h.TotalWeightKg, &h.PricePerKg, &h.SalesAmount); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan harvests", err)
			return
		}
		list = append(list, h)
	}
	respondJSON(w, http.StatusOK, list)
}

// Suppliers CRUD operations

func getSuppliers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_SUPPLIERS"))
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch suppliers", err)
		return
	}
	defer rows.Close()

	var suppliers []Supplier
	for rows.Next() {
		var s Supplier
		if err := rows.Scan(&s.SupplierID, &s.SupplierName, &s.ContactPerson, &s.PhoneNumber, &s.Email, &s.Address, &s.Notes); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan supplier", err)
			return
		}
		suppliers = append(suppliers, s)
	}
	respondJSON(w, http.StatusOK, suppliers)
}

func createSupplier(w http.ResponseWriter, r *http.Request) {
	var s Supplier
	if !decodeJSONBody(w, r, &s) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "INSERT INTO cm_suppliers (SupplierName, ContactPerson, PhoneNumber, Email, Address, Notes) VALUES (?, ?, ?, ?, ?, ?)"
	res, err := db.ExecContext(ctx, query, s.SupplierName, s.ContactPerson, s.PhoneNumber, s.Email, s.Address, s.Notes)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert supplier", err)
		return
	}
	lastID, _ := res.LastInsertId()
	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": lastID})
}

func updateSupplier(w http.ResponseWriter, r *http.Request) {
	supplierID := chi.URLParam(r, "id")
	if supplierID == "" {
		handleError(w, http.StatusBadRequest, "Missing supplier ID", nil)
		return
	}

	var s Supplier
	if !decodeJSONBody(w, r, &s) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "UPDATE cm_suppliers SET SupplierName = ?, ContactPerson = ?, PhoneNumber = ?, Email = ?, Address = ?, Notes = ? WHERE SupplierID = ?"
	_, err := db.ExecContext(ctx, query, s.SupplierName, s.ContactPerson, s.PhoneNumber, s.Email, s.Address, s.Notes, supplierID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update supplier", err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func deleteSupplier(w http.ResponseWriter, r *http.Request) {
	supplierID := chi.URLParam(r, "id")
	if supplierID == "" {
		handleError(w, http.StatusBadRequest, "Missing supplier ID", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "DELETE FROM cm_suppliers WHERE SupplierID = ?"
	res, err := db.ExecContext(ctx, query, supplierID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to delete supplier", err)
		return
	}
	if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
		handleError(w, http.StatusNotFound, "Supplier not found", nil)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func getSimpleSales(w http.ResponseWriter, r *http.Request) {
	// Placeholder query kept in code intentionally (can move to .env later)
	const query = "SELECT sales_id, sales_amount, sales_status, sales_date, sales_remarks FROM cm_sales"

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch simple sales", err)
		return
	}
	defer rows.Close()

	var list []SimpleSales
	for rows.Next() {
		var s SimpleSales
		if err := rows.Scan(&s.ID, &s.Amount, &s.Status, &s.Date, &s.Remarks); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan simple sales", err)
			return
		}
		list = append(list, s)
	}
	respondJSON(w, http.StatusOK, list)
}

func getProducts(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_PRODUCTS"))
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch products", err)
		return
	}
	defer rows.Close()

	var list []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.ProductPrice, &p.ProductWeight, &p.ProductWeightUnit); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan products", err)
			return
		}
		list = append(list, p)
	}
	respondJSON(w, http.StatusOK, list)
}

func getSales(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var payload struct {
		SalesID *int `json:"sales_id"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	if payload.SalesID == nil {
		handleError(w, http.StatusBadRequest, "sales_id is required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_SALES_BY_ID"), *payload.SalesID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch sales", err)
		return
	}
	defer rows.Close()

	var list []Sales
	for rows.Next() {
		var s Sales
		if err := rows.Scan(&s.ID, &s.Amount, &s.Status, &s.Date, &s.Remarks, &s.PurchaseNumber,
			&s.ProductPrice, &s.ProductWeight, &s.ProductWeightUnit, &s.ProductClass, &s.ProductBatch, &s.ProductDays); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan sales", err)
			return
		}
		list = append(list, s)
	}
	respondJSON(w, http.StatusOK, list)
}

func getProductById(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var payload struct {
		ProductID *int `json:"product_id"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	if payload.ProductID == nil {
		handleError(w, http.StatusBadRequest, "product_id is required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_PRODUCT_BY_ID"), *payload.ProductID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch product", err)
		return
	}
	defer rows.Close()

	var list []MoreProductInfo
	for rows.Next() {
		var p MoreProductInfo
		if err := rows.Scan(&p.ID, &p.ProductPrice, &p.ProductWeight, &p.ProductWeightUnit,
			&p.ProductClass, &p.ProductBatch, &p.ProductDays); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan product", err)
			return
		}
		list = append(list, p)
	}
	respondJSON(w, http.StatusOK, list)
}

func handleDhtData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var data struct {
		Temperature float64 `json:"temperature"`
		Humidity    float64 `json:"humidity"`
		CageNum     int     `json:"cage_num"`
	}
	if !decodeJSONBody(w, r, &data) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	stmt := `INSERT INTO cm_temperature (temp_temperature, temp_humidity, temp_cage_num) VALUES (?, ?, ?)`
	res, err := db.ExecContext(ctx, stmt, data.Temperature, data.Humidity, data.CageNum)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert temperature data", err)
		return
	}

	id, _ := res.LastInsertId()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"id":      id,
		"message": "Data received successfully",
	})
}

func getBatchVitals(w http.ResponseWriter, r *http.Request) {
	batchId := chi.URLParam(r, "id")
	if batchId == "" {
		handleError(w, http.StatusBadRequest, "batch id is required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `SELECT a.Notes AS BatchName, StartDate, CurrentChicken AS CurrentPopulation, 
	         DATEDIFF(NOW(), StartDate) AS AgeInDays, SUM(BirdsLoss)
	         FROM cm_batches a 
	         JOIN cm_mortality b ON a.BatchID = b.BatchID 
	         WHERE a.BatchID = ? LIMIT 1`

	row := db.QueryRowContext(ctx, query, batchId)
	var name, startDate string
	var currentPopulation, ageDays, mortalityTotal int
	if err := row.Scan(&name, &startDate, &currentPopulation, &ageDays, &mortalityTotal); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			handleError(w, http.StatusNotFound, "Batch not found", err)
			return
		}
		handleError(w, http.StatusInternalServerError, "Failed to scan batch vitals", err)
		return
	}

	resp := map[string]interface{}{
		"id":                batchId,
		"name":              name,
		"startDate":         startDate,
		"currentPopulation": currentPopulation,
		"ageDays":           ageDays,
		"mortalityTotal":    mortalityTotal,
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"data": resp})
}

func getBatchCosts(w http.ResponseWriter, r *http.Request) {
	batchId := chi.URLParam(r, "id")
	if batchId == "" {
		handleError(w, http.StatusBadRequest, "batch id is required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `SELECT Date, CostType, Description, Amount 
	          FROM cm_production_cost 
	          WHERE BatchID = ? ORDER BY Date DESC`

	rows, err := db.QueryContext(ctx, query, batchId)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch batch costs", err)
		return
	}
	defer rows.Close()

	var costs []map[string]interface{}
	for rows.Next() {
		var date, costType, description string
		var amount float64
		if err := rows.Scan(&date, &costType, &description, &amount); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan batch costs", err)
			return
		}
		costs = append(costs, map[string]interface{}{
			"id":          date + costType + description,
			"date":        date,
			"type":        costType,
			"description": description,
			"amount":      amount,
		})
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"data": costs})
}

func getBatchEvents(w http.ResponseWriter, r *http.Request) {
	batchId := chi.URLParam(r, "id")
	if batchId == "" {
		handleError(w, http.StatusBadRequest, "batch id is required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, mustGetEnv("GET_EVENTS"), batchId, batchId)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch batch events", err)
		return
	}
	defer rows.Close()

	var events []map[string]interface{}
	for rows.Next() {
		var date, event, details, qtyCount string
		if err := rows.Scan(&date, &event, &details, &qtyCount); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan batch events", err)
			return
		}
		events = append(events, map[string]interface{}{
			"id":      date + event + details + qtyCount,
			"date":    date,
			"event":   event,
			"details": details,
			"qty":     qtyCount,
		})
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"data": events})
}

func updateBatchEvent(w http.ResponseWriter, r *http.Request) {
	batchId := chi.URLParam(r, "id")
	if batchId == "" {
		handleError(w, http.StatusBadRequest, "batch id is required", nil)
		return
	}

	var payload struct {
		Date    string  `json:"Date"`
		Details string  `json:"Details"`
		Qty     float32 `json:"Qty"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	// Try update cm_inventory_usage
	var usageID int
	usageQuery := `SELECT UsageID FROM cm_inventory_usage WHERE BatchID = ? AND Date = ? LIMIT 1`
	if err := db.QueryRowContext(ctx, usageQuery, batchId, payload.Date).Scan(&usageID); err == nil {
		updateQuery := `UPDATE cm_inventory_usage SET QuantityUsed = ? WHERE UsageID = ? AND BatchID = ?`
		res, err := db.ExecContext(ctx, updateQuery, payload.Qty, usageID, batchId)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to update inventory usage", err)
			return
		}
		rowsAffected, _ := res.RowsAffected()
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "rowsAffected": rowsAffected})
		return
	}

	// Try update cm_mortality
	var mortalityID int
	mortalityQuery := `SELECT MortalityID FROM cm_mortality WHERE BatchID = ? AND Date = ? LIMIT 1`
	if err := db.QueryRowContext(ctx, mortalityQuery, batchId, payload.Date).Scan(&mortalityID); err == nil {
		updateMortality := `UPDATE cm_mortality SET BirdsLoss = ?, Notes = ? WHERE MortalityID = ? AND BatchID = ?`
		res, err := db.ExecContext(ctx, updateMortality, payload.Qty, payload.Details, mortalityID, batchId)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to update mortality", err)
			return
		}
		rowsAffected, _ := res.RowsAffected()
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "rowsAffected": rowsAffected})
		return
	}

	handleError(w, http.StatusNotFound, "Event not found for update", nil)
}

func insertBatchEvent(w http.ResponseWriter, r *http.Request) {
	batchId := chi.URLParam(r, "id")
	if batchId == "" {
		handleError(w, http.StatusBadRequest, "batch id is required", nil)
		return
	}

	var payload struct {
		Date    string  `json:"Date"`
		Event   string  `json:"Event"`
		Details string  `json:"Details"`
		Qty     float32 `json:"Qty"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	switch payload.Event {
	case "Consumption", "Medication":
		if payload.Details == "" {
			handleError(w, http.StatusBadRequest, "Details (item name) is required", nil)
			return
		}
		if payload.Date == "" {
			handleError(w, http.StatusBadRequest, "Date is required", nil)
			return
		}
		if payload.Qty <= 0 {
			handleError(w, http.StatusBadRequest, "Qty must be greater than 0", nil)
			return
		}

		var category string
		if payload.Event == "Consumption" {
			category = "Feed"
		} else {
			category = "Medicine"
		}

		var itemID int
		itemQuery := `SELECT ItemID FROM cm_items WHERE ItemName = ? AND Category = ? LIMIT 1`
		if err := db.QueryRowContext(ctx, itemQuery, payload.Details, category).Scan(&itemID); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				handleError(w, http.StatusBadRequest, "Item not found for usage", err)
				return
			}
			handleError(w, http.StatusInternalServerError, "Database error while fetching item", err)
			return
		}

		sqlInsert := mustGetEnv("INSERT_ITEM_USAGE")
		res, err := db.ExecContext(ctx, sqlInsert, batchId, itemID, payload.Date, payload.Qty)
		if err != nil {
			log.Printf("Exec failed for INSERT_ITEM_USAGE: %q err=%v", sqlInsert, err)
			handleError(w, http.StatusInternalServerError, "Database insert failed", err)
			return
		}
		lastID, _ := res.LastInsertId()
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "insertedId": lastID})
		return

	case "Mortality":
		if payload.Date == "" {
			handleError(w, http.StatusBadRequest, "Date is required", nil)
			return
		}
		insertQuery := `INSERT INTO cm_mortality (BatchID, Date, BirdsLoss, Notes) VALUES (?, ?, ?, ?)`
		res, err := db.ExecContext(ctx, insertQuery, batchId, payload.Date, payload.Qty, payload.Details)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to insert mortality", err)
			return
		}
		lastID, _ := res.LastInsertId()
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "insertedId": lastID})
		return
	default:
		handleError(w, http.StatusBadRequest, "Unknown event type", nil)
		return
	}
}

func deleteBatchEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	batchId := chi.URLParam(r, "id")
	if batchId == "" {
		handleError(w, http.StatusBadRequest, "batch id is required", nil)
		return
	}

	var payload struct {
		ID   string `json:"id"`
		DATE string `json:"date"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}
	if payload.DATE == "" {
		handleError(w, http.StatusBadRequest, "date is required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	usageDel := `DELETE FROM cm_inventory_usage WHERE BatchID = ? AND Date = ?`
	res, err := db.ExecContext(ctx, usageDel, batchId, payload.DATE)
	if err == nil {
		if rowsAffected, _ := res.RowsAffected(); rowsAffected > 0 {
			respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "rowsAffected": rowsAffected})
			return
		}
	}

	mortDel := `DELETE FROM cm_mortality WHERE BatchID = ? AND Date = ?`
	res2, err2 := db.ExecContext(ctx, mortDel, batchId, payload.DATE)
	if err2 == nil {
		if rowsAffected, _ := res2.RowsAffected(); rowsAffected > 0 {
			respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "rowsAffected": rowsAffected})
			return
		}
	}

	handleError(w, http.StatusNotFound, "Event not found for delete", nil)
}

// POST /addItem
func addItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var payload struct {
		ItemName string `json:"ItemName"`
		Category string `json:"Category"`
		Unit     string `json:"Unit"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}
	if payload.ItemName == "" || payload.Category == "" || payload.Unit == "" {
		handleError(w, http.StatusBadRequest, "ItemName, Category and Unit are required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `INSERT INTO cm_items (ItemName, Category, Unit) VALUES (?, ?, ?)`
	res, err := db.ExecContext(ctx, query, payload.ItemName, payload.Category, payload.Unit)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert item", err)
		return
	}
	lastID, _ := res.LastInsertId()
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "insertedId": lastID})
}

// DELETE /deleteItem/{id}
func deleteItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}
	itemID := chi.URLParam(r, "id")
	if itemID == "" {
		handleError(w, http.StatusBadRequest, "Missing item ID", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `DELETE FROM cm_items WHERE ItemID = ?`
	res, err := db.ExecContext(ctx, query, itemID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to delete item", err)
		return
	}
	if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
		handleError(w, http.StatusNotFound, "Item not found", nil)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "deletedId": itemID})
}

// for cm_items adding new category
func getCategories(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_items' AND COLUMN_NAME = 'Category'
	`
	var enumStr string
	if err := db.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query category types", err)
		return
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	categories := strings.Split(cleanedStr, ",")

	respondJSON(w, http.StatusOK, categories)
}

// for cm_items adding new unit
func getUnits(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_items' AND COLUMN_NAME = 'Unit'
	`
	var enumStr string
	if err := db.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query unit types", err)
		return
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	units := strings.Split(cleanedStr, ",")

	respondJSON(w, http.StatusOK, units)
}

// POST /api/login
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var payload struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}
	if payload.Email == "" || payload.Password == "" {
		handleError(w, http.StatusBadRequest, "Email and password are required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	var dbPassword, role string
	query := `SELECT password, role FROM cm_users WHERE email = ? LIMIT 1`
	err := db.QueryRowContext(ctx, query, payload.Email).Scan(&dbPassword, &role)
	if errors.Is(err, sql.ErrNoRows) {
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": false, "error": "User not found"})
		return
	}
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch user", err)
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(dbPassword), []byte(payload.Password)) == nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "role": role})
	} else {
		respondJSON(w, http.StatusOK, map[string]interface{}{"success": false, "error": "Invalid password"})
	}
}

//For inventory items

// getInventoryItems handles GET /items
func getInventoryItems(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, "SELECT ItemID, ItemName, Category, Unit FROM cm_items ORDER BY ItemName")
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch inventory items", err)
		return
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var item InventoryItem
		if err := rows.Scan(&item.ItemID, &item.ItemName, &item.Category, &item.Unit); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan inventory item", err)
			return
		}
		items = append(items, item)
	}
	respondJSON(w, http.StatusOK, items)
}

// createInventoryItem handles POST /items
func createInventoryItem(w http.ResponseWriter, r *http.Request) {
	var item InventoryItem
	if !decodeJSONBody(w, r, &item) {
		return // Error is handled by decodeJSONBody
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()
	query := "INSERT INTO cm_items (ItemName, Category, Unit) VALUES (?, ?, ?)"
	res, err := db.ExecContext(ctx, query, item.ItemName, item.Category, item.Unit)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert item", err)
		return
	}
	lastID, _ := res.LastInsertId()
	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": lastID})
}

// updateInventoryItem handles PUT /items/{id}
func updateInventoryItem(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	if itemID == "" {
		handleError(w, http.StatusBadRequest, "Missing item ID", nil)
		return
	}

	var item InventoryItem
	if !decodeJSONBody(w, r, &item) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "UPDATE cm_items SET ItemName = ?, Category = ?, Unit = ? WHERE ItemID = ?"
	_, err := db.ExecContext(ctx, query, item.ItemName, item.Category, item.Unit, itemID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update item", err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// deleteInventoryItem handles DELETE /items/{id}
func deleteInventoryItem(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	if itemID == "" {
		handleError(w, http.StatusBadRequest, "Missing item ID", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "DELETE FROM cm_items WHERE ItemID = ?"
	res, err := db.ExecContext(ctx, query, itemID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to delete item", err)
		return
	}
	if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
		handleError(w, http.StatusNotFound, "Item not found", nil)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func getStockLevels(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT
			i.ItemID,
			i.ItemName,
			COALESCE(SUM(p.QuantityRemaining), 0) as TotalQuantityRemaining,
			i.Unit
		FROM cm_items i
		LEFT JOIN cm_inventory_purchases p ON i.ItemID = p.ItemID
		GROUP BY i.ItemID, i.ItemName, i.Unit
		ORDER BY i.ItemName;`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch stock levels", err)
		return
	}
	defer rows.Close()

	var summaries []StockLevelSummary
	for rows.Next() {
		var s StockLevelSummary
		if err := rows.Scan(&s.ItemID, &s.ItemName, &s.TotalQuantityRemaining, &s.Unit); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan stock level", err)
			return
		}
		summaries = append(summaries, s)
	}
	respondJSON(w, http.StatusOK, summaries)
}

// getPurchaseHistory handles GET /api/purchase-history/{id} (for the right panel)
func getPurchaseHistory(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	if itemID == "" {
		handleError(w, http.StatusBadRequest, "Missing item ID", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT
			p.PurchaseDate,
			p.QuantityPurchased, 
			p.QuantityRemaining,
			p.UnitCost,
			s.SupplierName
		FROM cm_inventory_purchases p
		JOIN cm_suppliers s ON p.SupplierID = s.SupplierID
		WHERE p.ItemID = ? AND p.QuantityRemaining >= 0 
		ORDER BY p.PurchaseDate DESC;`

	rows, err := db.QueryContext(ctx, query, itemID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch purchase history", err)
		return
	}
	defer rows.Close()

	var details []PurchaseHistoryDetail
	for rows.Next() {
		var d PurchaseHistoryDetail

		if err := rows.Scan(&d.PurchaseDate, &d.QuantityPurchased, &d.QuantityRemaining, &d.UnitCost, &d.SupplierName); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan purchase history", err)
			return
		}
		details = append(details, d)
	}
	respondJSON(w, http.StatusOK, details)
}

func createPurchase(w http.ResponseWriter, r *http.Request) {
	var p PurchasePayload
	if !decodeJSONBody(w, r, &p) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	// When creating a new purchase, QuantityRemaining is the same as QuantityPurchased.
	query := `
		INSERT INTO cm_inventory_purchases 
		(ItemID, SupplierID, PurchaseDate, QuantityPurchased, UnitCost, QuantityRemaining) 
		VALUES (?, ?, ?, ?, ?, ?)`

	res, err := db.ExecContext(ctx, query, p.ItemID, p.SupplierID, p.PurchaseDate, p.QuantityPurchased, p.UnitCost, p.QuantityPurchased)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert purchase", err)
		return
	}

	lastID, _ := res.LastInsertId()
	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": lastID})
}

func createStockItem(w http.ResponseWriter, r *http.Request) {
	var payload NewStockItemPayload
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to start transaction", err)
		return
	}
	defer tx.Rollback()

	var supplierID int64
	if payload.ExistingSupplierID != nil {
		supplierID = int64(*payload.ExistingSupplierID)
	} else if payload.NewSupplierName != nil {

		supplierQuery := "INSERT INTO cm_suppliers (SupplierName, ContactPerson, PhoneNumber, Email, Address, Notes) VALUES (?, ?, ?, ?, ?, ?)"
		res, err := tx.ExecContext(ctx, supplierQuery, payload.NewSupplierName, payload.ContactPerson, payload.PhoneNumber, payload.Email, payload.Address, payload.Notes)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to insert new supplier", err)
			return
		}
		supplierID, _ = res.LastInsertId()
	} else {
		handleError(w, http.StatusBadRequest, "Supplier information is required", nil)
		return
	}

	itemQuery := "INSERT INTO cm_items (ItemName, Category, Unit) VALUES (?, ?, ?)"
	res, err := tx.ExecContext(ctx, itemQuery, payload.ItemName, payload.Category, payload.Unit)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert new item", err)
		return
	}
	itemID, _ := res.LastInsertId()

	purchaseQuery := "INSERT INTO cm_inventory_purchases (ItemID, SupplierID, PurchaseDate, QuantityPurchased, UnitCost, QuantityRemaining) VALUES (?, ?, ?, ?, ?, ?)"
	_, err = tx.ExecContext(ctx, purchaseQuery, itemID, supplierID, payload.PurchaseDate, payload.QuantityPurchased, payload.AmountPaid, payload.QuantityPurchased)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert initial purchase", err)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedItemId": itemID})
}

/* ===========================
   Router / Server
=========================== */

func buildRouter() http.Handler {
	r := chi.NewRouter()

	// Basic middlewares
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second)) // total handler timeout (in addition to per-query timeouts)
	r.Use(cors)

	// Routes
	r.Get("/getUsers", getUsers)
	//r.Get("/getAllItems", getAllItems)
	r.Post("/getItemByType", getItemByType)

	r.Get("/getBatches", getBatches)
	r.Get("/getHarvests", getHarvests)
	//r.Get("/getSupplier", getSupplier)

	r.Post("/getSales", getSales)
	r.Get("/getSimpleSales", getSimpleSales) // placeholder kept in-code intentionally
	r.Get("/getProducts", getProducts)
	r.Post("/getProductInfo", getProductById)

	r.Post("/api/dht22-data", handleDhtData)
	//r.Post("/addItem", addItem)
	//r.Delete("/deleteItem/{id}", deleteItem)
	r.Post("/api/login", loginHandler)

	// /batches/{id}/...
	r.Route("/batches/{id}", func(r chi.Router) {
		r.Get("/vitals", getBatchVitals)
		r.Get("/costs", getBatchCosts)
		r.Get("/events", getBatchEvents)
		r.Post("/events", insertBatchEvent)
		r.Put("/events", updateBatchEvent)
		r.Delete("/events", deleteBatchEvent)
	})

	// Inventory items routes
	r.Route("/api", func(r chi.Router) {
		//for cm_items adding new category and unit
		r.Get("/categories", getCategories)
		r.Get("/units", getUnits)
		// Inventory Items routes
		r.Route("/items", func(r chi.Router) {
			r.Get("/", getInventoryItems)          // Handles GET /api/items
			r.Post("/", createInventoryItem)       // Handles POST /api/items
			r.Put("/{id}", updateInventoryItem)    // Handles PUT /api/items/{id}
			r.Delete("/{id}", deleteInventoryItem) // Handles DELETE /api/items/{id}
		})
		// Suppliers routes
		r.Route("/suppliers", func(r chi.Router) {
			r.Get("/", getSuppliers)
			r.Post("/", createSupplier)
			r.Put("/{id}", updateSupplier)
			r.Delete("/{id}", deleteSupplier)
		})
		// Stock Levels routes
		r.Get("/stock-levels", getStockLevels)
		r.Get("/purchase-history/{id}", getPurchaseHistory)
		r.Post("/purchases", createPurchase)
		r.Post("/stock-items", createStockItem)

	})

	return r
}

func main() {
	initDB()

	server := &http.Server{
		Addr:         "0.0.0.0:8080",
		Handler:      buildRouter(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Context that cancels on Ctrl+C or SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Run server
	go func() {
		fmt.Println("Server running at http://0.0.0.0:8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe error: %v", err)
		}
	}()

	// Example background ticker (kept from your original)
	go func(ctx context.Context) {
		t := time.NewTicker(5 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case tm := <-t.C:
				fmt.Println("tick at", tm.Format(time.RFC3339))
			}
		}
	}(ctx)

	// Block until signal
	<-ctx.Done()
	fmt.Println("Shutting down...")

	// Graceful shutdown
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Shutdown error: %v", err)
	}
	fmt.Println("Shutdown complete.")
}
