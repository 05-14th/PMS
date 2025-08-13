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
	ID       string `json:"ItemID"`
	Name     string `json:"ItemName"`
	Category string `json:"Category"`
	Unit     string `json:"Unit"`
	Quantity string `json:"Quantity"`
	UnitCost string `json:"UnitCost"`
	SupId    int    `json:"SupplierID"`
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
			&item.Quantity, &item.UnitCost, &item.SupId); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
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

func main() {
	initDB()
	http.HandleFunc("/getUsers", withCORS(getUsers)) // Wrap handler with CORS middleware
	http.HandleFunc("/getItems", withCORS(getItems))
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
