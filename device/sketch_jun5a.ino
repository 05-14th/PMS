#include <ESP8266WiFi.h>
#include <WiFiManager.h>          // https://github.com/tzapu/WiFiManager
#include <ESP8266HTTPClient.h>
#include <DHT.h>

#define DHTPIN D7
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

// WiFiManager parameters
WiFiManager wifiManager;
char serverUrl[40] = "http://your-server-ip:8080"; // Default server URL
char cageNum[5] = "1"; // Default cage number (as string)

void setup() {
  Serial.begin(115200);
  delay(10);

  // Initialize DHT sensor
  dht.begin();

  // WiFiManager setup with custom parameters
  WiFiManagerParameter custom_server("server", "Server URL", serverUrl, 40);
  WiFiManagerParameter custom_cage("cage", "Cage Number (1-99)", cageNum, 3);
  
  wifiManager.addParameter(&custom_server);
  wifiManager.addParameter(&custom_cage);
  
  // Uncomment to reset settings - for testing
  // wifiManager.resetSettings();

  // Set config portal timeout
  wifiManager.setConfigPortalTimeout(180);

  // Start configuration portal
  if (!wifiManager.startConfigPortal("Chickmate Test 0", "capstone2025")) {
    Serial.println("Failed to connect and hit timeout");
    delay(3000);
    ESP.restart();
  }

  // If you get here, you're connected to WiFi
  Serial.println("Connected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Read updated parameters
  strncpy(serverUrl, custom_server.getValue(), sizeof(serverUrl));
  strncpy(cageNum, custom_cage.getValue(), sizeof(cageNum));
  
  Serial.print("Server URL: ");
  Serial.println(serverUrl);
  Serial.print("Cage Number: ");
  Serial.println(cageNum);
}

void loop() {
  delay(2000); // Delay between measurements
  
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.print("%\t");
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println("°C");

  // Send data to server
  sendToServer(temperature, humidity);
}

void sendToServer(float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }

  HTTPClient http;
  WiFiClient client;

  String url = String(serverUrl) + "/api/dht22-data";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload with configured cage number
  String payload = "{\"temperature\":" + String(temperature) + 
                  ",\"humidity\":" + String(humidity) + 
                  ",\"cage_num\":" + String(cageNum) + "}";

  // Send HTTP POST request
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Server response: ");
    Serial.println(response);
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
    Serial.println("Connection to server failed");
    
    // Print the URL that failed for debugging
    Serial.print("Attempted URL: ");
    Serial.println(url);
  }
  
  http.end();
}