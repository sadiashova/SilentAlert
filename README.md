# 🔇 SilentAlert — IoT Acoustic Noise Monitoring Platform

> Real-time noise level monitoring powered by Arduino Nano + MAX4466 microphone sensors.  
> Built by **Sadia Zaman** | 
(https://www.linkedin.com/in/sadia-zaman-b5861b2ba) | [LinkedIn](https://www.facebook.com/sadia.zaman.7393264) | [Facebook](https://www.instagram.com/sadia._.zaman/) | [Instagram]

---

## 🌐 Live Demo

| | Link |
|---|---|
| 🖥️ Frontend | *(Deploy to Vercel — see Deployment section)* |
| ⚙️ Backend API | `http://localhost:5000/api` |
| 📊 Dashboard | `http://localhost:5000/#dashboard` |

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| 👤 User | `user@silentalert.io` | `User@1234` |
| 🔑 Admin | `admin@silentalert.io` | `Admin@1234` |

---

## 🛠️ Tech Stack

### Frontend
- Vanilla JS (SPA — Single Page Application)
- Tailwind CSS v3 (Dark Mode)
- Chart.js v4 (Bar, Line, Doughnut charts)
- jsPDF + AutoTable (PDF export)
- Firebase Auth (Google Sign-In)

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- JWT Authentication + Bcrypt
- REST API

### Hardware (IoT Layer)
- Arduino Nano
- MAX4466 Electret Microphone Amplifier
- USB Serial → Node.js Bridge

---

## 📁 Project Structure

```
SilentAlert/
├── index.html              # SPA frontend (all pages)
├── css/styles.css          # Custom styles
├── js/
│   ├── api.js              # API client
│   ├── app.js              # SPA router & UI logic
│   ├── auth.js             # Authentication
│   ├── charts.js           # Chart.js visualizations
│   └── firebase.js         # Firebase config
├── server/
│   ├── index.js            # Express entry point
│   ├── routes/             # API routes
│   ├── controllers/        # Route handlers
│   ├── models/             # Mongoose schemas
│   ├── middleware/         # Auth, error handling
│   └── config/db.js        # MongoDB connection
├── arduino/
│   ├── silentalert_nano.ino  # Arduino firmware
│   ├── serial-bridge.js      # PC → Server bridge
│   ├── noise-simulator.js    # Simulation mode
│   ├── diagram.json          # Wokwi circuit
│   └── wokwi.toml            # Wokwi config
├── .env                    # Environment variables
└── vercel.json             # Vercel deployment config
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local) OR MongoDB Atlas URI

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/SilentAlert.git
cd SilentAlert
npm install
```

### 2. Environment Variables
Create `.env` in project root:
```env
MONGO_URI=mongodb://127.0.0.1:27017/silentalert_db
JWT_SECRET=your_super_secret_key_here
PORT=5000
NODE_ENV=development
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Start Server
```bash
npm start
# Visit: http://localhost:5000
```

---

## 🎙️ Arduino / Real Hardware Setup

### Hardware
- Arduino Nano + MAX4466 microphone
- Wiring: `MAX4466 OUT → A0`, `VCC → 5V`, `GND → GND`

### Upload Firmware
1. Open `arduino/silentalert_nano.ino` in Arduino IDE
2. Select Board: **Arduino Nano**, Port: your COM port
3. Upload

### Run Serial Bridge (PC → Server)
```bash
node arduino/serial-bridge.js COM3
```

---

## 🎮 Simulation Mode (No Hardware Needed)

Run the noise simulator to generate realistic data for all 4 zones:
```bash
npm run simulate
# or fast mode (every 0.5s):
npm run simulate:fast
```

---

## 📊 Features

- ✅ Real-time acoustic monitoring dashboard
- ✅ 4-zone Campus Heatmap (Library, Classroom, Lab, ConferenceRoom)
- ✅ Live Bar, Line & Doughnut charts (auto-update every 3s)
- ✅ PDF audit report export
- ✅ Role-based access (User / Admin)
- ✅ JWT + Firebase Google Sign-In
- ✅ Arduino Nano + MAX4466 integration
- ✅ Wokwi simulation support
- ✅ Mobile responsive (hamburger menu)
- ✅ Dark mode

---

## ☁️ Deployment (Vercel + MongoDB Atlas)

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = your secret
4. Deploy!

---

## 👩‍💻 Author

**Sadia Zaman**  
IoT & Full-Stack Developer  

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sadia-zaman-b5861b2ba)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=flat&logo=facebook&logoColor=white)](https://www.facebook.com/sadia.zaman.7393264)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=flat&logo=instagram&logoColor=white)](https://www.instagram.com/sadia._.zaman/)

---

## 📄 License

MIT © 2026 Sadia Zaman
