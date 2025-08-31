package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
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
	ID           string `json:"ItemID"`
	Name         string `json:"ItemName"`
	Category     string `json:"Category"`
	Unit         string `json:"Unit"`
	Quantity     string `json:"Quantity"`
	UnitCost     string `json:"UnitCost"`
	SupplierName string `json:"SupplierName"`
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
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

func getItems(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(os.Getenv("GET_ITEMS"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []Items

	for rows.Next() {
		var item Items
		if err := rows.Scan(&item.ID, &item.Name, &item.Category, &item.Unit,
			&item.Quantity, &item.UnitCost, &item.SupplierName); err != nil {
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

func handleFeedMedsData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var data struct {
		ItemName string `json:"item_name"`
		Category string `json:"category"`
		Unit     string `json:"unit"`
		Quantity int    `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	stmt, err := db.Prepare(os.Getenv("INSERT_INVENTORY"))
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	result, err := stmt.Exec(data.ItemName, data.Category, data.Unit, data.Quantity, 0.0, 1) // Placeholder values for UnitCost and SupplierID
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

func handleUpdateMortality(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var data struct {
		MortalityID int `json:"mortality_id"`
		BirdsLoss   int `json:"birds_loss"`
	}

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	stmt, err := db.Prepare(os.Getenv("UPDATE_MORTALITY"))
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(data.BirdsLoss, data.MortalityID)
	if err != nil {
		http.Error(w, "Failed to update data", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Data updated successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
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
		getBatchEvents(w, r, batchId)
	case "costs":
		getBatchCosts(w, r, batchId)
	default:
		http.Error(w, "Not found", http.StatusNotFound)
	}
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

func main() {
	http.HandleFunc("/batches/", withCORS(batchDetailsRouter))
	initDB()
	http.HandleFunc("/getUsers", withCORS(getUsers)) // Wrap handler with CORS middleware
	http.HandleFunc("/getItems", withCORS(getItems))
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

	fmt.Println("Server running at http://0.0.0.0:8080")
	log.Fatal(server.ListenAndServe())
}
