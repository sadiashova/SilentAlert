# 🎙️ SilentAlert: IoT Acoustic Monitoring & Intelligence Platform

> **Enterprise-grade acoustic monitoring, real-time decibel telemetry, and autonomous silence enforcement powered by Arduino Nano edge sensor nodes, Express, and MongoDB.**

[![System Status](https://img.shields.io/badge/Status-Production%20Ready-emerald)](http://localhost:5000)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-0f172a)](https://expressjs.com)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Community%20%2F%20Atlas-10b981)](https://mongodb.com)
[![Hardware](https://img.shields.io/badge/IoT%20Hardware-Arduino%20Nano%20%2B%20MAX4466-ef4444)](https://arduino.cc)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Executive Summary

**SilentAlert** upgrades legacy sound monitoring into an intelligent, scalable, and responsive acoustic compliance grid. Designed for high-sensitivity spaces—such as **University Libraries, Hospital ICU Recovery Pavilions, Standardized Examination Halls, and Precision Nanotech Laboratories**—the platform continuously ingests sound pressure levels (SPL) in dBA, compares readings against permissible thresholds, flags violations with real-time visual alarms, and generates one-click compliance audit reports.

---

## 🔑 Demo Access Credentials

The login page includes **one-click auto-fill buttons** for instant authentication:

| Role | Email Address | Password | Permissions & Views |
| :--- | :--- | :--- | :--- |
| **Acoustic Administrator** | `admin@silentalert.io` | `Admin@1234` | Full access: Overview, Campus Heatmap, Incident Reports, Manage Zones (CRUD), Manage Users (roles/delete), Node Config |
| **Facility Specialist (User)** | `user@silentalert.io` | `User@1234` | Standard access: Overview, Monitored Zones, Campus Heatmap, Incident Logs, Personal Profile & Password Update |

---

## 🏗️ System Architecture & Data Flow

```
   [ Physical Quiet Space ]
              │
              ▼
   ┌─────────────────────────────────────────────────────────────┐
   │            ARDUINO NANO EDGE TELEMETRY NODE                 │
   │  • MAX4466 / KY-037 Electret Microphone Sensor              │
   │  • 50ms Window Analog Peak-to-Peak Sampling (1000 Hz)       │
   │  • Logarithmic dBA Sound Pressure Level Conversion          │
   │  • Tri-Color Onboard Alert LEDs (Normal/Warning/Critical)   │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ 115200 Baud Serial / HTTP JSON
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                 EXPRESS BACKEND REST API                    │
   │  • Node.js + Express 5 Modular Architecture                 │
   │  • JWT Authentication & Bcrypt Password Hashing             │
   │  • Role-Based Access Control Middleware (User vs Admin)     │
   │  • Centralized Error & Exception Handling                   │
   │  • Telemetry Ingestion Gateway & Threshold Evaluator        │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │                             │
                   ▼                             ▼
   ┌─────────────────────────────┐ ┌─────────────────────────────┐
   │       MONGODB DATABASE      │ │   MODERN RESPONSIVE FRONTEND│
   │  • User Collection (Auth)   │ │  • Tailwind CSS 8px Grid    │
   │  • Zone Collection (Items)  │ │  • Light & Dark Mode Engine │
   │  • NoiseLog Collection      │ │  • Interactive Decibel Wave │
   │  • Contact Collection (Msgs)│ │  • Chart.js Live Telemetry  │
   └─────────────────────────────┘ │  • Floorplan Heatmap Canvas │
                                   │  • jsPDF Regulatory Export  │
                                   └─────────────────────────────┘
```

---

## 🎨 Design System & UI Implementation

* **Primary Palette:** Maximum 3 primary colors + neutral:
  * **Slate / Midnight (`#0f172a`):** Professional enterprise foundation.
  * **Acoustic Crimson Red (`#ef4444` / `#dc2626`):** Dynamic alerts, pulses, and brand accents.
  * **Compliance Emerald Green (`#10b981`):** Safe, quiet, and nominal statuses.
  * **Neutral (`#f8fafc` / `#020617`):** Contrast-ratio compliant light and dark mode surfaces.
* **Theme Switching:** Instant toggle between Light Mode and Dark Mode with state persisted in `localStorage` and adaptive Chart.js redraws.
* **Grid & Radii:** 8px spacing system, unified `rounded-2xl` cards/modals and `rounded-xl` buttons and inputs.
* **Typography:** `Plus Jakarta Sans` for clean modern body/headings, paired with `JetBrains Mono` for telemetry specifications.
* **Zero Dummy Content:** Every card, zone, statistic, and technical documentation item features realistic acoustic and IoT specifications.

---

## 🚀 Key Functional Pages & Features

### 1. Home / Landing Page
* **Sticky Full-Width Navbar:**
  * **Logged Out (4+ routes):** Home, Explore Zones, About, Knowledge Hub, Contact, Log In, Get Started.
  * **Logged In (6+ routes):** Home, Explore Zones, Dashboard, Campus Heatmap, Incident Reports, Knowledge Hub, Profile Dropdown, Logout.
  * **Advanced Dropdown:** Displays avatar, name, email, role badge, quick shortcuts, theme toggle, and sign out.
* **Hero Section (60–70% Viewport):**
  * Interactive Real-time Decibel Waveform Visualizer.
  * Live Decibel Sensitivity Slider simulating rooms from 30 dB to 95 dB.
* **10 Meaningful Content Sections:**
  1. Interactive Hero with Real-time Decibel Waveform.
  2. Live Platform Dynamic Statistics from Backend (`/api/stats/overview`).
  3. Key Architectural Features (Edge sensor processing, heatmaps, automated audits).
  4. Core Monitored Zones Showcase (4 cards per row, desktop grid, skeleton loader).
  5. Sector Deployments & Categories (Libraries, ICUs, Exam Halls, Robotics Labs).
  6. Arduino Nano Hardware Architecture & Pinout code walkthrough.
  7. WHO Decibel Reference Guide & Health Impact.
  8. Verified Institutional Testimonials & Case Studies.
  9. Interactive Technical FAQ Accordion.
  10. Incident Alert Newsletter Subscription.

### 2. Core Listing & Explore Page
* **Card Rules:** Uniform height/width, `rounded-2xl`, responsive 4-column desktop grid.
* **Meta Display:** Current dB reading, room capacity, permissible threshold, sector badge, and Arduino hardware node ID.
* **Search & Multi-field Filtering:**
  * Real-time search query by name or floor.
  * Sector Category filter (Library, Hospital, Classroom, Lab, Conference, Office).
  * Noise Level Status filter (Normal <60dB, Warning 60-70dB, Critical >70dB).
  * Sort by Name (A-Z / Z-A), Noise Level (High/Low), or Threshold.
  * Clean server-supported pagination controls.

### 3. Public Details Page & Modal
* **Media Section:** Multi-image gallery with clickable thumbnail selector.
* **Hardware Specifications:** Arduino Nano MCU, MAX4466 sensor model, sampling window rate, and baud rate.
* **Acoustic Standards:** Target SPL (dBA), Noise Rating Criterion (NC), reverberation time (RT60), and compliance protocol.
* **Live Telemetry Trend Chart:** Dedicated mini-chart rendering real-time sound levels for the specific zone.
* **Related Zones:** Sector-specific related room recommendations.

### 4. Authentication System
* JWT-based session security with token expiration handling.
* Password hashing with `bcryptjs` (salt rounds: 10).
* Accessible form fields with labels, error toasts, and loading spinners.
* Dedicated **Demo Admin** and **Demo User** auto-fill buttons.

### 5. Role-Based Dashboard
* **Dynamic Overview Cards:** Total zones monitored, total logs, active alerts, and MCU node count.
* **Interactive Dynamic Charts (Chart.js):**
  * **Bar Chart:** Average decibels by monitored zone with dashed threshold reference lines.
  * **Line Chart:** 24-hour multi-channel continuous telemetry feed.
  * **Doughnut Chart:** Zone compliance ratio (Normal vs Warning vs Critical).
* **Interactive Heatmap:** Real floorplan (`map.png`) overlaid with animated gradient sound dispersion blobs and pulsating radar markers.
* **Data Tables:**
  * **Manage Zones (Admin CRUD):** Create Zone modal, Edit Zone modal, Delete with confirmation.
  * **Reports Table:** Filterable log audit trail with **Export PDF** generation via jsPDF & AutoTable.
  * **Manage Users (Admin):** User list, role toggle (`user` <-> `admin`), account deletion.
* **Specialist Profile:** Edit name, phone, organization, and bio; change password with old password verification.

### 6. Additional Pages
* **About Page:** The SilentAlert engineering story, Arduino Nano edge processing advantages, and mission.
* **Contact Page:** Functional contact form storing submissions directly in the MongoDB `Contact` collection with server-side validation and confirmation toasts.
* **Knowledge Hub / Blog:** Articles on WHO acoustic limits in medical wards, MAX4466 ADC calibration, and reverberation times.

---

## 🔌 Arduino Nano IoT Hardware Setup

Physical hardware sketches and telemetry bridges are located in the `/hardware` folder.

### Wiring Pinout:
```
  Arduino Nano Pin      MAX4466 Microphone Pin
  ────────────────      ──────────────────────
  5V             -----> VCC
  GND            -----> GND
  A0             -----> OUT (Analog Output)

  LED Indicator Pins:
  D10            -----> 220Ω Resistor -----> Green LED (Normal <60 dB)
  D9             -----> 220Ω Resistor -----> Yellow LED (Warning 60-70 dB)
  D13            -----> 220Ω Resistor -----> Red LED (Critical >70 dB)
```

### Running the Hardware Telemetry Stream:
1. Open `hardware/arduino_nano_silentalert.ino` in the Arduino IDE.
2. Select **Board: Arduino Nano** and your matching **COM Port** (e.g. `COM3` on Windows).
3. Click **Upload**.
4. In your terminal, run the Serial Bridge to stream live telemetry to SilentAlert:
   ```bash
   node hardware/serial_telemetry_bridge.js COM3
   ```
*(If no physical Arduino is connected, SilentAlert automatically engages its built-in realistic telemetry simulator so all charts, heatmaps, and cards remain actively animated).*

---

## 🛠️ Installation & Local Setup

### Prerequisites
* [Node.js](https://nodejs.org) (v18 or higher)
* [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port 27017, or a MongoDB Atlas URI.

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/your-username/SilentAlert.git
cd SilentAlert
npm install
```

### Step 2: Configure Environment Variables
A `.env` file has been provided in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/silentalert_db
JWT_SECRET=silentalert_super_secret_jwt_key_2025_prod_secure
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Step 3: Seed Initial Data
Populate the database with the initial demo accounts, 8 realistic acoustic zones, and telemetry logs:
```bash
npm run seed
```

### Step 4: Start the Server
```bash
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser. The application will be live!

---

## 🌐 REST API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new acoustic specialist account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `POST` | `/api/auth/demo-login`| Public | Instant demo login for `admin` or `user` |
| `GET` | `/api/auth/me` | Private | Retrieve logged-in specialist profile |
| `PUT` | `/api/auth/profile` | Private | Update profile name, phone, bio |
| `PUT` | `/api/auth/password` | Private | Change password with verification |
| `GET` | `/api/zones` | Public | List zones with search, filters, sorting & pagination |
| `GET` | `/api/zones/:id` | Public | Retrieve single zone details & related zones |
| `POST` | `/api/zones` | Private | Register new monitored zone node |
| `PUT` | `/api/zones/:id` | Private | Update zone threshold and specifications |
| `DELETE`| `/api/zones/:id` | Admin | Remove monitored zone node |
| `POST` | `/api/noise` | Public | Ingest acoustic telemetry packet from Arduino |
| `GET` | `/api/noise` | Public | Retrieve recent decibel telemetry logs |
| `GET` | `/api/noise/analytics`| Public | Fetch hourly trends & distribution for charts |
| `GET` | `/api/stats/overview` | Public | Dynamic platform counts and compliance rate |
| `POST` | `/api/contact` | Public | Submit contact inquiry to database |
| `GET` | `/api/users` | Admin | List all registered accounts (Paginated) |
| `PUT` | `/api/users/:id/role`| Admin | Toggle user role (`user` / `admin`) |
| `DELETE`| `/api/users/:id` | Admin | Delete user account |

---

## 🚀 Production Deployment Guide

### Deploying the Backend (e.g. Render, Railway, VPS)
1. Push your repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app).
3. Set Build Command: `npm install`
4. Set Start Command: `node server/index.js`
5. Configure Environment Variables in the hosting dashboard:
   * `PORT`: `5000` (or provided by host)
   * `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/silentalert`
   * `JWT_SECRET`: `<strong_random_secret_string>`
   * `NODE_ENV`: `production`

### Deploying the Frontend (e.g. Vercel, Netlify)
* The Express server serves the frontend statically via `express.static()`, making a single-service deployment on Render or Railway turnkey.
* If deploying the frontend separately on Vercel/Netlify, update `API_BASE_URL` in `js/api.js` to point to your deployed backend URL.

---

## 📋 Final Verification Checklist

- [x] **Global UI & Design Rules:** 3 primary colors + neutral, Dark & Light Mode toggle, 8px grid, unified `rounded-2xl`, responsive navigation drawer.
- [x] **Home / Landing Page:** Sticky navbar with 4+ routes (logged out) and 6+ routes (logged in), interactive decibel waveform simulator, 10 rich content sections, zero dummy/lorem ipsum text.
- [x] **Core Listing Section:** 4 cards per row desktop grid, skeleton loading states, real backend data, decibel meta, View Details buttons.
- [x] **Details Page & Modal:** Publicly accessible, multi-image gallery, key IoT specifications, live trend chart, related zones.
- [x] **Explore / Listing Page:** Search bar, category filter, noise level filter, sorting options, pagination.
- [x] **Authentication:** JWT, bcrypt password hashing, role middleware, Demo Login auto-fill for Admin and User.
- [x] **Role-Based Dashboard:** Separate views for User and Admin, Chart.js bar/line/doughnut charts, spatial heatmap overlay, data tables with pagination/filtering/sorting/CRUD, profile update form, PDF export.
- [x] **Additional Pages:** About page, working Contact page storing to database, Knowledge Hub.
- [x] **IoT Hardware Integration:** Arduino Nano sketch with 50ms window sampling, MAX4466 sensor calibration, tri-color LED indicators, serial bridge, and hardware documentation.
- [x] **Backend Architecture:** Modular `server/` with `config/`, `models/`, `controllers/`, `middleware/`, `routes/`, and backward-compatible endpoints.

---

**Developed with care for acoustic wellness and smart IoT environments.**

