package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

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
	SupplierID    int    `json:"SupplierID"`
	SupplierName  string `json:"SupplierName"`
	ContactPerson string `json:"ContactPerson"`
	PhoneNumber   string `json:"PhoneNumber"`
	Email         string `json:"Email"`
	Address       string `json:"Address"`
	Notes         string `json:"Notes"`
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

type DhtData struct {
	ID          int     `json:"temp_id"`
	Temperature float64 `json:"temp_temperature"`
	Humidity    float64 `json:"temp_humidity"`
	CageNum     int     `json:"temp_cage_num"`
	CreatedAt   string  `json:"created_at"`
}

var db *sql.DB

func initDB() {
	var err error
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	dsn := os.Getenv("DB_DSN")
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Database ping failed:", err)
	}

	fmt.Println("Connected to MySQL successfully.")
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*") // Allows all origins
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func getUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(os.Getenv("GET_USERS"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User

	for rows.Next() {
		var user User
		if err := rows.Scan(&user.Name, &user.Username, &user.Role, &user.Status); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func getItemByType(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Decode JSON body
	var payload struct {
		ItemType string `json:"item_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	fmt.Println("Fetching item of type:", payload.ItemType)

	// Query using your GET_ITEMS_BY_ID env var
	rows, err := db.Query(os.Getenv("GET_ITEMS_BY_TYPE"), payload.ItemType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []Items
	// Adjust struct fields accordingly

	for rows.Next() {
		var item Items
		if err := rows.Scan(&item.ID, &item.SupplierID, &item.Name, &item.Category, &item.Unit); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func getBatches(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(os.Getenv("GET_BATCHES"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var batches []Batches

	for rows.Next() {
		var batch Batches
		if err := rows.Scan(&batch.ID, &batch.BatchName, &batch.TotalChicken, &batch.CurrentChicken, &batch.StartDate,
			&batch.ExpectedHarvestDate, &batch.Status, &batch.Notes, &batch.CostType, &batch.Amount,
			&batch.Description, &batch.BirdsLost); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		batches = append(batches, batch)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(batches)
}

func getHarvests(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(os.Getenv("GET_HARVEST"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var harvests []Harvests

	for rows.Next() {
		var harvest Harvests
		if err := rows.Scan(
			&harvest.HarvestID, &harvest.BatchID, &harvest.HarvestDate,
			&harvest.Notes, &harvest.SaleType, &harvest.BirdQuantity,
			&harvest.TotalWeightKg, &harvest.PricePerKg, &harvest.SalesAmount,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		harvests = append(harvests, harvest)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(harvests)
}

func getSupplier(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(os.Getenv("GET_SUPPLIER"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var suppliers []Supplier

	for rows.Next() {
		var supplier Supplier
		if err := rows.Scan(
			&supplier.SupplierID, &supplier.SupplierName, &supplier.ContactPerson,
			&supplier.PhoneNumber, &supplier.Email, &supplier.Address, &supplier.Notes,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		suppliers = append(suppliers, supplier)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(suppliers)
}

func getSimpleSales(w http.ResponseWriter, r *http.Request) {
	query := "SELECT sales_id, sales_amount, sales_status, sales_date, sales_remarks FROM cm_sales"
	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var sales []SimpleSales

	for rows.Next() {
		var sale SimpleSales
		if err := rows.Scan(
			&sale.ID, &sale.Amount, &sale.Status, &sale.Date, &sale.Remarks,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sales = append(sales, sale)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

func getProducts(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(os.Getenv("GET_PRODUCTS"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []Product

	for rows.Next() {
		var product Product
		if err := rows.Scan(&product.ID, &product.ProductPrice, &product.ProductWeight, &product.ProductWeightUnit); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		products = append(products, product)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func getSales(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		SalesID *int `json:"sales_id"` // pointer allows null
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	var rows *sql.Rows
	var err error

	if payload.SalesID != nil {
		rows, err = db.Query(os.Getenv("GET_SALES_BY_ID"), *payload.SalesID)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var sales []Sales

	for rows.Next() {
		var sale Sales
		if err := rows.Scan(
			&sale.ID, &sale.Amount, &sale.Status, &sale.Date, &sale.Remarks,
			&sale.PurchaseNumber, &sale.ProductPrice, &sale.ProductWeight,
			&sale.ProductWeightUnit, &sale.ProductClass, &sale.ProductBatch,
			&sale.ProductDays,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sales = append(sales, sale)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

func getProductById(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		ProductID *int `json:"product_id"` // pointer allows null
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	var rows *sql.Rows
	var err error

	if payload.ProductID != nil {
		rows, err = db.Query(os.Getenv("GET_PRODUCT_BY_ID"), *payload.ProductID)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []MoreProductInfo

	for rows.Next() {
		var product MoreProductInfo
		if err := rows.Scan(
			&product.ID, &product.ProductPrice, &product.ProductWeight, &product.ProductWeightUnit,
			&product.ProductClass, &product.ProductBatch, &product.ProductDays,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		products = append(products, product)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func handleDhtData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var data struct {
		Temperature float64 `json:"temperature"`
		Humidity    float64 `json:"humidity"`
		CageNum     int     `json:"cage_num"`
	}

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Insert data into database
	stmt, err := db.Prepare("INSERT INTO cm_temperature (temp_temperature, temp_humidity, temp_cage_num) VALUES (?, ?, ?)")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	result, err := stmt.Exec(data.Temperature, data.Humidity, data.CageNum)
	if err != nil {
		http.Error(w, "Failed to insert data", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	response := map[string]interface{}{
		"success": true,
		"id":      id,
		"message": "Data received successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getBatchVitals(w http.ResponseWriter, r *http.Request, batchId string) {
	query := `SELECT Notes AS BatchName, StartDate, CurrentChicken AS CurrentPopulation, DATEDIFF(NOW(), StartDate) AS AgeInDays FROM cm_batches WHERE BatchID = ? LIMIT 1`
	row := db.QueryRow(query, batchId)
	var name, startDate string
	var currentPopulation, ageDays int
	err := row.Scan(&name, &startDate, &currentPopulation, &ageDays)
	if err != nil {
		http.Error(w, "Batch not found", http.StatusNotFound)
		return
	}
	resp := map[string]interface{}{
		"id":                batchId,
		"name":              name,
		"startDate":         startDate,
		"currentPopulation": currentPopulation,
		"ageDays":           ageDays,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": resp})
}

func getBatchCosts(w http.ResponseWriter, r *http.Request, batchId string) {
	query := `SELECT Date, CostType, Description, Amount FROM cm_production_cost WHERE BatchID = ? ORDER BY Date DESC`
	rows, err := db.Query(query, batchId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var costs []map[string]interface{}
	for rows.Next() {
		var date, costType, description string
		var amount float64
		if err := rows.Scan(&date, &costType, &description, &amount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		costs = append(costs, map[string]interface{}{
			"id":          date + costType + description, // simple id
			"date":        date,
			"type":        costType,
			"description": description,
			"amount":      amount,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": costs})
}

func getBatchEvents(w http.ResponseWriter, r *http.Request, batchId string) {
	query := os.Getenv("GET_EVENTS")
	rows, err := db.Query(query, batchId, batchId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var events []map[string]interface{}
	for rows.Next() {
		var date, event, details, qtyCount string
		if err := rows.Scan(&date, &event, &details, &qtyCount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		events = append(events, map[string]interface{}{
			"id":      date + event + details + qtyCount, // simple id
			"date":    date,
			"event":   event,
			"details": details,
			"qty":     qtyCount,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": events})
}

// PUT /batches/{id}/events
func updateBatchEvent(w http.ResponseWriter, r *http.Request, batchId string) {
	var payload struct {
		Date    string  `json:"Date"`
		Details string  `json:"Details"`
		Qty     float32 `json:"Qty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}
	// Find UsageID in cm_inventory_usage using payload fields
	var usageID int
	usageQuery := `SELECT UsageID FROM cm_inventory_usage WHERE BatchID = ? AND Date = ? LIMIT 1`
	err := db.QueryRow(usageQuery, batchId, payload.Date).Scan(&usageID)
	if err == nil {
		// Update the found UsageID
		updateQuery := `UPDATE cm_inventory_usage SET QuantityUsed = ? WHERE UsageID = ? AND BatchID = ?`
		res, err := db.Exec(updateQuery, payload.Qty, usageID, batchId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		rowsAffected, _ := res.RowsAffected()
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "rowsAffected": rowsAffected})
		return
	}
	// If not found, try to update in cm_mortality (Mortality)
	var mortalityID int
	mortalityQuery := `SELECT MortalityID FROM cm_mortality WHERE BatchID = ? AND Date = ? LIMIT 1`
	err2 := db.QueryRow(mortalityQuery, batchId, payload.Date).Scan(&mortalityID)
	if err2 == nil {
		updateMortality := `UPDATE cm_mortality SET BirdsLoss = ?, Notes = ? WHERE MortalityID = ? AND BatchID = ?`
		res2, err3 := db.Exec(updateMortality, payload.Qty, payload.Details, mortalityID, batchId)
		if err3 != nil {
			http.Error(w, err3.Error(), http.StatusInternalServerError)
			return
		}
		rowsAffected, _ := res2.RowsAffected()
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "rowsAffected": rowsAffected})
		return
	}
	http.Error(w, "Event not found for update", http.StatusNotFound)
}

func insertBatchEvent(w http.ResponseWriter, r *http.Request, batchId string) {
	// Decode JSON body
	var payload struct {
		Date    string  `json:"Date"`
		Event   string  `json:"Event"`
		Details string  `json:"Details"`
		Qty     float32 `json:"Qty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// assuming payload has Event, Details, Date, Qty
	var itemID int

	// derive category from the event
	var category string
	fmt.Println("Inserting event:", payload.Event, "Details:", payload.Details, "Date:", payload.Date, "Qty:", payload.Qty)
	switch payload.Event {
	case "Consumption":
		category = "Feed"
	case "Medication":
		category = "Medicine"
	case "Mortality":
		// handled below
	default:
		http.Error(w, "Unknown event type", http.StatusBadRequest)
		return
	}

	if payload.Event == "Consumption" || payload.Event == "Medication" {
		if payload.Details == "" {
			http.Error(w, "Details (item name) is required", http.StatusBadRequest)
			return
		}

		// Find item by name and its type to avoid mismatches
		itemQuery := `SELECT ItemID FROM cm_items WHERE ItemName = ? AND Category = ? LIMIT 1`
		err := db.QueryRow(itemQuery, payload.Details, category).Scan(&itemID)
		if err == sql.ErrNoRows {
			http.Error(w, "Item not found for usage", http.StatusBadRequest)
			return
		}
		if err != nil {
			http.Error(w, "Database error while fetching item", http.StatusInternalServerError)
			return
		}

		if payload.Date == "" {
			http.Error(w, "Date is required", http.StatusBadRequest)
			return
		}

		// validate qty
		if payload.Qty <= 0 {
			http.Error(w, "Qty must be greater than 0", http.StatusBadRequest)
			return
		}

		// If your column is literally named Date, consider renaming to UsageDate to avoid confusion
		sqlInsert := os.Getenv("INSERT_ITEM_USAGE")
		if sqlInsert == "" {
			http.Error(w, "missing INSERT_ITEM_USAGE env var", http.StatusInternalServerError)
			return
		}

		res, err := db.Exec(sqlInsert, batchId, itemID, payload.Date, payload.Qty)
		if err != nil {
			// log the SQL so you can confirm the table name being used
			log.Printf("Exec failed for INSERT_ITEM_USAGE: %q err=%v", sqlInsert, err)
			http.Error(w, "database insert failed", http.StatusInternalServerError)
			return
		}

		lastID, _ := res.LastInsertId()
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "insertedId": lastID})
		return
	}

	if payload.Event == "Mortality" {
		if payload.Date == "" {
			http.Error(w, "Date is required", http.StatusBadRequest)
			return
		}

		insertQuery := `INSERT INTO cm_mortality (BatchID, Date, BirdsLoss, Notes) VALUES (?, ?, ?, ?)`
		res, err := db.Exec(insertQuery, batchId, payload.Date, payload.Qty, payload.Details)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		lastID, _ := res.LastInsertId()
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "insertedId": lastID})
		return
	}
}

func deleteBatchEvent(w http.ResponseWriter, r *http.Request, batchId string) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var payload struct {
		ID   string `json:"id"`
		DATE string `json:"date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}
	// Try to delete from cm_inventory_usage first
	usageDel := `DELETE FROM cm_inventory_usage WHERE BatchID = ? AND Date = ?`
	res, err := db.Exec(usageDel, batchId, payload.DATE)
	if err == nil {
		rowsAffected, _ := res.RowsAffected()
		if rowsAffected > 0 {
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "rowsAffected": rowsAffected})
			return
		}
	}
	// If not found, try to delete from cm_mortality
	mortDel := `DELETE FROM cm_mortality WHERE BatchID = ? AND Date = ?`
	res2, err2 := db.Exec(mortDel, batchId, payload.DATE)
	if err2 == nil {
		rowsAffected2, _ := res2.RowsAffected()
		if rowsAffected2 > 0 {
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "rowsAffected": rowsAffected2})
			return
		}
	}
	http.Error(w, "Event not found for delete", http.StatusNotFound)
}

// Router for /batches/{id}/vitals, /events, /costs
func batchDetailsRouter(w http.ResponseWriter, r *http.Request) {
	// URL: /batches/{id}/vitals, /events, /costs
	path := r.URL.Path
	// Extract batchId and subpath
	// Example: /batches/1/vitals
	parts := splitPath(path)
	if len(parts) < 3 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	batchId := parts[1]
	sub := parts[2]

	switch sub {
	case "vitals":
		getBatchVitals(w, r, batchId)
	case "events":
		if r.Method == http.MethodPut {
			updateBatchEvent(w, r, batchId)
		} else if r.Method == http.MethodPost {
			insertBatchEvent(w, r, batchId)
		} else if r.Method == http.MethodDelete {
			deleteBatchEvent(w, r, batchId)
		} else {
			getBatchEvents(w, r, batchId)
		}
	case "costs":
		getBatchCosts(w, r, batchId)
	default:
		http.Error(w, "Not found", http.StatusNotFound)
	}
	// PUT /batches/{id}/events
}

func splitPath(path string) []string {
	// Remove leading/trailing slashes, split by /
	p := path
	if len(p) > 0 && p[0] == '/' {
		p = p[1:]
	}
	if len(p) > 0 && p[len(p)-1] == '/' {
		p = p[:len(p)-1]
	}
	return split(p, '/')
}

func split(s string, sep byte) []string {
	var out []string
	last := 0
	for i := 0; i < len(s); i++ {
		if s[i] == sep {
			out = append(out, s[last:i])
			last = i + 1
		}
	}
	out = append(out, s[last:])
	return out
}

func main() {
	initDB()
	http.HandleFunc("/batches/", withCORS(batchDetailsRouter))
	http.HandleFunc("/getUsers", withCORS(getUsers))
	http.HandleFunc("/getItemByType", withCORS(getItemByType))
	http.HandleFunc("/getBatches", withCORS(getBatches))
	http.HandleFunc("/getHarvests", withCORS(getHarvests))
	http.HandleFunc("/getSupplier", withCORS(getSupplier))
	http.HandleFunc("/getSales", withCORS(getSales))
	http.HandleFunc("/getSimpleSales", withCORS(getSimpleSales))
	http.HandleFunc("/getProducts", withCORS(getProducts))
	http.HandleFunc("/getProductInfo", withCORS(getProductById))
	http.HandleFunc("/api/dht22-data", withCORS(handleDhtData))

	server := &http.Server{
		Addr:         "0.0.0.0:8080",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Context that cancels on Ctrl+C or SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// Run the server in a goroutine so main can continue
	go func() {
		fmt.Println("Server running at http://0.0.0.0:8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe error: %v", err)
		}
	}()

	// Example background printer. Replace with whatever you want to print.
	go func() {
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
	}()

	// Block until a signal arrives
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
