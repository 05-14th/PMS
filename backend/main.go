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
	rows, err := db.Query("SELECT usr_fullname, usr_username, usr_role, usr_status FROM cm_users")
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

func main() {
	initDB()
	http.HandleFunc("/getUsers", withCORS(getUsers)) // Wrap handler with CORS middleware
	fmt.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
