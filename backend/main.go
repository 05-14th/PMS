package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

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
	Name     string `json:"material_name"`
	Desc     string `json:"material_desc"`
	Quantity string `json:"material_quantity"`
	Unit     string `json:"material_unit"`
	Class    string `json:"material_class"`
	Date     string `json:"purchase_date"`
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
		if err := rows.Scan(&item.Name, &item.Desc, &item.Quantity,
			&item.Unit, &item.Class, &item.Date); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func getSales(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(os.Getenv("GET_SALES"))
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

func main() {
	initDB()
	http.HandleFunc("/getUsers", withCORS(getUsers)) // Wrap handler with CORS middleware
	http.HandleFunc("/getItems", withCORS(getItems))
	http.HandleFunc("/getSales", withCORS(getSales))
	fmt.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
