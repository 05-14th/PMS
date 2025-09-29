// ESP8266 Client - 3 water sensors over 16-ch analog mux and 3 relays
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>

// ----- MUX wiring -----
const uint8_t MUX_S0 = D0;
const uint8_t MUX_S1 = D1;
const uint8_t MUX_S2 = D2;
const uint8_t MUX_S3 = D3;
const uint8_t MUX_SIG = A0;

// ----- Sensors -----
const uint8_t SENSOR_COUNT = 3;
const uint8_t SENSOR_CHANNEL[SENSOR_COUNT] = {0, 1, 2};

// ----- Relays -----
const uint8_t PIN_R1 = D4;
const uint8_t PIN_R2 = D5;
const uint8_t PIN_R3 = D6;

ESP8266WebServer server(80);

// WiFiManager custom parameters
char gatewayBaseUrl[64] = "";
char clientId[32] = "client-1";
WiFiManager wm;
WiFiManagerParameter q1("gatewayBaseUrl", "Gateway Base URL (http://ip)", gatewayBaseUrl, sizeof(gatewayBaseUrl));
WiFiManagerParameter q2("clientId", "Client ID", clientId, sizeof(clientId));

int relay1 = 0, relay2 = 0, relay3 = 0;

// ----- Filtering state -----
static int ema[SENSOR_COUNT] = {0, 0, 0};   // exponential average per sensor
static bool emaInit[SENSOR_COUNT] = {false, false, false};
const float EMA_ALPHA = 0.25f;              // 0..1 higher is more responsive

// ----- Helpers -----
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

void muxSelect(uint8_t channel) {
  channel &= 0x0F;
  digitalWrite(MUX_S0, (channel & 0x01) ? HIGH : LOW);
  digitalWrite(MUX_S1, (channel & 0x02) ? HIGH : LOW);
  digitalWrite(MUX_S2, (channel & 0x04) ? HIGH : LOW);
  digitalWrite(MUX_S3, (channel & 0x08) ? HIGH : LOW);
  delayMicroseconds(80);
}

// Median of 5 helper
int median5(int a, int b, int c, int d, int e) {
  int v[5] = {a, b, c, d, e};
  for (int i = 0; i < 4; i++) {
    for (int j = i + 1; j < 5; j++) {
      if (v[j] < v[i]) { int t = v[i]; v[i] = v[j]; v[j] = t; }
    }
  }
  return v[2];
}

// Raw ADC sample for one mux channel
int sampleADC(uint8_t channel) {
  muxSelect(channel);
  (void)analogRead(MUX_SIG);           // throwaway to settle
  delayMicroseconds(150);
  return analogRead(MUX_SIG);
}

// Stabilized reading for a mux channel
int readWaterStable(uint8_t channel) {
  // short burst with small delays to kill sparkle noise
  int s1 = sampleADC(channel);
  delayMicroseconds(200);
  int s2 = sampleADC(channel);
  delayMicroseconds(200);
  int s3 = sampleADC(channel);
  delayMicroseconds(200);
  int s4 = sampleADC(channel);
  delayMicroseconds(200);
  int s5 = sampleADC(channel);

  int med = median5(s1, s2, s3, s4, s5);

  // find sensor index for EMA state
  int idx = -1;
  for (uint8_t i = 0; i < SENSOR_COUNT; i++) {
    if (SENSOR_CHANNEL[i] == channel) { idx = i; break; }
  }
  if (idx < 0) return med;

  if (!emaInit[idx]) { ema[idx] = med; emaInit[idx] = true; }
  else {
    ema[idx] = (int)((1.0f - EMA_ALPHA) * ema[idx] + EMA_ALPHA * med);
  }

  // clamp to ADC range
  if (ema[idx] < 0) ema[idx] = 0;
  if (ema[idx] > 1023) ema[idx] = 1023;
  return ema[idx];
}

void applyRelays() {
  digitalWrite(PIN_R1, relay1 ? HIGH : LOW);
  digitalWrite(PIN_R2, relay2 ? HIGH : LOW);
  digitalWrite(PIN_R3, relay3 ? HIGH : LOW);
}

void enableCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ----- HTTP handlers -----
void handleSetRelays() {
  if (server.method() == HTTP_OPTIONS) { enableCORS(); server.send(204); return; }
  if (server.method() != HTTP_POST) { enableCORS(); server.send(405, "application/json", "{\"error\":\"method not allowed\"}"); return; }

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, server.arg("plain"))) { enableCORS(); server.send(400, "application/json", "{\"error\":\"invalid json\"}"); return; }

  if (doc.containsKey("relay1")) relay1 = doc["relay1"].as<int>();
  if (doc.containsKey("relay2")) relay2 = doc["relay2"].as<int>();
  if (doc.containsKey("relay3")) relay3 = doc["relay3"].as<int>();
  applyRelays();
  enableCORS();
  server.send(200, "application/json", "{\"success\":true}");
}

void handleTelemetry() {
  StaticJsonDocument<384> t;
  for (uint8_t i = 0; i < SENSOR_COUNT; i++) {
    char key[8];
    snprintf(key, sizeof(key), "water%u", i + 1);
    t[key] = readWaterStable(SENSOR_CHANNEL[i]);
  }
  t["relay1"] = relay1;
  t["relay2"] = relay2;
  t["relay3"] = relay3;

  String body;
  serializeJson(t, body);
  enableCORS();
  server.send(200, "application/json", body);
}

// Real time plain text stream for quick viewing
void handleTelemetryStream() {
  WiFiClient client = server.client();
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.sendHeader("Cache-Control", "no-cache");
  server.sendHeader("Connection", "keep-alive");
  enableCORS();
  server.send(200, "text/plain", "");

  const uint16_t period_ms = 200; // 5 Hz
  unsigned long nextTick = millis();
  while (client.connected()) {
    String line = "";
    line.reserve(64);
    line += "ts="; line += millis();
    for (uint8_t i = 0; i < SENSOR_COUNT; i++) {
      line += " water"; line += i + 1; line += "=";
      line += readWaterStable(SENSOR_CHANNEL[i]);
    }
    line += " r1="; line += relay1;
    line += " r2="; line += relay2;
    line += " r3="; line += relay3;
    line += "\n";
    server.sendContent(line);

    yield();
    unsigned long now = millis();
    if (now < nextTick) delay(nextTick - now);
    nextTick += period_ms;
  }
}

// ----- Gateway announce and push -----
void announceToGateway() {
  if (strlen(gatewayBaseUrl) == 0) return;
  StaticJsonDocument<192> d;
  d["id"] = clientId;
  d["baseUrl"] = selfBaseUrl();
  String body; serializeJson(d, body);
  httpPostJson(String(gatewayBaseUrl) + "/register", body);
}

unsigned long lastPush = 0;
const unsigned long PUSH_INTERVAL_MS = 2000;

void pushTelemetry() {
  if (strlen(gatewayBaseUrl) == 0) return;
  StaticJsonDocument<384> t;
  t["id"] = clientId;
  for (uint8_t i = 0; i < SENSOR_COUNT; i++) {
    char key[8];
    snprintf(key, sizeof(key), "water%u", i + 1);
    t[key] = readWaterStable(SENSOR_CHANNEL[i]);
  }
  String body; serializeJson(t, body);
  httpPostJson(String(gatewayBaseUrl) + "/telemetry", body);
}

// ----- Setup and loop -----
void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(MUX_S0, OUTPUT);
  pinMode(MUX_S1, OUTPUT);
  pinMode(MUX_S2, OUTPUT);
  pinMode(MUX_S3, OUTPUT);
  digitalWrite(MUX_S0, LOW);
  digitalWrite(MUX_S1, LOW);
  digitalWrite(MUX_S2, LOW);
  digitalWrite(MUX_S3, LOW);

  pinMode(PIN_R1, OUTPUT);
  pinMode(PIN_R2, OUTPUT);
  pinMode(PIN_R3, OUTPUT);
  applyRelays();

  wm.resetSettings(); // remove this if you want creds to persist
  wm.addParameter(&q1);
  wm.addParameter(&q2);
  if (!wm.autoConnect("ESP8266-Client")) { ESP.restart(); }
  strncpy(gatewayBaseUrl, q1.getValue(), sizeof(gatewayBaseUrl) - 1);
  strncpy(clientId, q2.getValue(), sizeof(clientId) - 1);
  gatewayBaseUrl[sizeof(gatewayBaseUrl) - 1] = 0;
  clientId[sizeof(clientId) - 1] = 0;

  server.on("/set-relays", HTTP_POST, handleSetRelays);
  server.on("/telemetry", HTTP_GET, handleTelemetry);
  server.on("/telemetry-stream", HTTP_GET, handleTelemetryStream);
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) { enableCORS(); server.send(204); }
    else { enableCORS(); server.send(404, "application/json", "{\"error\":\"not found\"}"); }
  });
  server.begin();

  announceToGateway();

  // First stable baseline print
  Serial.println("Ready. Stabilized readings will print below.");
}

void loop() {
  server.handleClient();

  // Print stabilized results to Serial at 5 Hz
  static unsigned long lastPrint = 0;
  unsigned long now = millis();
  if (now - lastPrint >= 200) {
    lastPrint = now;

    int v1 = readWaterStable(SENSOR_CHANNEL[0]);
    int v2 = readWaterStable(SENSOR_CHANNEL[1]);
    int v3 = readWaterStable(SENSOR_CHANNEL[2]);

    // Human friendly line
    Serial.print("Water1=");
    Serial.print(v1);
    Serial.print(" Water2=");
    Serial.print(v2);
    Serial.print(" Water3=");
    Serial.print(v3);
    Serial.print(" R1=");
    Serial.print(relay1);
    Serial.print(" R2=");
    Serial.print(relay2);
    Serial.print(" R3=");
    Serial.print(relay3);
    Serial.print(" ts=");
    Serial.println(now);
  }

  // Keep your push cadence
  if (now - lastPush >= PUSH_INTERVAL_MS) {
    lastPush = now;
    pushTelemetry();
  }
}
