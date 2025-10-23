// ESP8266 Client - 3 water sensors and 3 relays
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>

// Pins on NodeMCU
// Water sensors (digital) - D6=GPIO12, D7=GPIO13, D8=GPIO15
const uint8_t PIN_W1 = A0;
const uint8_t PIN_W2 = D7;
const uint8_t PIN_W3 = D2;
// Relays - D3=GPIO0, D4=GPIO2, D5=GPIO14
const uint8_t PIN_R1 = D3;
const uint8_t PIN_R2 = D4;
const uint8_t PIN_R3 = D5;

ESP8266WebServer server(80);

// WiFiManager custom parameters
// Enter the gateway base URL like http://192.168.1.60
char gatewayBaseUrl[64] = "";
// Optional human readable id
char clientId[32] = "client-1";

WiFiManager wm;
WiFiManagerParameter q1("gatewayBaseUrl", "Gateway Base URL (http://ip)", gatewayBaseUrl, sizeof(gatewayBaseUrl));
WiFiManagerParameter q2("clientId", "Client ID", clientId, sizeof(clientId));

int relay1 = 0, relay2 = 0, relay3 = 0;
const bool WATER_ACTIVE_LOW = true;

String selfBaseUrl() {
  IPAddress ip = WiFi.localIP();
  char buf[32];
  snprintf(buf, sizeof(buf), "http://%u.%u.%u.%u", ip[0], ip[1], ip[2], ip[3]);
  return String(buf);
}

bool httpPostJson(const String& url, const String& body) {
  WiFiClient client;
  HTTPClient http;
  if (!http.begin(client, url)) return false;
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  http.end();
  return code >= 200 && code < 300;
}

int readWater(uint8_t pin) {
  int v = analogRead(pin);
  return v;
}

void applyRelays() {
  digitalWrite(PIN_R1, relay1 ? HIGH : LOW);
  digitalWrite(PIN_R2, relay2 ? HIGH : LOW);
  digitalWrite(PIN_R3, relay3 ? HIGH : LOW);
}

void handleSetRelays() {
  if (server.method() == HTTP_OPTIONS) {
    enableCORS();
    server.send(204); // No content for preflight
    return;
  }

  if (server.method() != HTTP_POST) {
    enableCORS();
    server.send(405, "application/json", "{\"error\":\"method not allowed\"}");
    return;
  }

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    enableCORS();
    server.send(400, "application/json", "{\"error\":\"invalid json\"}");
    return;
  }

  if (doc.containsKey("relay1")) relay1 = doc["relay1"].as<int>();
  if (doc.containsKey("relay2")) relay2 = doc["relay2"].as<int>();
  if (doc.containsKey("relay3")) relay3 = doc["relay3"].as<int>();
  applyRelays();

  enableCORS();
  server.send(200, "application/json", "{\"success\":true}");
}

void enableCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleTelemetry() {
  StaticJsonDocument<256> t;
  t["water1"] = readWater(PIN_W1);
  t["water2"] = readWater(PIN_W2);
  t["water3"] = readWater(PIN_W3);
  t["relay1"] = relay1;
  t["relay2"] = relay2;
  t["relay3"] = relay3;
  String body;
  serializeJson(t, body);
  enableCORS();
  server.send(200, "application/json", body);
}

unsigned long lastPush = 0;
const unsigned long PUSH_INTERVAL_MS = 2000;

void updateTelemetry() {
  StaticJsonDocument<256> t;
  t["water1"] = readWater(PIN_W1);
  t["water2"] = readWater(PIN_W2);
  t["water3"] = readWater(PIN_W3);
  String body;
  serializeJson(t, body);
  enableCORS();
  server.send(200, "application/json", body);
}

void announceToGateway() {
  if (strlen(gatewayBaseUrl) == 0) return;
  StaticJsonDocument<192> d;
  d["id"] = clientId;
  d["baseUrl"] = selfBaseUrl();
  String body;
  serializeJson(d, body);
  // POST to gateway /register so it learns our baseUrl
  httpPostJson(String(gatewayBaseUrl) + "/register", body);
}

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(PIN_R1, OUTPUT);
  pinMode(PIN_R2, OUTPUT);
  pinMode(PIN_R3, OUTPUT);
  applyRelays();

  wm.resetSettings();
  if (!wm.autoConnect("ESP8266-Client")) {
    ESP.restart();
  }
  strncpy(gatewayBaseUrl, q1.getValue(), sizeof(gatewayBaseUrl) - 1);
  strncpy(clientId, q2.getValue(), sizeof(clientId) - 1);
  gatewayBaseUrl[sizeof(gatewayBaseUrl) - 1] = 0;
  clientId[sizeof(clientId) - 1] = 0;

  server.on("/set-relays", HTTP_POST, handleSetRelays);
  server.on("/telemetry", HTTP_GET, handleTelemetry);
  server.onNotFound([]() {
  if (server.method() == HTTP_OPTIONS) {
      enableCORS();
      server.send(204);
    } else {
      enableCORS();
      server.send(404, "application/json", "{\"error\":\"not found\"}");
    }
  });
  server.begin();

  announceToGateway();
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastPush >= PUSH_INTERVAL_MS) {
    lastPush = now;
    updateTelemetry();
  }
}
