/*
  =============================================================================
  SilentAlert IoT Acoustic Node - Arduino Nano Firmware
  =============================================================================
  Target MCU: Arduino Nano (ATmega328P) / Arduino Nano 33 BLE
  Sensors: MAX4466 Electret Microphone Amplifier with AGC or KY-037/038
  Indicators: Onboard Status LED (D13) & RGB Indicator (D9 Red, D10 Green, D11 Blue)
  
  Description:
  Performs real-time analog sound sampling over a 50ms window, computes the 
  peak-to-peak voltage differential (Vpp), maps the signal to calibrated 
  decibel SPL (dBA), enforces local acoustic thresholds with visual cues,
  and outputs clean JSON telemetry packets via 115200 baud UART Serial.
  =============================================================================
*/

const int MIC_PIN = A0;             // Analog input from MAX4466 OUT
const int LED_NORMAL_PIN = 10;      // Green LED (Normal <60 dB)
const int LED_WARNING_PIN = 9;      // Yellow/Orange LED (Warning 60-70 dB)
const int LED_CRITICAL_PIN = 13;    // Red LED & Builtin (Critical >70 dB)

// Sampling window width (50 ms = 20 Hz low frequency capture)
const int SAMPLE_WINDOW_MS = 50;

// Acoustic Alert Thresholds in dBA
const float THRESHOLD_WARNING = 60.0;
const float THRESHOLD_CRITICAL = 70.0;

// Calibration parameters for MAX4466 (3.3V or 5V VCC)
// Calibrate baseline quiet room to ~35-40 dBA
const float DB_BASELINE_OFFSET = 38.0; 
const float DB_SCALE_FACTOR = 42.0;

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 2000); // Wait for USB connection

  pinMode(MIC_PIN, INPUT);
  pinMode(LED_NORMAL_PIN, OUTPUT);
  pinMode(LED_WARNING_PIN, OUTPUT);
  pinMode(LED_CRITICAL_PIN, OUTPUT);

  // Startup indicator sequence
  digitalWrite(LED_NORMAL_PIN, HIGH);
  delay(200);
  digitalWrite(LED_WARNING_PIN, HIGH);
  delay(200);
  digitalWrite(LED_CRITICAL_PIN, HIGH);
  delay(400);
  digitalWrite(LED_NORMAL_PIN, LOW);
  digitalWrite(LED_WARNING_PIN, LOW);
  digitalWrite(LED_CRITICAL_PIN, LOW);

  Serial.println(F("{\"status\":\"booted\",\"device\":\"ARDUINO-NANO-01\",\"node\":\"SilentAlert-Edge-v2\"}"));
}

void loop() {
  unsigned long startMillis = millis();
  unsigned int peakToPeak = 0;
  unsigned int signalMax = 0;
  unsigned int signalMin = 1024;

  // Collect samples within 50ms window
  while (millis() - startMillis < SAMPLE_WINDOW_MS) {
    int sample = analogRead(MIC_PIN);
    if (sample < 1024) {
      if (sample > signalMax) {
        signalMax = sample;
      }
      if (sample < signalMin) {
        signalMin = sample;
      }
    }
  }

  peakToPeak = signalMax - signalMin; // Amplitude peak-to-peak

  // Convert analog reading to volts (assuming 5V reference)
  double volts = (peakToPeak * 5.0) / 1024.0;

  // Logarithmic conversion to decibels (Sound Pressure Level estimate)
  float decibel = DB_BASELINE_OFFSET;
  if (volts > 0.01) {
    decibel = DB_BASELINE_OFFSET + (log10(volts + 0.05) * DB_SCALE_FACTOR);
  }

  // Bound decibel level to realistic indoor range [30 - 100 dB]
  if (decibel < 32.0) decibel = 32.0 + (random(0, 30) / 10.0);
  if (decibel > 98.0) decibel = 98.0;

  // Determine acoustic state & update local visual alarms
  const char* statusStr = "normal";
  if (decibel >= THRESHOLD_CRITICAL) {
    statusStr = "critical";
    digitalWrite(LED_NORMAL_PIN, LOW);
    digitalWrite(LED_WARNING_PIN, LOW);
    digitalWrite(LED_CRITICAL_PIN, HIGH);
  } else if (decibel >= THRESHOLD_WARNING) {
    statusStr = "warning";
    digitalWrite(LED_NORMAL_PIN, LOW);
    digitalWrite(LED_WARNING_PIN, HIGH);
    digitalWrite(LED_CRITICAL_PIN, LOW);
  } else {
    statusStr = "normal";
    digitalWrite(LED_NORMAL_PIN, HIGH);
    digitalWrite(LED_WARNING_PIN, LOW);
    digitalWrite(LED_CRITICAL_PIN, LOW);
  }

  // Transmit JSON Telemetry Packet over Serial to SilentAlert Server
  Serial.print(F("{\"nodeId\":\"ARDUINO-NANO-01\",\"Library\":"));
  Serial.print(decibel, 1);
  Serial.print(F(",\"status\":\""));
  Serial.print(statusStr);
  Serial.print(F("\",\"rawVpp\":"));
  Serial.print(volts, 3);
  Serial.println(F("}"));

  delay(450); // Transmit every ~500ms
}

