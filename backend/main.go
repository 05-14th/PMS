package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"io"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// Database configuration
const (
	DBName     = "chickmate_poultrydb"
	TableUsers = "cm_users"
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

type RegisterRequest struct {
	Username    string `json:"username"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Suffix      string `json:"suffix"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phoneNumber"`
	Password    string `json:"password"`
	Role        string `json:"role"`
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
		if err := rows.Scan(&batch.ID, &batch.TotalChicken, &batch.CurrentChicken, &batch.StartDate,
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

func registerUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	err := r.ParseMultipartForm(10 << 20) // 10 MB max file size
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Error parsing form data: " + err.Error(),
		})
		return
	}

	username := r.FormValue("username")
	firstName := r.FormValue("firstName")
	lastName := r.FormValue("lastName")
	suffix := r.FormValue("suffix")
	email := r.FormValue("email")
	phoneNumber := r.FormValue("phoneNumber")
	password := r.FormValue("password")
	role := r.FormValue("role")

	if username == "" || firstName == "" || lastName == "" || email == "" || phoneNumber == "" || password == "" || role == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "All fields are required",
		})
		return
	}

	file, handler, err := r.FormFile("profilePic")
	var profilePicPath string
	if err == nil {
		defer file.Close()

		ext := filepath.Ext(handler.Filename)
		profilePicPath = fmt.Sprintf("uploads/profile_%d%s", time.Now().UnixNano(), ext)

		if _, err := os.Stat("uploads"); os.IsNotExist(err) {
			os.Mkdir("uploads", 0755)
		}

		dst, err := os.Create(profilePicPath)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   "Error saving profile picture",
			})
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"error":   "Error saving profile picture",
			})
			return
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Error hashing password",
		})
		return
	}

	fullName := firstName + " " + lastName
	if suffix != "" {
		fullName += " " + suffix
	}

	query := `INSERT INTO ` + TableUsers + ` 
		  (username, first_name, last_name, suffix, email, phone_number, password, role, profile_pic, created_at) 
		  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`

	_, err = db.Exec(query,
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
		if profilePicPath != "" {
			os.Remove(profilePicPath)
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "Error creating user: " + err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "User registered successfully",
	})
}

func main() {
	initDB()
	// Add CORS middleware to all routes
	corsHandler := func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
			if r.Method == "OPTIONS" {
				return
			}
			h.ServeHTTP(w, r)
		})
	}

	http.Handle("/api/register", corsHandler(http.HandlerFunc(registerUser)))
	http.HandleFunc("/getUsers", withCORS(getUsers))
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
