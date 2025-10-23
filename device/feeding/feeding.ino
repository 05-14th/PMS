#include <ESP8266WiFi.h>
#include <WiFiManager.h>          // https://github.com/tzapu/WiFiManager
#include <ESP8266HTTPClient.h>
#include <Servo.h>
// Add web server for API
#include <ESP8266WebServer.h>
ESP8266WebServer server(80);

// Connect to Analog Multiplexer (CD74HC4067) for weight resistors
// S0= D1, S1=D2, S2=D3, S3
#define S0 D0
#define S1 D1  
#define S2 D2
#define S3 D3
#define SIG_PIN A0  // Common pin for all sensors
#define NUM_SENSORS 3

// Servo pins
// Servo 1 - D5
// Servo 2 - D6
// Servo 3 - D7
// Servo 4 - D8

Servo servo1;
Servo servo2;
Servo servo3;
Servo servo4;

// WiFiManager parameters  
WiFiManager wm;
char serverUrl[40] = "http://your-server-ip:8080"; // Default server URL


void setup(){
    Serial.begin(115200);
    delay(10);
    
    // WiFiManager setup with custom parameters
    WiFiManagerParameter custom_server("server", "Server URL", serverUrl, 40);
    wm.addParameter(&custom_server);

    // Uncomment to reset settings - for testing
    //wm.resetSettings();
    
    // Set config portal timeout
    wm.setConfigPortalTimeout(180);
    
    // Start configuration portal
    if (!wm.startConfigPortal("WateringSystem", "capstone2025")) {
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
    Serial.print("Server URL: ");
    Serial.println(serverUrl);

    // Setup multiplexer control pins
    pinMode(S0, OUTPUT);
    pinMode(S1, OUTPUT);
    pinMode(S2, OUTPUT);
    pinMode(S3, OUTPUT);
    digitalWrite(S0, LOW);
    digitalWrite(S1, LOW);
    digitalWrite(S2, LOW);
    digitalWrite(S3, LOW); 

    // Attach servos
    servo1.attach(D5);
    servo2.attach(D6);
    servo3.attach(D7);
    servo4.attach(D8);

    // Initialize servos to 0 degrees (off position)
    servo1.write(0);
    servo2.write(0);
    servo3.write(0);
    servo4.write(0);

    // Register rotation API endpoint
    server.on("/rotate-servo", HTTP_POST, []() {
        if (server.method() != HTTP_POST) {
            server.send(405, "text/plain", "Method Not Allowed");
            return;
        }
        String body = server.arg("plain");
        int angle = 0;
        int idx = body.indexOf("angle");
        if (idx != -1) {
            int colon = body.indexOf(":", idx);
            int comma = body.indexOf(",", colon);
            if (comma == -1) comma = body.length();
            String angleStr = body.substring(colon + 1, comma);
            angle = angleStr.toInt();
        }
        servo4.write(angle);
        server.send(200, "application/json", "{\"success\":true,\"angle\":" + String(angle) + "}");
        delay(3000);

        if(angle == 60){
            servo1.write(90); // Open the valve
            delay(1000); // Keep the valve open for 1 second
            servo1.write(0); // Close the valve
        } else if(angle == 120){
            servo2.write(90);
            delay(1000); // Keep the valve open for 1 second
            servo2.write(0); // Close the valve
        } else if(angle == 90){
            servo3.write(90);
            delay(1000); // Keep the valve open for 1 second
            servo3.write(0); // Close the valve
        }

        angle = 90;
        servo4.write(angle);
    });
    server.begin();
}

void rotateD4Srvo(int angle) {
    servo4.write(angle);
}

void loop(){
    server.handleClient();
    delay(2000); // Delay between measurements

    // Read CH-0 to CH-2 of the multiplexer
    int sensorValues[NUM_SENSORS];
    for (int i = 0; i < NUM_SENSORS; i++) {
        // Set multiplexer address
        digitalWrite(S0, (i & 0x01) ? HIGH : LOW);
        digitalWrite(S1, (i & 0x02) ? HIGH : LOW);
        digitalWrite(S2, (i & 0x04) ? HIGH : LOW);
        digitalWrite(S3, (i & 0x08) ? HIGH : LOW);
        delay(10); // Allow settling time
        sensorValues[i] = analogRead(SIG_PIN);
    }

    Serial.print("Sensor Values: ");
    for (int i = 0; i < NUM_SENSORS; i++) {
        Serial.print("CH-");
        Serial.print(i);
        Serial.print(": ");
        Serial.print(sensorValues[i]);
        if (i < NUM_SENSORS - 1) Serial.print(", ");
    }
    
    Serial.println();
    // Send data to server
    sendToServer(sensorValues);
}

void sendToServer(int* sensorValues) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected!");
        return;
    }
    WiFiClient client;
    HTTPClient http;
    if (!http.begin(client, String(serverUrl) + "/upload")) {
        Serial.println("Failed to connect to server");
        return;
    }
    http.addHeader("Content-Type", "application/json");
    String payload = "{";
    for (int i = 0; i < NUM_SENSORS; i++) {
        payload += "\"sensor" + String(i) + "\":" + String(sensorValues[i]);
        if (i < NUM_SENSORS - 1) payload += ",";
    }
    payload += "}";
    int httpResponseCode = http.POST(payload);
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("Server response: ");
        Serial.println(response);
    } else {
        Serial.print("Error on sending POST: ");
        Serial.println(httpResponseCode);
    }
    http.end();
}