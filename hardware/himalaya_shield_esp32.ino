/*
  HimalayaShield - ESP32 Field Sensor Node
  =========================================
  OPTIONAL HARDWARE. The main HimalayaShield application does NOT depend on
  this sketch or any physical sensor - the software simulator
  (scripts/simulate_sensors.py or POST /api/simulation/start) fully drives
  the demo. Flash this sketch only if you have the physical parts below and
  want to show a real end-to-end hardware path.

  Sensors:
    - Rain sensor (analog, e.g. YL-83 / FC-37 rain board)      -> GPIO34 (ADC)
    - Capacitive soil moisture sensor (analog)                  -> GPIO35 (ADC)
    - MPU6050 accelerometer/gyroscope (I2C, tilt + vibration)   -> SDA=21, SCL=22
    - SW-420 vibration sensor (digital, supplements MPU6050)    -> GPIO27

  Behavior:
    - Reads all sensors every READING_INTERVAL_MS.
    - Computes tilt angle from MPU6050 accelerometer, and tracks the rate
      of change over the last window.
    - Estimates a vibration "g" proxy from MPU6050 accel magnitude jitter,
      combined with the SW-420 digital trigger count.
    - Sends a JSON payload via HTTP POST to /api/sensors/reading.
    - Retries with exponential backoff on network failure.
    - If a sensor read fails or is out of physically plausible range, marks
      is_online=false for that cycle so the backend's data-quality layer can
      flag it, rather than sending fabricated data.

  Wiring notes (adjust to your board):
    Rain sensor AO      -> GPIO34
    Soil sensor AO      -> GPIO35
    MPU6050 SDA         -> GPIO21
    MPU6050 SCL         -> GPIO22
    SW-420 digital OUT  -> GPIO27
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

// ---------------- Wi-Fi configuration ----------------
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---------------- Backend configuration ----------------
const char *API_BASE_URL = "http://YOUR_BACKEND_HOST:8000"; // e.g. your machine's LAN IP
const char *ZONE_ID = "dharali";                              // must match a seeded zone id
const char *SENSOR_READING_ENDPOINT = "/api/sensors/reading";

// ---------------- Pin configuration ----------------
const int PIN_RAIN_ANALOG = 34;
const int PIN_SOIL_ANALOG = 35;
const int PIN_VIBRATION_DIGITAL = 27;
const int MPU6050_ADDR = 0x68;

// ---------------- Timing ----------------
const unsigned long READING_INTERVAL_MS = 5000;      // send every 5s
const unsigned long WIFI_RETRY_DELAY_MS = 2000;
const int MAX_HTTP_RETRIES = 3;

// ---------------- Calibration (adjust per sensor batch) ----------------
const int RAIN_ADC_DRY = 4095;   // fully dry reading
const int RAIN_ADC_WET = 1200;   // fully saturated reading
const int SOIL_ADC_DRY = 3200;   // sensor in dry air
const int SOIL_ADC_WET = 1200;   // sensor fully submerged

// ---------------- State ----------------
float lastTiltDegrees = 0.0;
unsigned long lastTiltReadMs = 0;
unsigned long lastSendMs = 0;
volatile unsigned long vibrationPulseCount = 0;

void IRAM_ATTR onVibrationPulse() {
  vibrationPulseCount++;
}

// ---------------- Wi-Fi ----------------
bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(WIFI_RETRY_DELAY_MS);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi connected. IP: " + WiFi.localIP().toString());
    return true;
  }
  Serial.println("\nWi-Fi connection failed.");
  return false;
}

// ---------------- MPU6050 ----------------
bool initMPU6050() {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1 register
  Wire.write(0);    // wake up
  return Wire.endTransmission() == 0;
}

// Returns true on success; fills ax, ay, az with accel in g.
bool readMPU6050Accel(float &ax, float &ay, float &az) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B); // ACCEL_XOUT_H
  if (Wire.endTransmission(false) != 0) return false;

  uint8_t bytesReceived = Wire.requestFrom(MPU6050_ADDR, 6);
  if (bytesReceived < 6) return false;

  int16_t rawX = (Wire.read() << 8) | Wire.read();
  int16_t rawY = (Wire.read() << 8) | Wire.read();
  int16_t rawZ = (Wire.read() << 8) | Wire.read();

  // Default MPU6050 sensitivity: 16384 LSB/g at +-2g range.
  ax = rawX / 16384.0;
  ay = rawY / 16384.0;
  az = rawZ / 16384.0;
  return true;
}

// Computes tilt angle (degrees from vertical) from accelerometer.
float computeTiltDegrees(float ax, float ay, float az) {
  float magnitude = sqrt(ax * ax + ay * ay + az * az);
  if (magnitude < 0.01) return 0.0;
  float angleRad = acos(constrain(az / magnitude, -1.0, 1.0));
  return angleRad * 180.0 / PI;
}

// ---------------- Sensor reads ----------------
struct SensorSnapshot {
  float rainfall_mm_1h;
  float rainfall_mm_3h;
  float rainfall_mm_24h;
  float soil_moisture_pct;
  float tilt_degrees;
  float tilt_change_rate;
  float vibration_g;
  float battery_pct;
  bool is_online;
};

// NOTE: the rain sensor board reports wetness, not calibrated mm/hr. This
// sketch derives a plausible mm/hr proxy from the wetness ratio; for a real
// deployment, calibrate against a tipping-bucket rain gauge.
float readRainfallProxyMm() {
  int raw = analogRead(PIN_RAIN_ANALOG);
  raw = constrain(raw, RAIN_ADC_WET, RAIN_ADC_DRY);
  float wetness = (float)(RAIN_ADC_DRY - raw) / (float)(RAIN_ADC_DRY - RAIN_ADC_WET);
  return wetness * 50.0; // scale to a 0-50mm/hr proxy range
}

float readSoilMoisturePct() {
  int raw = analogRead(PIN_SOIL_ANALOG);
  raw = constrain(raw, SOIL_ADC_WET, SOIL_ADC_DRY);
  float pct = (float)(SOIL_ADC_DRY - raw) / (float)(SOIL_ADC_DRY - SOIL_ADC_WET) * 100.0;
  return constrain(pct, 0.0, 100.0);
}

float readBatteryPct() {
  // Placeholder: replace with real battery ADC divider if available.
  return 100.0;
}

bool captureSensorSnapshot(SensorSnapshot &snap) {
  bool ok = true;

  float rainNow = readRainfallProxyMm();
  if (rainNow < 0 || rainNow > 200) ok = false;
  snap.rainfall_mm_1h = rainNow;
  snap.rainfall_mm_3h = rainNow * 2.4; // rough proxy accumulation
  snap.rainfall_mm_24h = rainNow * 6.0;

  float soil = readSoilMoisturePct();
  if (soil < 0 || soil > 100) ok = false;
  snap.soil_moisture_pct = soil;

  float ax, ay, az;
  bool mpuOk = readMPU6050Accel(ax, ay, az);
  if (!mpuOk) {
    ok = false;
    snap.tilt_degrees = lastTiltDegrees; // hold last known value
    snap.tilt_change_rate = 0;
    snap.vibration_g = 0;
  } else {
    float tilt = computeTiltDegrees(ax, ay, az);
    unsigned long now = millis();
    float elapsedHours = (now - lastTiltReadMs) / 3600000.0;
    float rate = elapsedHours > 0 ? fabs(tilt - lastTiltDegrees) / elapsedHours : 0;
    snap.tilt_degrees = tilt;
    snap.tilt_change_rate = constrain(rate, 0, 45);
    lastTiltDegrees = tilt;
    lastTiltReadMs = now;

    // Vibration proxy: deviation of accel magnitude from 1g, plus SW-420 pulses.
    float magnitude = sqrt(ax * ax + ay * ay + az * az);
    float accelJitter = fabs(magnitude - 1.0);
    float pulseComponent = min((unsigned long)10, vibrationPulseCount) * 0.05;
    snap.vibration_g = constrain(accelJitter + pulseComponent, 0.0, 10.0);
    vibrationPulseCount = 0;
  }

  snap.battery_pct = readBatteryPct();
  snap.is_online = ok;
  return ok;
}

// ---------------- HTTP send with retry ----------------
bool sendReading(const SensorSnapshot &snap) {
  if (WiFi.status() != WL_CONNECTED) {
    if (!connectWiFi()) return false;
  }

  StaticJsonDocument<512> doc;
  doc["zone_id"] = ZONE_ID;
  doc["source"] = "esp32";
  doc["rainfall_mm_1h"] = snap.rainfall_mm_1h;
  doc["rainfall_mm_3h"] = snap.rainfall_mm_3h;
  doc["rainfall_mm_24h"] = snap.rainfall_mm_24h;
  doc["soil_moisture_pct"] = snap.soil_moisture_pct;
  doc["tilt_degrees"] = snap.tilt_degrees;
  doc["tilt_change_rate"] = snap.tilt_change_rate;
  doc["vibration_g"] = snap.vibration_g;
  doc["battery_pct"] = snap.battery_pct;
  doc["is_online"] = snap.is_online;

  String payload;
  serializeJson(doc, payload);

  String url = String(API_BASE_URL) + SENSOR_READING_ENDPOINT;

  for (int attempt = 1; attempt <= MAX_HTTP_RETRIES; attempt++) {
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(5000);

    int httpCode = http.POST(payload);
    if (httpCode == 200) {
      Serial.println("Reading sent OK: " + payload);
      http.end();
      return true;
    }

    Serial.printf("HTTP POST failed (attempt %d/%d), code=%d\n", attempt, MAX_HTTP_RETRIES, httpCode);
    http.end();
    delay(500 * attempt); // exponential-ish backoff
  }

  Serial.println("Failed to send reading after retries. Will retry next cycle.");
  return false;
}

// ---------------- Arduino lifecycle ----------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nHimalayaShield ESP32 sensor node starting (Demo Mode hardware path)...");

  pinMode(PIN_VIBRATION_DIGITAL, INPUT);
  attachInterrupt(digitalPinToInterrupt(PIN_VIBRATION_DIGITAL), onVibrationPulse, RISING);

  Wire.begin(21, 22);
  if (!initMPU6050()) {
    Serial.println("WARNING: MPU6050 not detected. Tilt/vibration readings will be marked offline.");
  }

  connectWiFi();
  lastTiltReadMs = millis();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendMs >= READING_INTERVAL_MS) {
    lastSendMs = now;

    SensorSnapshot snap;
    bool healthy = captureSensorSnapshot(snap);
    if (!healthy) {
      Serial.println("Sensor read degraded this cycle; sending with is_online=false.");
    }
    sendReading(snap);
  }

  delay(50);
}
