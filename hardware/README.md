# 🎙️ SilentAlert IoT Acoustic Edge Node (Arduino Nano)

This directory contains the production-ready firmware and telemetry bridge connecting physical **Arduino Nano** hardware to the **SilentAlert Web Platform**.

---

## 🛠️ Hardware Requirements

| Component | Quantity | Purpose |
| :--- | :---: | :--- |
| **Arduino Nano** (ATmega328P or BLE Sense) | 1 | Microcontroller running edge sampling loop |
| **MAX4466 Electret Microphone with AGC** | 1 | Sound sensor with adjustable gain |
| **LED Indicators** (Green, Yellow, Red) | 3 | Real-time on-node acoustic status indication |
| **Resistors** (220Ω - 330Ω) | 3 | Current limiting for LEDs |
| **Breadboard & Jumper Wires** | 1 set | Circuit assembly |
| **Mini-USB Cable** | 1 | Programming and serial telemetry feed |

---

## 🔌 Pinout & Wiring Connections

```
      +------------------------+
      |      ARDUINO NANO      |
      |                        |
      |   [A0] <---------------+--- MAX4466 [OUT]
      |   [5V] ----------------+--- MAX4466 [VCC]
      |  [GND] ----------------+--- MAX4466 [GND]
      |                        |
      |  [D10] ---> [220Ω] --->|--- (Green LED - Normal)
      |   [D9] ---> [220Ω] --->|--- (Yellow LED - Warning)
      |  [D13] ---> [220Ω] --->|--- (Red LED - Critical Alert)
      +------------------------+
```

---

## ⚡ Flashing the Firmware

1. Open `hardware/arduino_nano_silentalert.ino` in the **Arduino IDE**.
2. Select **Tools > Board > Arduino AVR Boards > Arduino Nano**.
3. Select your Processor: **ATmega328P** (or Old Bootloader if clone).
4. Select the matching **Port** (e.g., `COM3`, `COM4` on Windows or `/dev/ttyUSB0` on Linux).
5. Click **Upload** (Ctrl + U).

---

## 📡 Live Telemetry Stream via USB Serial

To forward live decibel readings from the Arduino Nano to the SilentAlert web application:

```bash
# Windows
node hardware/serial_telemetry_bridge.js COM3

# Mac/Linux
node hardware/serial_telemetry_bridge.js /dev/ttyUSB0
```

The bridge reads JSON packets emitted by the Arduino and POSTs them to `http://localhost:5000/api/noise`. The web dashboard updates instantly in real time!
