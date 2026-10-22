/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║       SilentAlert — Arduino Nano Firmware v2             ║
 * ║   MAX4466 Microphone → dB Reading → USB Serial JSON      ║
 * ║   Wokwi Simulation: Potentiometer → A0 (simulates mic)  ║
 * ║                                                          ║
 * ║  WIRING (Real Hardware):                                 ║
 * ║    MAX4466 VCC → 5V | GND → GND | OUT → A0              ║
 * ║                                                          ║
 * ║  WIRING (Wokwi Simulation):                              ║
 * ║    Potentiometer VCC → 5V | GND → GND | SIG → A0        ║
 * ║    Red LED    → D13 (CRITICAL >70dB)                     ║
 * ║    Yellow LED → D12 (WARNING  60-70dB)                   ║
 * ║    Green LED  → D11 (NORMAL   <60dB)                     ║
 * ╚══════════════════════════════════════════════════════════╝
 */

// ─── Zone Config ──────────────────────────────────────────
// Change to: "Library" | "Classroom" | "Lab" | "ConferenceRoom"
const char* ZONE_NAME = "Library";

// ─── Pin Config ───────────────────────────────────────────
const int MIC_PIN      = A0;   // MAX4466 OUT (or Potentiometer SIG in Wokwi)
const int LED_CRITICAL = 13;   // Red LED   — dB >= 70
const int LED_WARNING  = 12;   // Yellow LED — dB 60–70
const int LED_NORMAL   = 11;   // Green LED  — dB < 60

// ─── Timing ───────────────────────────────────────────────
const int SAMPLE_MS  = 100;    // Sample window per reading
const int SEND_DELAY = 2000;   // Send JSON every 2 seconds

// ─── Calibration ──────────────────────────────────────────
const float REF_VOLTAGE = 5.0;
const float MIC_REF     = 0.00631;
const float DB_OFFSET   = 20.0;

// ─── Globals ──────────────────────────────────────────────
unsigned long lastSend = 0;

// ──────────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);
  delay(200);

  pinMode(LED_CRITICAL, OUTPUT);
  pinMode(LED_WARNING,  OUTPUT);
  pinMode(LED_NORMAL,   OUTPUT);

  // Boot sequence — all LEDs flash once
  digitalWrite(LED_CRITICAL, HIGH);
  digitalWrite(LED_WARNING,  HIGH);
  digitalWrite(LED_NORMAL,   HIGH);
  delay(500);
  digitalWrite(LED_CRITICAL, LOW);
  digitalWrite(LED_WARNING,  LOW);
  digitalWrite(LED_NORMAL,   LOW);

  Serial.println("# ==========================================");
  Serial.println("# SilentAlert Arduino Nano - Ready");
  Serial.print("# Zone: ");
  Serial.println(ZONE_NAME);
  Serial.println("# Turn potentiometer to change noise level");
  Serial.println("# JSON sent every 2 seconds to serial-bridge");
  Serial.println("# ==========================================");
}

// ─── Read dB from MAX4466 (or Potentiometer in Wokwi) ─────
float readDecibels() {
  unsigned long start = millis();
  float maxVal = 0;
  float minVal = 1023;

  while (millis() - start < SAMPLE_MS) {
    int raw = analogRead(MIC_PIN);
    if (raw > maxVal) maxVal = raw;
    if (raw < minVal) minVal = raw;
  }

  float peakToPeak = maxVal - minVal;
  if (peakToPeak < 1) peakToPeak = 1;

  float voltage = (peakToPeak / 1023.0) * REF_VOLTAGE;
  float dB = 20.0 * log10(voltage / MIC_REF) + DB_OFFSET;

  // Clamp to realistic range
  if (dB < 30.0)  dB = 30.0;
  if (dB > 120.0) dB = 120.0;

  return dB;
}

// ─── Update Status LEDs ───────────────────────────────────
void updateLEDs(float dB) {
  if (dB >= 70.0) {
    // CRITICAL — Red blinks fast
    digitalWrite(LED_CRITICAL, (millis() / 200) % 2);
    digitalWrite(LED_WARNING,  LOW);
    digitalWrite(LED_NORMAL,   LOW);
  } else if (dB >= 60.0) {
    // WARNING — Yellow solid
    digitalWrite(LED_CRITICAL, LOW);
    digitalWrite(LED_WARNING,  HIGH);
    digitalWrite(LED_NORMAL,   LOW);
  } else {
    // NORMAL — Green solid
    digitalWrite(LED_CRITICAL, LOW);
    digitalWrite(LED_WARNING,  LOW);
    digitalWrite(LED_NORMAL,   HIGH);
  }
}

// ─── Send JSON to Serial (bridge picks it up) ─────────────
void sendJSON(float dB) {
  float lib = 0, cls = 0, lab = 0, conf = 0;

  if (strcmp(ZONE_NAME, "Library") == 0)        lib  = dB;
  if (strcmp(ZONE_NAME, "Classroom") == 0)      cls  = dB;
  if (strcmp(ZONE_NAME, "Lab") == 0)            lab  = dB;
  if (strcmp(ZONE_NAME, "ConferenceRoom") == 0) conf = dB;

  Serial.print("{");
  Serial.print("\"Library\":");        Serial.print(lib, 1);  Serial.print(",");
  Serial.print("\"Classroom\":");      Serial.print(cls, 1);  Serial.print(",");
  Serial.print("\"Lab\":");            Serial.print(lab, 1);  Serial.print(",");
  Serial.print("\"ConferenceRoom\":"); Serial.print(conf, 1); Serial.print(",");
  Serial.print("\"averageDecibel\":"); Serial.print(dB, 1);   Serial.print(",");
  Serial.print("\"zoneName\":\"");     Serial.print(ZONE_NAME); Serial.print("\",");
  Serial.print("\"deviceId\":\"NANO_WOKWI\"");
  Serial.println("}");
}

// ──────────────────────────────────────────────────────────
void loop() {
  float dB = readDecibels();

  // Update LEDs based on dB level
  updateLEDs(dB);

  // Debug output (bridge.js ignores lines starting with #)
  Serial.print("# dB: ");
  Serial.print(dB, 1);
  Serial.print("  | Status: ");
  if (dB >= 70) Serial.println("CRITICAL");
  else if (dB >= 60) Serial.println("WARNING");
  else Serial.println("NORMAL");

  // Send JSON every SEND_DELAY ms
  if (millis() - lastSend >= SEND_DELAY) {
    sendJSON(dB);
    lastSend = millis();
  }

  delay(50);
}
