package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
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
	ItemID                 int     `json:"ItemID,omitempty"`
	ItemName               string  `json:"ItemName"`
	Category               string  `json:"Category"`
	Unit                   string  `json:"Unit"`
	TotalQuantityRemaining float64 `json:"TotalQuantityRemaining"`
}

// for inventory stock levels

type StockLevelSummary struct {
	ItemID                 int     `json:"ItemID"`
	ItemName               string  `json:"ItemName"`
	TotalQuantityRemaining float64 `json:"TotalQuantityRemaining"`
	Unit                   string  `json:"Unit"`
	IsActive               bool    `json:"IsActive"`
	Category               string  `json:"Category"`
}

// for harvested inventory items
type HarvestedInventoryItem struct {
	HarvestProductID  int     `json:"HarvestProductID"`
	HarvestDate       string  `json:"HarvestDate"`
	ProductType       string  `json:"ProductType"`
	BatchOrigin       string  `json:"BatchOrigin"`
	QuantityHarvested int     `json:"QuantityHarvested"`
	WeightHarvestedKg float64 `json:"WeightHarvestedKg"`
	QuantityRemaining int     `json:"QuantityRemaining"`
	WeightRemainingKg float64 `json:"WeightRemainingKg"`
}

type PurchaseHistoryDetail struct {
	PurchaseID        int     `json:"PurchaseID"`
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

//for sales tab customer info

type Customer struct {
	CustomerID    int    `json:"CustomerID"`
	Name          string `json:"Name"`
	BusinessName  string `json:"BusinessName"`
	ContactNumber string `json:"ContactNumber"`
	Email         string `json:"Email"`
	Address       string `json:"Address"`
	DateAdded     string `json:"DateAdded"`
	IsActive      bool   `json:"IsActive"`
}

// for history log in sales tab

type SaleHistoryRecord struct {
	SaleID       int     `json:"SaleID"`
	SaleDate     string  `json:"SaleDate"`
	CustomerName string  `json:"CustomerName"`
	TotalAmount  float64 `json:"TotalAmount"`
}

// for details of a single sale record
type SaleDetailItem struct {
	SaleDetailID  int     `json:"SaleDetailID"`
	ItemName      string  `json:"ItemName"`
	QuantitySold  float64 `json:"QuantitySold"`
	TotalWeightKg float64 `json:"TotalWeightKg"`
	PricePerKg    float64 `json:"PricePerKg"`
}

// for creating new sales
type SaleProduct struct {
	HarvestProductID  int     `json:"HarvestProductID"`
	ProductType       string  `json:"ProductType"`
	QuantityRemaining float64 `json:"QuantityRemaining"`
	WeightRemainingKg float64 `json:"WeightRemainingKg"`
}

// for a single item within a new sale payload
type SaleDetailItemPayload struct {
	HarvestProductID int     `json:"HarvestProductID"`
	QuantitySold     float64 `json:"QuantitySold"`
	TotalWeightKg    float64 `json:"TotalWeightKg"`
	PricePerKg       float64 `json:"PricePerKg"`
}

// for entire payload for creating a new sale
type SalePayload struct {
	CustomerID    int                     `json:"CustomerID"`
	SaleDate      string                  `json:"SaleDate"`
	PaymentMethod string                  `json:"PaymentMethod"`
	Notes         string                  `json:"Notes"`
	Items         []SaleDetailItemPayload `json:"items"`
}

//for inventory usage log (Batch Monitoring)

type InventoryUsagePayload struct {
	BatchID      int     `json:"BatchID"`
	ItemID       int     `json:"ItemID"`
	QuantityUsed float64 `json:"QuantityUsed"`
	Date         string  `json:"Date"`
}

// for batch details table
type Batch struct {
	BatchID             int            `json:"batchID"`
	BatchName           string         `json:"batchName"`
	StartDate           string         `json:"startDate"`
	ExpectedHarvestDate string         `json:"expectedHarvestDate"`
	TotalChicken        int            `json:"totalChicken"`
	CurrentChicken      int            `json:"currentChicken"`
	Status              string         `json:"status"`
	Notes               sql.NullString `json:"notes"`
}

type BatchVitals struct {
	BatchName         string  `json:"batchName"`
	StartDate         string  `json:"startDate"`
	EndDate           *string `json:"endDate"`
	AgeInDays         int     `json:"ageInDays"`
	CurrentPopulation int     `json:"currentPopulation"`
	TotalMortality    int     `json:"totalMortality"`
}

// for adding new batch
type NewBatchPayload struct {
	BatchName           string  `json:"BatchName"`
	StartDate           string  `json:"StartDate"`
	ExpectedHarvestDate string  `json:"ExpectedHarvestDate"`
	TotalChicken        int     `json:"TotalChicken"`
	Notes               string  `json:"Notes"`
	ChickCost           float64 `json:"ChickCost"`
}

// for adding mortality event
type MortalityPayload struct {
	BatchID   int    `json:"BatchID"`
	Date      string `json:"Date"`
	BirdsLoss int    `json:"BirdsLoss"`
	Notes     string `json:"Notes"`
}

// for health check event (for future reference when farm is large enough to have veterinary)
type HealthCheckPayload struct {
	BatchID      int    `json:"BatchID"`
	CheckDate    string `json:"CheckDate"`
	Observations string `json:"Observations"`
	CheckedBy    string `json:"CheckedBy"`
}

// for direct cost entry
type DirectCostPayload struct {
	BatchID     int     `json:"BatchID"`
	Date        string  `json:"Date"`
	CostType    string  `json:"CostType"`
	Description string  `json:"Description"`
	Amount      float64 `json:"Amount"`
}

// For the list of harvested products in the Harvesting tab
type HarvestedProduct struct {
	HarvestProductID  int     `json:"HarvestProductID"`
	HarvestDate       string  `json:"HarvestDate"`
	ProductType       string  `json:"ProductType"`
	QuantityHarvested int     `json:"QuantityHarvested"`
	QuantityRemaining int     `json:"QuantityRemaining"`
	WeightHarvestedKg float64 `json:"WeightHarvestedKg"`
	WeightRemainingKg float64 `json:"WeightRemainingKg"`
}

// For the optional sale details within the harvest payload
type InstantSaleDetails struct {
	CustomerID    int     `json:"CustomerID"`
	PricePerKg    float64 `json:"PricePerKg"`
	PaymentMethod string  `json:"PaymentMethod"`
}

// For the main harvest payload from the frontend
type HarvestPayload struct {
	BatchID           int     `json:"BatchID"`
	HarvestDate       string  `json:"HarvestDate"`
	ProductType       string  `json:"ProductType"`
	QuantityHarvested int     `json:"QuantityHarvested"`
	TotalWeightKg     float64 `json:"TotalWeightKg"`
	// This is a pointer, which allows the field to be null if no sale is made
	SaleDetails *InstantSaleDetails `json:"SaleDetails"`
}

// for updating or editing a harvested product
type HarvestProductUpdatePayload struct {
	HarvestDate       string  `json:"HarvestDate"`
	ProductType       string  `json:"ProductType"`
	QuantityHarvested int     `json:"QuantityHarvested"`
	TotalWeightKg     float64 `json:"TotalWeightKg"`
}

// for logging byproducts from processing
type ByproductPayload struct {
	SourceHarvestProductID int     `json:"SourceHarvestProductID"`
	QuantityToProcess      int     `json:"QuantityToProcess"`
	ByproductType          string  `json:"ByproductType"`
	ByproductWeightKg      float64 `json:"ByproductWeightKg"`
	BatchID                int     `json:"BatchID"`
	HarvestDate            string  `json:"HarvestDate"`
}

type YieldedByproduct struct {
	ByproductType     string  `json:"ByproductType"`
	ByproductWeightKg float64 `json:"ByproductWeightKg"`
}

type ProcessPayload struct {
	SourceHarvestProductID int                `json:"SourceHarvestProductID"`
	QuantityToProcess      int                `json:"QuantityToProcess"`
	BatchID                int                `json:"BatchID"`
	ProcessingDate         string             `json:"ProcessingDate"`
	Yields                 []YieldedByproduct `json:"Yields"`
}

type UpdateBatchPayload struct {
	BatchName           string `json:"BatchName"`
	ExpectedHarvestDate string `json:"ExpectedHarvestDate"`
	Notes               string `json:"Notes"`
	Status              string `json:"Status"`
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
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	errResp := map[string]interface{}{
		"success": false,
		"error":   clientMsg,
	}
	if err != nil {
		errResp["details"] = err.Error()
	}
	_ = json.NewEncoder(w).Encode(errResp)
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
	supplierID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "UPDATE cm_suppliers SET IsActive = 0 WHERE SupplierID = ?"
	res, err := db.ExecContext(ctx, query, supplierID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to deactivate supplier", err)
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

func getBatchCosts(w http.ResponseWriter, r *http.Request) {
	batchId := chi.URLParam(r, "id")
	if batchId == "" {
		handleError(w, http.StatusBadRequest, "batch id is required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `SELECT CostID, Date, CostType, Description, Amount 
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
		var costID int
		var date, costType, description string
		var amount float64
		if err := rows.Scan(&costID, &date, &costType, &description, &amount); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan batch costs", err)
			return
		}
		costs = append(costs, map[string]interface{}{
			"id":          costID,
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

	query := `
		SELECT 
			UsageID AS EventID, 
			'consumption' AS EventType, 
			iu.Date AS EventDate,
			i.ItemName AS Details, 
			CONCAT(iu.QuantityUsed, ' ', i.Unit) AS QtyCount
		FROM cm_inventory_usage iu
		JOIN cm_items i ON iu.ItemID = i.ItemID
		WHERE iu.BatchID = ?
		
		UNION ALL
		
		SELECT 
			MortalityID AS EventID, 
			'mortality' AS EventType, 
			m.Date AS EventDate, 
			m.Notes AS Details, 
			m.BirdsLoss AS QtyCount
		FROM cm_mortality m
		WHERE m.BatchID = ?
		
		ORDER BY EventDate DESC;
	`

	rows, err := db.QueryContext(ctx, query, batchId, batchId)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch batch events", err)
		return
	}
	defer rows.Close()

	var events []map[string]interface{}
	for rows.Next() {
		var eventID int
		var eventType, eventDate, details, qtyCount string

		if err := rows.Scan(&eventID, &eventType, &eventDate, &details, &qtyCount); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan batch events", err)
			return
		}

		// Convert date to just YYYY-MM-DD format
		parsedDate, err := time.Parse(time.RFC3339, eventDate)
		if err != nil {
			parsedDate, _ = time.Parse("2006-01-02 15:04:05", eventDate)
		}

		events = append(events, map[string]interface{}{
			"id":      eventID,
			"type":    eventType,
			"date":    parsedDate.Format("2006-01-02"),
			"event":   strings.Title(eventType), // "consumption" -> "Consumption"
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
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}
	if payload.Username == "" || payload.Password == "" {
		handleError(w, http.StatusBadRequest, "Username and password are required", nil)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	var dbPassword, role string
	query := `SELECT password, role FROM cm_users WHERE username = ? LIMIT 1`
	err := db.QueryRowContext(ctx, query, payload.Username).Scan(&dbPassword, &role)
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

// POST /api/register
func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleError(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	// Parse multipart form data
	err := r.ParseMultipartForm(10 << 20) // 10 MB max memory
	if err != nil {
		handleError(w, http.StatusBadRequest, "Failed to parse form data", err)
		return
	}

	// Get form values
	username := r.FormValue("username")
	firstName := r.FormValue("firstName")
	lastName := r.FormValue("lastName")
	suffix := r.FormValue("suffix")
	email := r.FormValue("email")
	phoneNumber := r.FormValue("phoneNumber")
	password := r.FormValue("password")
	role := r.FormValue("role")

	// Validate required fields
	if username == "" || firstName == "" || lastName == "" || email == "" || phoneNumber == "" || password == "" || role == "" {
		handleError(w, http.StatusBadRequest, "All fields are required", nil)
		return
	}

	// Validate role
	validRoles := map[string]bool{"admin": true, "user": true}
	if !validRoles[role] {
		handleError(w, http.StatusBadRequest, "Invalid role. Role must be either 'admin' or 'user'.", nil)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to hash password", err)
		return
	}

	// Handle profile picture
	var profilePicPath string
	file, header, err := r.FormFile("profilePic")
	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		if err := os.MkdirAll("uploads/profile_pics", 0755); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to create upload directory", err)
			return
		}

		// Generate unique filename
		ext := filepath.Ext(header.Filename)
		profilePicPath = filepath.Join("uploads/profile_pics", fmt.Sprintf("%d%s", time.Now().UnixNano(), ext))

		// Save file
		out, err := os.Create(profilePicPath)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to save profile picture", err)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to save profile picture", err)
			return
		}
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	// Start transaction
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to start transaction", err)
		return
	}
	defer tx.Rollback()

	// Insert user
	query := `INSERT INTO cm_users (username, first_name, last_name, suffix, email, phone_number, password, role, profile_pic, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`

	_, err = tx.ExecContext(ctx, query,
		username,
		firstName,
		lastName,
		suffix,
		email,
		phoneNumber,
		hashedPassword,
		role,
		profilePicPath,
	)

	if err != nil {
		log.Printf("Database error: %v", err) // Log the exact database error
		if strings.Contains(err.Error(), "Duplicate entry") {
			handleError(w, http.StatusBadRequest, "Username or email already exists", nil)
		} else {
			handleError(w, http.StatusInternalServerError, "Failed to create user: "+err.Error(), err)
		}
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to complete registration", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "message": "User registered successfully"})
}

// for inventory items

func getInventoryItems(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	// --- NEW: Logic to handle optional category filter ---
	category := r.URL.Query().Get("category")

	// Base query
	query := `
		SELECT
			i.ItemID,
			i.ItemName,
			i.Category,
			i.Unit,
			COALESCE(SUM(p.QuantityRemaining), 0) as TotalQuantityRemaining
		FROM cm_items i
		LEFT JOIN cm_inventory_purchases p ON i.ItemID = p.ItemID AND p.IsActive = 1
		WHERE i.IsActive = 1`

	var args []interface{}

	// If a category is provided in the URL (e.g., /api/items?category=Feed), add it to the query
	if category != "" {
		query += " AND i.Category = ?"
		args = append(args, category)
	}

	query += `
		GROUP BY i.ItemID, i.ItemName, i.Category, i.Unit
		ORDER BY i.ItemName;`
	// --- End of new logic ---

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch inventory items", err)
		return
	}
	defer rows.Close()

	var items []InventoryItem
	for rows.Next() {
		var item InventoryItem
		if err := rows.Scan(&item.ItemID, &item.ItemName, &item.Category, &item.Unit, &item.TotalQuantityRemaining); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan inventory item", err)
			return
		}
		items = append(items, item)
	}
	respondJSON(w, http.StatusOK, items)
}

func createInventoryItem(w http.ResponseWriter, r *http.Request) {
	var item InventoryItem
	if !decodeJSONBody(w, r, &item) {
		return
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

func deleteInventoryItem(w http.ResponseWriter, r *http.Request) {
	itemID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid item ID", err)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()
	var totalStock float64
	stockQuery := "SELECT COALESCE(SUM(QuantityRemaining), 0) FROM cm_inventory_purchases WHERE ItemID = ?"
	if err := db.QueryRowContext(ctx, stockQuery, itemID).Scan(&totalStock); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to check item stock", err)
		return
	}

	if totalStock > 0 {
		handleError(w, http.StatusBadRequest, "Cannot archive an item that still has stock. Please deplete the inventory first.", nil)
		return
	}

	query := "UPDATE cm_items SET IsActive = 0 WHERE ItemID = ?"
	res, err := db.ExecContext(ctx, query, itemID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to deactivate item", err)
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

	// This query now correctly selects the Category and includes it in the GROUP BY
	query := `
		SELECT
			i.ItemID,
			i.ItemName,
			COALESCE(SUM(p.QuantityRemaining), 0) as TotalQuantityRemaining,
			i.Unit,
			i.IsActive,
			i.Category
		FROM cm_items i
		LEFT JOIN cm_inventory_purchases p ON i.ItemID = p.ItemID AND p.IsActive = 1
		WHERE i.IsActive = 1
		GROUP BY i.ItemID, i.ItemName, i.Unit, i.IsActive, i.Category
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
		// Ensure the Scan includes the new Category field
		if err := rows.Scan(&s.ItemID, &s.ItemName, &s.TotalQuantityRemaining, &s.Unit, &s.IsActive, &s.Category); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan stock level", err)
			return
		}
		summaries = append(summaries, s)
	}
	respondJSON(w, http.StatusOK, summaries)
}

// for purchase history details in inventory stock levels
// getPurchaseHistory handles GET /api/purchase-history/{id} (for the right panel)
func getPurchaseHistory(w http.ResponseWriter, r *http.Request) {
	itemID := chi.URLParam(r, "id")
	if itemID == "" { /* ... */
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT
			p.PurchaseID, -- ADDED
			p.PurchaseDate,
			p.QuantityPurchased, 
			p.QuantityRemaining,
			p.UnitCost,
			s.SupplierName
		FROM cm_inventory_purchases p
		JOIN cm_suppliers s ON p.SupplierID = s.SupplierID
		WHERE p.ItemID = ? AND p.IsActive = 1 -- CHANGED
		ORDER BY p.PurchaseDate DESC;`

	rows, err := db.QueryContext(ctx, query, itemID)
	if err != nil { /* ... */
	}
	defer rows.Close()

	var details []PurchaseHistoryDetail
	for rows.Next() {
		var d PurchaseHistoryDetail
		if err := rows.Scan(&d.PurchaseID, &d.PurchaseDate, &d.QuantityPurchased, &d.QuantityRemaining, &d.UnitCost, &d.SupplierName); err != nil { // CHANGED
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

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to start transaction", err)
		return
	}
	defer tx.Rollback()

	reactivateQuery := "UPDATE cm_items SET IsActive = 1 WHERE ItemID = ?"
	if _, err := tx.ExecContext(ctx, reactivateQuery, p.ItemID); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to reactivate item", err)
		return
	}

	purchaseQuery := `
		INSERT INTO cm_inventory_purchases 
		(ItemID, SupplierID, PurchaseDate, QuantityPurchased, UnitCost, QuantityRemaining) 
		VALUES (?, ?, ?, ?, ?, ?)`

	res, err := tx.ExecContext(ctx, purchaseQuery, p.ItemID, p.SupplierID, p.PurchaseDate, p.QuantityPurchased, p.UnitCost, p.QuantityPurchased)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert purchase", err)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	lastID, _ := res.LastInsertId()
	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": lastID})
}

// updatePurchase handles PUT /api/purchases/{id}
func updatePurchase(w http.ResponseWriter, r *http.Request) {
	purchaseID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid purchase ID", err)
		return
	}

	var p PurchasePayload
	if !decodeJSONBody(w, r, &p) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	var qtyPurchased, qtyRemaining float64
	checkQuery := "SELECT QuantityPurchased, QuantityRemaining FROM cm_inventory_purchases WHERE PurchaseID = ?"
	if err := db.QueryRowContext(ctx, checkQuery, purchaseID).Scan(&qtyPurchased, &qtyRemaining); err != nil {
		handleError(w, http.StatusNotFound, "Purchase record not found", err)
		return
	}

	if qtyPurchased != qtyRemaining {
		handleError(w, http.StatusBadRequest, "Cannot edit a purchase that has been partially used. Please create a stock adjustment instead.", nil)
		return
	}

	updateQuery := "UPDATE cm_inventory_purchases SET SupplierID = ?, PurchaseDate = ?, QuantityPurchased = ?, UnitCost = ?, QuantityRemaining = ? WHERE PurchaseID = ?"
	_, err = db.ExecContext(ctx, updateQuery, p.SupplierID, p.PurchaseDate, p.QuantityPurchased, p.UnitCost, p.QuantityPurchased, purchaseID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update purchase", err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// deletePurchase handles DELETE /api/purchases/{id} (soft delete)
func deletePurchase(w http.ResponseWriter, r *http.Request) {
	purchaseID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid purchase ID", err)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	var qtyPurchased, qtyRemaining float64
	checkQuery := "SELECT QuantityPurchased, QuantityRemaining FROM cm_inventory_purchases WHERE PurchaseID = ?"
	if err := db.QueryRowContext(ctx, checkQuery, purchaseID).Scan(&qtyPurchased, &qtyRemaining); err != nil {
		handleError(w, http.StatusNotFound, "Purchase record not found", err)
		return
	}
	if qtyPurchased != qtyRemaining {
		handleError(w, http.StatusBadRequest, "Cannot delete a purchase that has been partially used. Please create a stock adjustment instead.", nil)
		return
	}

	updateQuery := "UPDATE cm_inventory_purchases SET IsActive = 0 WHERE PurchaseID = ?"
	_, err = db.ExecContext(ctx, updateQuery, purchaseID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to deactivate purchase", err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
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

//for sales tab customer CRUD

func getCustomers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, "SELECT CustomerID, Name, BusinessName, ContactNumber, Email, Address, DateAdded FROM cm_customers WHERE IsActive = 1 ORDER BY Name")
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch customers", err)
		return
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var c Customer
		if err := rows.Scan(&c.CustomerID, &c.Name, &c.BusinessName, &c.ContactNumber, &c.Email, &c.Address, &c.DateAdded); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan customer", err)
			return
		}
		customers = append(customers, c)
	}
	respondJSON(w, http.StatusOK, customers)
}

func createCustomer(w http.ResponseWriter, r *http.Request) {
	var c Customer
	if !decodeJSONBody(w, r, &c) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "INSERT INTO cm_customers (Name, BusinessName, ContactNumber, Email, Address) VALUES (?, ?, ?, ?, ?)"
	res, err := db.ExecContext(ctx, query, c.Name, c.BusinessName, c.ContactNumber, c.Email, c.Address)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert customer", err)
		return
	}
	lastID, _ := res.LastInsertId()
	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": lastID})
}

func updateCustomer(w http.ResponseWriter, r *http.Request) {
	customerID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid customer ID", err)
		return
	}

	var c Customer
	if !decodeJSONBody(w, r, &c) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "UPDATE cm_customers SET Name = ?, BusinessName = ?, ContactNumber = ?, Email = ?, Address = ? WHERE CustomerID = ?"
	_, err = db.ExecContext(ctx, query, c.Name, c.BusinessName, c.ContactNumber, c.Email, c.Address, customerID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update customer", err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func deleteCustomer(w http.ResponseWriter, r *http.Request) {
	customerID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid customer ID", err)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	// Note: You could add a check here to prevent deleting customers with existing sales.
	query := "UPDATE cm_customers SET IsActive = 0 WHERE CustomerID = ?"
	_, err = db.ExecContext(ctx, query, customerID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to deactivate customer", err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// for history sales tab

func getSalesHistory(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT s.SaleID, s.SaleDate, c.Name, s.TotalAmount 
		FROM cm_sales_orders s
		JOIN cm_customers c ON s.CustomerID = c.CustomerID
		WHERE s.IsActive = 1
		ORDER BY s.SaleDate DESC;`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch sales history", err)
		return
	}
	defer rows.Close()

	var records []SaleHistoryRecord
	for rows.Next() {
		var rec SaleHistoryRecord
		if err := rows.Scan(&rec.SaleID, &rec.SaleDate, &rec.CustomerName, &rec.TotalAmount); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan sale history record", err)
			return
		}
		records = append(records, rec)
	}
	respondJSON(w, http.StatusOK, records)
}

// for deleting a sale record (soft delete)
func deleteSaleHistory(w http.ResponseWriter, r *http.Request) {
	saleID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid sale ID", err)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "UPDATE cm_sales_orders SET IsActive = 0 WHERE SaleID = ?"
	_, err = db.ExecContext(ctx, query, saleID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to deactivate sale", err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// for getting sale details by sale ID in sales history tab
func getSaleDetails(w http.ResponseWriter, r *http.Request) {
	saleID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid sale ID", err)
		return
	}
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT 
			sd.SaleDetailID,
			hp.ProductType, 
			sd.QuantitySold, 
			sd.TotalWeightKg, 
			sd.PricePerKg
		FROM cm_sales_details sd
		JOIN cm_harvest_products hp ON sd.HarvestProductID = hp.HarvestProductID
		WHERE sd.SaleID = ?;`

	rows, err := db.QueryContext(ctx, query, saleID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch sale details", err)
		return
	}
	defer rows.Close()

	var details []SaleDetailItem
	for rows.Next() {
		var d SaleDetailItem
		// Scan hp.ProductType into the d.ItemName field
		if err := rows.Scan(&d.SaleDetailID, &d.ItemName, &d.QuantitySold, &d.TotalWeightKg, &d.PricePerKg); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan sale detail", err)
			return
		}
		details = append(details, d)
	}
	respondJSON(w, http.StatusOK, details)
}

// for getting products available for sale in sales tab
func getSaleProducts(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	// MODIFICATION: Check for an optional 'type' query parameter
	productTypeFilter := r.URL.Query().Get("type")

	query := "SELECT HarvestProductID, ProductType, QuantityRemaining, WeightRemainingKg FROM cm_harvest_products WHERE IsActive = 1 AND (QuantityRemaining > 0 OR WeightRemainingKg > 0)"

	var args []interface{}
	if productTypeFilter != "" {
		query += " AND ProductType = ?"
		args = append(args, productTypeFilter)
	}

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch sale products", err)
		return
	}
	defer rows.Close()

	var products []SaleProduct
	for rows.Next() {
		var p SaleProduct
		if err := rows.Scan(&p.HarvestProductID, &p.ProductType, &p.QuantityRemaining, &p.WeightRemainingKg); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan sale product", err)
			return
		}
		products = append(products, p)
	}

	respondJSON(w, http.StatusOK, products)
}

// for getting payment methods (enum) in sales tab
func getPaymentMethods(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_sales_orders' AND COLUMN_NAME = 'PaymentMethod'
	`
	var enumStr string
	if err := db.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query payment methods", err)
		return
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	methods := strings.Split(cleanedStr, ",")
	respondJSON(w, http.StatusOK, methods)
}

// for creating a new sale record in sales tab when pressing add sale button
func createSaleHandler(w http.ResponseWriter, r *http.Request) {
	var payload SalePayload
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

	var totalAmount float64
	for _, item := range payload.Items {
		totalAmount += item.TotalWeightKg * item.PricePerKg
	}
	saleQuery := "INSERT INTO cm_sales_orders (CustomerID, SaleDate, TotalAmount, PaymentMethod, Notes, IsActive) VALUES (?, ?, ?, ?, ?, 1)"
	res, err := tx.ExecContext(ctx, saleQuery, payload.CustomerID, payload.SaleDate, totalAmount, payload.PaymentMethod, payload.Notes)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert into cm_sales_orders", err)
		return
	}
	saleID, _ := res.LastInsertId()

	for _, item := range payload.Items {
		var currentQty, currentWeight float64
		checkQuery := "SELECT QuantityRemaining, WeightRemainingKg FROM cm_harvest_products WHERE HarvestProductID = ? FOR UPDATE"
		if err := tx.QueryRowContext(ctx, checkQuery, item.HarvestProductID).Scan(&currentQty, &currentWeight); err != nil {
			handleError(w, http.StatusNotFound, "Product stock not found", err)
			return
		}

		isWeightOnlySale := currentQty == 0 && currentWeight > 0

		var newQtyRemaining float64

		if isWeightOnlySale {
			newQtyRemaining = 0
		} else {
			newQtyRemaining = currentQty - item.QuantitySold
		}

		var newWeightRemaining float64
		if item.TotalWeightKg >= currentWeight || newQtyRemaining <= 0 {
			newWeightRemaining = 0
		} else {
			newWeightRemaining = currentWeight - item.TotalWeightKg
		}

		if !isWeightOnlySale && item.QuantitySold > currentQty {
			handleError(w, http.StatusBadRequest, "Not enough quantity in stock.", nil)
			return
		}

		updateStockQuery := "UPDATE cm_harvest_products SET QuantityRemaining = ?, WeightRemainingKg = ? WHERE HarvestProductID = ?"
		_, err = tx.ExecContext(ctx, updateStockQuery, newQtyRemaining, newWeightRemaining, item.HarvestProductID)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to update product stock", err)
			return
		}

		if newQtyRemaining <= 0 && newWeightRemaining <= 0 {
			deactivateQuery := "UPDATE cm_harvest_products SET IsActive = 0 WHERE HarvestProductID = ?"
			_, err = tx.ExecContext(ctx, deactivateQuery, item.HarvestProductID)
			if err != nil {
				handleError(w, http.StatusInternalServerError, "Failed to deactivate product stock", err)
				return
			}
		}

		detailQuery := "INSERT INTO cm_sales_details (SaleID, HarvestProductID, QuantitySold, TotalWeightKg, PricePerKg) VALUES (?, ?, ?, ?, ?)"
		if _, err := tx.ExecContext(ctx, detailQuery, saleID, item.HarvestProductID, item.QuantitySold, item.TotalWeightKg, item.PricePerKg); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to insert into cm_sales_details", err)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}
	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "saleID": saleID})
}

func createInventoryUsage(w http.ResponseWriter, r *http.Request) {
	var payload InventoryUsagePayload
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

	stockQuery := `
		SELECT PurchaseID, QuantityRemaining 
		FROM cm_inventory_purchases 
		WHERE ItemID = ? AND IsActive = 1 AND QuantityRemaining > 0 
		ORDER BY PurchaseDate ASC`

	rows, err := tx.QueryContext(ctx, stockQuery, payload.ItemID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query available stock", err)
		return
	}

	type purchaseStock struct {
		ID           int
		QtyRemaining float64
	}
	var availablePurchases []purchaseStock
	var totalStockAvailable float64
	for rows.Next() {
		var ps purchaseStock
		if err := rows.Scan(&ps.ID, &ps.QtyRemaining); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan stock", err)
			return
		}
		totalStockAvailable += ps.QtyRemaining
		availablePurchases = append(availablePurchases, ps)
	}
	rows.Close()

	if payload.QuantityUsed > totalStockAvailable {
		handleError(w, http.StatusBadRequest, "Not enough total stock available to complete this action.", nil)
		return
	}

	usageQuery := "INSERT INTO cm_inventory_usage (BatchID, ItemID, Date, QuantityUsed) VALUES (?, ?, ?, ?)"
	res, err := tx.ExecContext(ctx, usageQuery, payload.BatchID, payload.ItemID, payload.Date, payload.QuantityUsed)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to create usage record", err)
		return
	}
	usageID, _ := res.LastInsertId()

	quantityToDeduct := payload.QuantityUsed
	for _, purchase := range availablePurchases {
		if quantityToDeduct <= 0 {
			break
		}

		quantityDrawn := 0.0
		if quantityToDeduct >= purchase.QtyRemaining {

			quantityDrawn = purchase.QtyRemaining
		} else {

			quantityDrawn = quantityToDeduct
		}

		updateQuery := "UPDATE cm_inventory_purchases SET QuantityRemaining = QuantityRemaining - ? WHERE PurchaseID = ?"
		_, err := tx.ExecContext(ctx, updateQuery, quantityDrawn, purchase.ID)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to update purchase stock", err)
			return
		}

		detailQuery := "INSERT INTO cm_inventory_usage_details (UsageID, PurchaseID, QuantityDrawn) VALUES (?, ?, ?)"
		_, err = tx.ExecContext(ctx, detailQuery, usageID, purchase.ID, quantityDrawn)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to create usage detail record", err)
			return
		}

		quantityToDeduct -= quantityDrawn
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "usageId": usageID})
}

// for batches tab main table

func getBatches(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	// Get filter values from URL query parameters
	searchTerm := r.URL.Query().Get("search")
	statusFilter := r.URL.Query().Get("status")

	query := `
		SELECT BatchID, BatchName, StartDate, ExpectedHarvestDate, TotalChicken, CurrentChicken, Status, Notes 
		FROM cm_batches 
		WHERE 1=1` // Start with a true condition to easily append AND clauses

	var args []interface{}

	if searchTerm != "" {
		query += " AND BatchName LIKE ?"
		args = append(args, "%"+searchTerm+"%")
	}

	if statusFilter != "" && statusFilter != "All" {
		query += " AND Status = ?"
		args = append(args, statusFilter)
	}

	query += " ORDER BY StartDate DESC"

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch batches", err)
		return
	}
	defer rows.Close()

	var batches []Batch
	for rows.Next() {
		var b Batch
		if err := rows.Scan(&b.BatchID, &b.BatchName, &b.StartDate, &b.ExpectedHarvestDate, &b.TotalChicken, &b.CurrentChicken, &b.Status, &b.Notes); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan batch", err)
			return
		}
		batches = append(batches, b)
	}

	respondJSON(w, http.StatusOK, batches)
}

func getBatchVitals(w http.ResponseWriter, r *http.Request) {
	batchID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	var vitals BatchVitals
	var startDateStr string

	query := "SELECT BatchName, StartDate, CurrentChicken FROM cm_batches WHERE BatchID = ?"
	err = db.QueryRowContext(ctx, query, batchID).Scan(&vitals.BatchName, &startDateStr, &vitals.CurrentPopulation)
	if err != nil {
		handleError(w, http.StatusNotFound, "Batch not found", err)
		return
	}
	vitals.StartDate = startDateStr

	startDateParsed, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to parse start date", err)
		return
	}

	if vitals.CurrentPopulation <= 0 {
		endDateQuery := `SELECT MAX(HarvestDate) FROM cm_harvest WHERE BatchID = ?`

		var endDate sql.NullString
		if err := db.QueryRowContext(ctx, endDateQuery, batchID).Scan(&endDate); err == nil && endDate.Valid {
			vitals.EndDate = &endDate.String

			endDateParsed, _ := time.Parse("2006-01-02", endDate.String)
			vitals.AgeInDays = int(endDateParsed.Sub(startDateParsed).Hours() / 24)
		}
	} else {
		vitals.AgeInDays = int(time.Since(startDateParsed).Hours() / 24)
	}

	mortalityQuery := "SELECT COALESCE(SUM(BirdsLoss), 0) FROM cm_mortality WHERE BatchID = ?"
	if err := db.QueryRowContext(ctx, mortalityQuery, batchID).Scan(&vitals.TotalMortality); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch mortality data", err)
		return
	}

	respondJSON(w, http.StatusOK, vitals)
}

func debugTableSchema(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("DESCRIBE cm_users")
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to describe table", err)
		return
	}
	defer rows.Close()

	var result []string
	for rows.Next() {
		var field, typ, null, key, extra string
		var def *string
		err = rows.Scan(&field, &typ, &null, &key, &def, &extra)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan row", err)
			return
		}
		result = append(result, fmt.Sprintf("%s %s %s %s %v %s", field, typ, null, key, def, extra))
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"table":  "cm_users",
		"schema": result,
	})
}

func createMortalityRecord(w http.ResponseWriter, r *http.Request) {
	var payload MortalityPayload
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

	insertQuery := "INSERT INTO cm_mortality (BatchID, Date, BirdsLoss, Notes) VALUES (?, ?, ?, ?)"
	_, err = tx.ExecContext(ctx, insertQuery, payload.BatchID, payload.Date, payload.BirdsLoss, payload.Notes)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert mortality record", err)
		return
	}

	updateQuery := "UPDATE cm_batches SET CurrentChicken = CurrentChicken - ? WHERE BatchID = ?"
	_, err = tx.ExecContext(ctx, updateQuery, payload.BirdsLoss, payload.BatchID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update batch population", err)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true})
}

// for health check records in batches tab
func createHealthCheck(w http.ResponseWriter, r *http.Request) {
	var payload HealthCheckPayload
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "INSERT INTO cm_health_checks (BatchID, CheckDate, Observations, CheckedBy) VALUES (?, ?, ?, ?)"
	_, err := db.ExecContext(ctx, query, payload.BatchID, payload.CheckDate, payload.Observations, payload.CheckedBy)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert health check record", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true})
}

// for deleting an event (consumption or mortality) and reverting its effects on Batch Monitoring
func deleteEvent(w http.ResponseWriter, r *http.Request) {
	eventType := chi.URLParam(r, "type")
	eventID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid event ID", err)
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

	switch eventType {
	case "consumption":

		type reversalDetail struct {
			PurchaseID    int
			QuantityDrawn float64
		}
		var details []reversalDetail

		rows, err := tx.QueryContext(ctx, "SELECT PurchaseID, QuantityDrawn FROM cm_inventory_usage_details WHERE UsageID = ?", eventID)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to find usage details", err)
			return
		}

		for rows.Next() {
			var d reversalDetail
			if err := rows.Scan(&d.PurchaseID, &d.QuantityDrawn); err != nil {
				rows.Close()
				handleError(w, http.StatusInternalServerError, "Failed to scan usage detail", err)
				return
			}
			details = append(details, d)
		}

		rows.Close()
		if err = rows.Err(); err != nil {
			handleError(w, http.StatusInternalServerError, "Error iterating usage details", err)
			return
		}

		for _, d := range details {
			_, err = tx.ExecContext(ctx, "UPDATE cm_inventory_purchases SET QuantityRemaining = QuantityRemaining + ? WHERE PurchaseID = ?", d.QuantityDrawn, d.PurchaseID)
			if err != nil {
				handleError(w, http.StatusInternalServerError, "Failed to restore inventory stock", err)
				return
			}
		}

		if _, err := tx.ExecContext(ctx, "DELETE FROM cm_inventory_usage_details WHERE UsageID = ?", eventID); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to delete usage details", err)
			return
		}
		if _, err := tx.ExecContext(ctx, "DELETE FROM cm_inventory_usage WHERE UsageID = ?", eventID); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to delete usage record", err)
			return
		}

	case "mortality":
		var birdsLoss, batchID int
		err := tx.QueryRowContext(ctx, "SELECT BirdsLoss, BatchID FROM cm_mortality WHERE MortalityID = ?", eventID).Scan(&birdsLoss, &batchID)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to find mortality record", err)
			return
		}
		_, err = tx.ExecContext(ctx, "UPDATE cm_batches SET CurrentChicken = CurrentChicken + ? WHERE BatchID = ?", birdsLoss, batchID)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to restore batch population", err)
			return
		}
		if _, err := tx.ExecContext(ctx, "DELETE FROM cm_mortality WHERE MortalityID = ?", eventID); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to delete mortality record", err)
			return
		}

	case "cost":
		_, err := tx.ExecContext(ctx, "DELETE FROM cm_production_cost WHERE CostID = ?", eventID)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to delete cost record", err)
			return
		}

	default:
		handleError(w, http.StatusBadRequest, "Unknown event type", nil)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// for getting cost records in batches tab

func createDirectCost(w http.ResponseWriter, r *http.Request) {
	batchID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	var payload DirectCostPayload
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	payload.BatchID = batchID

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := "INSERT INTO cm_production_cost (BatchID, Date, CostType, Amount, Description) VALUES (?, ?, ?, ?, ?)"
	res, err := db.ExecContext(ctx, query, payload.BatchID, payload.Date, payload.CostType, payload.Amount, payload.Description)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to insert direct cost", err)
		return
	}

	lastID, _ := res.LastInsertId()
	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": lastID})
}

// for updating a direct cost record in batches tab

func updateDirectCost(w http.ResponseWriter, r *http.Request) {
	costID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid cost ID", err)
		return
	}

	var payload DirectCostPayload
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		UPDATE cm_production_cost 
		SET Date = ?, CostType = ?, Description = ?, Amount = ? 
		WHERE CostID = ?`

	res, err := db.ExecContext(ctx, query, payload.Date, payload.CostType, payload.Description, payload.Amount, costID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update direct cost", err)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		handleError(w, http.StatusNotFound, "Cost record not found or no changes made", nil)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func getHarvestedProducts(w http.ResponseWriter, r *http.Request) {
	batchID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT
			hp.HarvestProductID,
			h.HarvestDate,
			hp.ProductType,
			hp.QuantityHarvested,
			hp.QuantityRemaining,
			hp.WeightHarvestedKg,
			hp.WeightRemainingKg
		FROM cm_harvest_products hp
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		WHERE h.BatchID = ?
		ORDER BY h.HarvestDate DESC`

	rows, err := db.QueryContext(ctx, query, batchID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query harvested products", err)
		return
	}
	defer rows.Close()

	var products []HarvestedProduct
	for rows.Next() {
		var p HarvestedProduct

		if err := rows.Scan(
			&p.HarvestProductID, &p.HarvestDate, &p.ProductType,
			&p.QuantityHarvested, &p.QuantityRemaining,
			&p.WeightHarvestedKg, &p.WeightRemainingKg,
		); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan harvested product", err)
			return
		}
		products = append(products, p)
	}

	respondJSON(w, http.StatusOK, products)
}

func createHarvest(w http.ResponseWriter, r *http.Request) {
	var payload HarvestPayload
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

	var currentChicken int
	checkQuery := "SELECT CurrentChicken FROM cm_batches WHERE BatchID = ? FOR UPDATE"
	if err := tx.QueryRowContext(ctx, checkQuery, payload.BatchID).Scan(&currentChicken); err != nil {
		handleError(w, http.StatusNotFound, "Batch not found", err)
		return
	}
	if payload.QuantityHarvested > currentChicken {
		handleError(w, http.StatusBadRequest, "Not enough chickens in the batch to harvest.", nil)
		return
	}

	updateBatchQuery := "UPDATE cm_batches SET CurrentChicken = CurrentChicken - ? WHERE BatchID = ?"
	if _, err := tx.ExecContext(ctx, updateBatchQuery, payload.QuantityHarvested, payload.BatchID); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update batch population", err)
		return
	}

	harvestNote := fmt.Sprintf("%d %s chickens harvested.", payload.QuantityHarvested, payload.ProductType)
	harvestQuery := "INSERT INTO cm_harvest (BatchID, HarvestDate, Notes) VALUES (?, ?, ?)"
	res, err := tx.ExecContext(ctx, harvestQuery, payload.BatchID, payload.HarvestDate, harvestNote)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to create harvest record", err)
		return
	}
	harvestID, _ := res.LastInsertId()

	if payload.SaleDetails != nil {

		productQuery := `
			INSERT INTO cm_harvest_products 
			(HarvestID, ProductType, QuantityHarvested, WeightHarvestedKg, QuantityRemaining, WeightRemainingKg) 
			VALUES (?, ?, ?, ?, 0, 0.00)`
		res, err = tx.ExecContext(ctx, productQuery, harvestID, payload.ProductType, payload.QuantityHarvested, payload.TotalWeightKg)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to create harvested product record for sale", err)
			return
		}
		harvestProductID, _ := res.LastInsertId()

		totalAmount := payload.TotalWeightKg * payload.SaleDetails.PricePerKg
		saleOrderQuery := `
			INSERT INTO cm_sales_orders (CustomerID, SaleDate, TotalAmount, PaymentMethod, Notes) 
			VALUES (?, ?, ?, ?, 'Instant sale from live harvest')`
		res, err = tx.ExecContext(ctx, saleOrderQuery, payload.SaleDetails.CustomerID, payload.HarvestDate, totalAmount, payload.SaleDetails.PaymentMethod)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to create sales order", err)
			return
		}
		saleID, _ := res.LastInsertId()

		saleDetailQuery := `
			INSERT INTO cm_sales_details (SaleID, HarvestProductID, QuantitySold, TotalWeightKg, PricePerKg) 
			VALUES (?, ?, ?, ?, ?)`
		_, err = tx.ExecContext(ctx, saleDetailQuery, saleID, harvestProductID, payload.QuantityHarvested, payload.TotalWeightKg, payload.SaleDetails.PricePerKg)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to create sales detail", err)
			return
		}

	} else {

		productQuery := `
			INSERT INTO cm_harvest_products 
			(HarvestID, ProductType, QuantityHarvested, WeightHarvestedKg, QuantityRemaining, WeightRemainingKg) 
			VALUES (?, ?, ?, ?, ?, ?)`
		_, err = tx.ExecContext(ctx, productQuery, harvestID, payload.ProductType, payload.QuantityHarvested, payload.TotalWeightKg, payload.QuantityHarvested, payload.TotalWeightKg)
		if err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to create harvested product record", err)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true})
}

// for getting product types (enum) in harvesting tab
func getProductTypes(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() 
		AND TABLE_NAME = 'cm_harvest_products' 
		AND COLUMN_NAME = 'ProductType'`

	var enumStr string
	if err := db.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query product types", err)
		return
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	types := strings.Split(cleanedStr, ",")
	respondJSON(w, http.StatusOK, types)
}

func getProductTypeUsage(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	rows, err := db.QueryContext(ctx, "SELECT DISTINCT ProductType FROM cm_harvest_products")
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query product type usage", err)
		return
	}
	defer rows.Close()

	var usedTypes []string
	for rows.Next() {
		var productType string
		if err := rows.Scan(&productType); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan used product type", err)
			return
		}
		usedTypes = append(usedTypes, productType)
	}
	respondJSON(w, http.StatusOK, usedTypes)
}

// for adding a new product type (enum) in harvesting tab
func addProductType(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		NewType string `json:"newType"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}
	if payload.NewType == "" {
		handleError(w, http.StatusBadRequest, "New product type name cannot be empty.", nil)
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

	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_harvest_products' AND COLUMN_NAME = 'ProductType'`

	var enumStr string
	if err := tx.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query current product types", err)
		return
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	existingTypes := strings.Split(cleanedStr, ",")
	for _, t := range existingTypes {
		if strings.EqualFold(t, payload.NewType) {
			handleError(w, http.StatusConflict, "This product type already exists.", nil)
			return
		}
	}

	newEnumList := enumStr + ",'" + payload.NewType + "'"
	alterQuery := fmt.Sprintf("ALTER TABLE cm_harvest_products MODIFY COLUMN ProductType ENUM(%s)", newEnumList)

	if _, err := tx.ExecContext(ctx, alterQuery); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update product types in database.", err)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true})
}

// for deleting a product type (enum) in harvesting tab
func deleteProductType(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		TypeToDelete string `json:"typeToDelete"`
	}
	if !decodeJSONBody(w, r, &payload) {
		return
	}
	if payload.TypeToDelete == "" {
		handleError(w, http.StatusBadRequest, "Product type to delete cannot be empty.", nil)
		return
	}
	if strings.EqualFold(payload.TypeToDelete, "Live") || strings.EqualFold(payload.TypeToDelete, "Dressed") {
		handleError(w, http.StatusBadRequest, "Cannot delete core product types 'Live' or 'Dressed'.", nil)
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

	var usageCount int
	usageQuery := "SELECT COUNT(*) FROM cm_harvest_products WHERE ProductType = ?"
	if err := tx.QueryRowContext(ctx, usageQuery, payload.TypeToDelete).Scan(&usageCount); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to check product type usage.", err)
		return
	}
	if usageCount > 0 {
		handleError(w, http.StatusConflict, "Cannot delete a product type that is currently in use.", nil)
		return
	}

	query := `
		SELECT SUBSTRING(COLUMN_TYPE, 6, LENGTH(COLUMN_TYPE) - 6)
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cm_harvest_products' AND COLUMN_NAME = 'ProductType'`

	var enumStr string
	if err := tx.QueryRowContext(ctx, query).Scan(&enumStr); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to query current product types", err)
		return
	}

	cleanedStr := strings.ReplaceAll(enumStr, "'", "")
	existingTypes := strings.Split(cleanedStr, ",")
	var newTypes []string
	for _, t := range existingTypes {
		if !strings.EqualFold(t, payload.TypeToDelete) {
			newTypes = append(newTypes, "'"+t+"'")
		}
	}
	newEnumList := strings.Join(newTypes, ",")

	alterQuery := fmt.Sprintf("ALTER TABLE cm_harvest_products MODIFY COLUMN ProductType ENUM(%s)", newEnumList)
	if _, err := tx.ExecContext(ctx, alterQuery); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update product types in database.", err)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

// for deleting a harvest product and reverting its effects on Batch Monitoring and Sales

func deleteHarvestProduct(w http.ResponseWriter, r *http.Request) {
	harvestProductID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid harvest product ID", err)
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

	var batchID, quantityHarvested, quantityRemaining int
	infoQuery := `
		SELECT h.BatchID, hp.QuantityHarvested, hp.QuantityRemaining
		FROM cm_harvest_products hp
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		WHERE hp.HarvestProductID = ? FOR UPDATE`
	if err := tx.QueryRowContext(ctx, infoQuery, harvestProductID).Scan(&batchID, &quantityHarvested, &quantityRemaining); err != nil {
		handleError(w, http.StatusNotFound, "Harvest product not found", err)
		return
	}

	if quantityRemaining < quantityHarvested {
		handleError(w, http.StatusBadRequest, "Cannot delete a harvest that has already been sold.", nil)
		return
	}

	if _, err := tx.ExecContext(ctx, "DELETE FROM cm_harvest_products WHERE HarvestProductID = ?", harvestProductID); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to delete harvest product", err)
		return
	}

	updateBatchQuery := "UPDATE cm_batches SET CurrentChicken = CurrentChicken + ? WHERE BatchID = ?"
	if _, err := tx.ExecContext(ctx, updateBatchQuery, quantityHarvested, batchID); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to restore batch population", err)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func updateHarvestProduct(w http.ResponseWriter, r *http.Request) {
	harvestProductID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid harvest product ID", err)
		return
	}

	var payload HarvestProductUpdatePayload
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

	var oldQtyHarvested, oldQtyRemaining, batchID int
	checkQuery := `
		SELECT h.BatchID, hp.QuantityHarvested, hp.QuantityRemaining
		FROM cm_harvest_products hp
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		WHERE hp.HarvestProductID = ? FOR UPDATE`
	if err := tx.QueryRowContext(ctx, checkQuery, harvestProductID).Scan(&batchID, &oldQtyHarvested, &oldQtyRemaining); err != nil {
		handleError(w, http.StatusNotFound, "Harvest product not found", err)
		return
	}

	if oldQtyRemaining < oldQtyHarvested {
		handleError(w, http.StatusBadRequest, "Cannot edit a harvest that has already been sold.", nil)
		return
	}

	updateProductQuery := `
		UPDATE cm_harvest_products 
		SET ProductType = ?, QuantityHarvested = ?, WeightHarvestedKg = ?, QuantityRemaining = ?, WeightRemainingKg = ?
		WHERE HarvestProductID = ?`
	_, err = tx.ExecContext(ctx, updateProductQuery, payload.ProductType, payload.QuantityHarvested, payload.TotalWeightKg, payload.QuantityHarvested, payload.TotalWeightKg, harvestProductID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update harvest product", err)
		return
	}

	updateHarvestQuery := "UPDATE cm_harvest SET HarvestDate = ? WHERE HarvestID = (SELECT HarvestID FROM cm_harvest_products WHERE HarvestProductID = ?)"
	_, err = tx.ExecContext(ctx, updateHarvestQuery, payload.HarvestDate, harvestProductID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update harvest date", err)
		return
	}

	// Adjust the batch's chicken count based on the change in harvested quantity
	qtyDifference := payload.QuantityHarvested - oldQtyHarvested
	updateBatchQuery := "UPDATE cm_batches SET CurrentChicken = CurrentChicken - ? WHERE BatchID = ?"
	if _, err := tx.ExecContext(ctx, updateBatchQuery, qtyDifference, batchID); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to adjust batch population", err)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func processByproducts(w http.ResponseWriter, r *http.Request) {
	var payload ProcessPayload // Use the new ProcessPayload struct
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

	// Create a single parent harvest event for this entire processing action
	harvestNote := fmt.Sprintf("Processed %d Dressed chickens to create byproducts.", payload.QuantityToProcess)
	harvestQuery := "INSERT INTO cm_harvest (BatchID, HarvestDate, Notes) VALUES (?, ?, ?)"
	res, err := tx.ExecContext(ctx, harvestQuery, payload.BatchID, payload.ProcessingDate, harvestNote)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to create byproduct harvest event.", err)
		return
	}
	newHarvestID, _ := res.LastInsertId()

	// Loop through all the yielded byproducts from the payload and create a record for each one
	for _, yield := range payload.Yields {
		byproductQuery := `
			INSERT INTO cm_harvest_products 
			(HarvestID, ProductType, QuantityHarvested, WeightHarvestedKg, QuantityRemaining, WeightRemainingKg)
			VALUES (?, ?, 0, ?, 0, ?)`
		if _, err := tx.ExecContext(ctx, byproductQuery, newHarvestID, yield.ByproductType, yield.ByproductWeightKg, yield.ByproductWeightKg); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to create byproduct inventory.", err)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true})
}

// for creating, editing, and deleting batch

func createBatch(w http.ResponseWriter, r *http.Request) {
	var payload NewBatchPayload
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	if payload.TotalChicken <= 0 {
		handleError(w, http.StatusBadRequest, "Total chicken must be greater than zero.", nil)
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

	batchQuery := `
		INSERT INTO cm_batches 
		(BatchName, StartDate, ExpectedHarvestDate, TotalChicken, CurrentChicken, Status, Notes) 
		VALUES (?, ?, ?, ?, ?, 'Active', ?)`

	res, err := tx.ExecContext(ctx, batchQuery,
		payload.BatchName,
		payload.StartDate,
		payload.ExpectedHarvestDate,
		payload.TotalChicken,
		payload.TotalChicken,
		payload.Notes,
	)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to create new batch", err)
		return
	}
	newBatchID, _ := res.LastInsertId()

	if payload.ChickCost > 0 {
		costDescription := fmt.Sprintf("Initial purchase of %d chicks.", payload.TotalChicken)
		costQuery := `
			INSERT INTO cm_production_cost (BatchID, Date, CostType, Amount, Description)
			VALUES (?, ?, 'Chick Purchase', ?, ?)`

		if _, err := tx.ExecContext(ctx, costQuery, newBatchID, payload.StartDate, payload.ChickCost, costDescription); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to create initial chick cost", err)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "insertedId": newBatchID})
}

func updateBatch(w http.ResponseWriter, r *http.Request) {
	batchID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid batch ID", err)
		return
	}

	var payload UpdateBatchPayload
	if !decodeJSONBody(w, r, &payload) {
		return
	}

	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	query := `
		UPDATE cm_batches 
		SET BatchName = ?, ExpectedHarvestDate = ?, Notes = ?, Status = ?
		WHERE BatchID = ?`

	_, err = db.ExecContext(ctx, query, payload.BatchName, payload.ExpectedHarvestDate, payload.Notes, payload.Status, batchID)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to update batch", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}

func deleteBatch(w http.ResponseWriter, r *http.Request) {
	batchID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		handleError(w, http.StatusBadRequest, "Invalid batch ID", err)
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

	childTables := []string{"cm_harvest", "cm_inventory_usage", "cm_mortality", "cm_production_cost", "cm_health_checks"}
	for _, table := range childTables {
		var count int
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE BatchID = ?", table)
		if err := tx.QueryRowContext(ctx, query, batchID).Scan(&count); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to check batch activity", err)
			return
		}
		if count > 0 {
			handleError(w, http.StatusBadRequest, "Cannot delete a batch with existing monitoring or harvest records.", nil)
			return
		}
	}

	if _, err := tx.ExecContext(ctx, "DELETE FROM cm_batches WHERE BatchID = ?", batchID); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to delete batch", err)
		return
	}

	if err := tx.Commit(); err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to commit transaction", err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})

}

// for harvested inventory

func getHarvestedInventory(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	productTypeFilter := r.URL.Query().Get("productType")
	batchIDFilter := r.URL.Query().Get("batchId")

	query := `
		SELECT
			hp.HarvestProductID,
			h.HarvestDate,
			hp.ProductType,
			b.BatchName,
			hp.QuantityHarvested,
			hp.WeightHarvestedKg,
			hp.QuantityRemaining,
			hp.WeightRemainingKg
		FROM cm_harvest_products hp
		JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
		JOIN cm_batches b ON h.BatchID = b.BatchID
		WHERE hp.IsActive = 1`

	var args []interface{}
	if productTypeFilter != "" && productTypeFilter != "All" {
		query += " AND hp.ProductType = ?"
		args = append(args, productTypeFilter)
	}
	if batchIDFilter != "" && batchIDFilter != "All" {
		query += " AND b.BatchID = ?"
		args = append(args, batchIDFilter)
	}
	query += " ORDER BY h.HarvestDate DESC"

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch harvested inventory", err)
		return
	}
	defer rows.Close()

	var inventory []HarvestedInventoryItem
	for rows.Next() {
		var item HarvestedInventoryItem
		if err := rows.Scan(&item.HarvestProductID, &item.HarvestDate, &item.ProductType, &item.BatchOrigin, &item.QuantityHarvested, &item.WeightHarvestedKg, &item.QuantityRemaining, &item.WeightRemainingKg); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan harvested item", err)
			return
		}
		inventory = append(inventory, item)
	}
	respondJSON(w, http.StatusOK, inventory)
}

// In main.go, replace the existing getHarvestedSummary function
func getHarvestedSummary(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()

	productTypeFilter := r.URL.Query().Get("productType")
	batchIDFilter := r.URL.Query().Get("batchId")

	// Base WHERE clause and arguments that apply to all queries
	whereClause := "WHERE hp.IsActive = 1"
	var baseArgs []interface{}

	if batchIDFilter != "" && batchIDFilter != "All" {
		whereClause += " AND h.BatchID = ?"
		baseArgs = append(baseArgs, batchIDFilter)
	}

	var totalDressed, totalLive int
	var totalByproductWeight float64

	// --- Calculate Total Dressed ---
	// Only calculate if the filter allows for 'Dressed' products
	if productTypeFilter == "" || productTypeFilter == "All" || productTypeFilter == "Dressed" {
		query := fmt.Sprintf(`
			SELECT COALESCE(SUM(hp.QuantityRemaining), 0)
			FROM cm_harvest_products hp
			JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
			%s AND hp.ProductType = 'Dressed'`, whereClause)
		
		db.QueryRowContext(ctx, query, baseArgs...).Scan(&totalDressed)
	}

	// --- Calculate Total Live ---
	// Only calculate if the filter allows for 'Live' products
	if productTypeFilter == "" || productTypeFilter == "All" || productTypeFilter == "Live" {
		query := fmt.Sprintf(`
			SELECT COALESCE(SUM(hp.QuantityRemaining), 0)
			FROM cm_harvest_products hp
			JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
			%s AND hp.ProductType = 'Live'`, whereClause)

		db.QueryRowContext(ctx, query, baseArgs...).Scan(&totalLive)
	}

	// --- Calculate Total Byproduct Weight ---
	// Only calculate if the filter allows for byproducts
	if productTypeFilter == "" || productTypeFilter == "All" || (productTypeFilter != "Live" && productTypeFilter != "Dressed") {
		var byproductWhereClause string
		var byproductArgs = append([]interface{}{}, baseArgs...) // Create a copy of baseArgs

		if productTypeFilter != "" && productTypeFilter != "All" {
			byproductWhereClause = " AND hp.ProductType = ?"
			byproductArgs = append(byproductArgs, productTypeFilter)
		} else {
			byproductWhereClause = " AND hp.ProductType NOT IN ('Live', 'Dressed')"
		}
		
		query := fmt.Sprintf(`
			SELECT COALESCE(SUM(hp.WeightRemainingKg), 0)
			FROM cm_harvest_products hp
			JOIN cm_harvest h ON hp.HarvestID = h.HarvestID
			%s %s`, whereClause, byproductWhereClause)

		db.QueryRowContext(ctx, query, byproductArgs...).Scan(&totalByproductWeight)
	}

	summary := map[string]interface{}{
		"totalDressed":         totalDressed,
		"totalLive":            totalLive,
		"totalByproductWeight": totalByproductWeight,
	}
	respondJSON(w, http.StatusOK, summary)
}


func getBatchListForFilter(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := withTimeout(r.Context())
	defer cancel()
	rows, err := db.QueryContext(ctx, "SELECT BatchID, BatchName FROM cm_batches ORDER BY StartDate DESC")
	if err != nil {
		handleError(w, http.StatusInternalServerError, "Failed to fetch batch list", err)
		return
	}
	defer rows.Close()

	var batchList []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			handleError(w, http.StatusInternalServerError, "Failed to scan batch list item", err)
			return
		}
		batchList = append(batchList, map[string]interface{}{"BatchID": id, "BatchName": name})
	}
	respondJSON(w, http.StatusOK, batchList)
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
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors)

	// Debug endpoint
	r.Get("/debug/schema", debugTableSchema)

	r.Route("/api", func(r chi.Router) {
		// --- Standalone routes ---
		r.Post("/dht22-data", handleDhtData)
		r.Post("/login", loginHandler)
		r.Post("/register", registerHandler)
		r.Get("/categories", getCategories)
		r.Get("/units", getUnits)
		r.Get("/stock-levels", getStockLevels)
		r.Get("/purchase-history/{id}", getPurchaseHistory)
		r.Get("/sale-products", getSaleProducts)
		r.Get("/payment-methods", getPaymentMethods)
		r.Post("/stock-items", createStockItem)
		r.Post("/usage", createInventoryUsage)

		// --- RESTful route for Items ---
		r.Route("/items", func(r chi.Router) {
			r.Get("/", getInventoryItems)
			r.Post("/", createInventoryItem)
			r.Put("/{id}", updateInventoryItem)
			r.Delete("/{id}", deleteInventoryItem)
		})

		// --- RESTful route for Suppliers ---
		r.Route("/suppliers", func(r chi.Router) {
			r.Get("/", getSuppliers)
			r.Post("/", createSupplier)
			r.Put("/{id}", updateSupplier)
			r.Delete("/{id}", deleteSupplier)
		})

		// --- RESTful route for Customers ---
		r.Route("/customers", func(r chi.Router) {
			r.Get("/", getCustomers)
			r.Post("/", createCustomer)
			r.Put("/{id}", updateCustomer)
			r.Delete("/{id}", deleteCustomer)
		})

		// --- RESTful route for Sales ---
		r.Route("/sales", func(r chi.Router) {
			r.Get("/", getSalesHistory)
			r.Get("/{id}", getSaleDetails)
			r.Post("/", createSaleHandler)
			r.Delete("/{id}", deleteSaleHistory)
		})

		// --- RESTful route for Purchases (Inventory Restock) ---
		r.Route("/purchases", func(r chi.Router) {
			r.Post("/", createPurchase)
			r.Put("/{id}", updatePurchase)
			r.Delete("/{id}", deletePurchase)
		})

		// --- Routes for Batch Monitoring ---
		r.Get("/batches", getBatches) // Gets the list of all batches
		r.Post("/batches", createBatch)
		r.Route("/batches/{id}", func(r chi.Router) {
			r.Get("/vitals", getBatchVitals)
			r.Get("/events", getBatchEvents)
			r.Get("/costs", getBatchCosts)
			r.Post("/costs", createDirectCost)
			r.Get("/harvest-products", getHarvestedProducts)
			r.Put("/", updateBatch)
			r.Delete("/", deleteBatch)
		})

		// for record daily events
		r.Post("/mortality", createMortalityRecord)
		r.Post("/health-checks", createHealthCheck)
		r.Delete("/events/{type}/{id}", deleteEvent)

		r.Put("/costs/{id}", updateDirectCost)
		r.Delete("/events/{type}/{id}", deleteEvent)

		// for harvesting
		r.Get("/product-types", getProductTypes)
		r.Get("/product-types/usage", getProductTypeUsage)
		r.Post("/product-types", addProductType)
		r.Delete("/product-types", deleteProductType)
		r.Post("/harvests", createHarvest)
		r.Delete("/harvest-products/{id}", deleteHarvestProduct)
		r.Put("/harvest-products/{id}", updateHarvestProduct)
		r.Post("/byproducts", processByproducts)

		//for harvested inventory
		r.Get("/harvested-products", getHarvestedInventory)
		r.Get("/harvested-products/summary", getHarvestedSummary)
		r.Get("/batch-list", getBatchListForFilter)

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
