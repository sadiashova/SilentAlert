const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- MONGODB CONNECTION  ---
mongoose.connect('mongodb://127.0.0.1:27017/silentalert_db')
    .then(() => console.log('✅ MongoDB Connected Successfully to silentalert_db!'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        console.log('💡 Tip: Is MongoDB Community Server running on your PC?');
    });

// --- SCHEMAS (Database Models) ---

// 1. User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 2. Zone Schema
const ZoneSchema = new mongoose.Schema({
    name: String,
    location: String,
    threshold: Number
});
const Zone = mongoose.model('Zone', ZoneSchema);

// 3. Noise Log Schema
const NoiseLogSchema = new mongoose.Schema({
    Library: Number,
    Classroom: Number,
    Lab: Number,
    ConferenceRoom: Number,
    timestamp: { type: Date, default: Date.now }
});
const NoiseLog = mongoose.model('NoiseLog', NoiseLogSchema);

// --- API ROUTES ---

// Auth: Register
app.post('/api/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ msg: "Registration successful" });
    } catch (err) { res.status(400).json({ msg: "User already exists or Error" }); }
});

// Auth: Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (user) res.json({ token: "token-" + user._id, msg: "Login success" });
        else res.status(400).json({ msg: "Invalid credentials" });
    } catch (err) { res.status(500).json({ msg: "Server Error" }); }
});

// Zone: Create New Zone
app.post('/api/zones', async (req, res) => {
    try {
        const newZone = new Zone(req.body);
        await newZone.save();
        res.json({ msg: "Zone saved successfully" });
    } catch (err) { res.status(500).json({ msg: "Error saving zone" }); }
});

// Zone: Get All Zones
app.get('/api/zones', async (req, res) => {
    try {
        const zones = await Zone.find();
        res.json(zones);
    } catch (err) { res.status(500).json({ msg: "Error fetching zones" }); }
});

// Zone: Delete Zone (NEWLY ADDED ✅)
app.delete('/api/zones/:id', async (req, res) => {
    try {
        const zoneId = req.params.id;
        const deletedZone = await Zone.findByIdAndDelete(zoneId);

        if (!deletedZone) {
            return res.status(404).json({ msg: "Zone not found" });
        }
        res.json({ msg: "Zone deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error during delete" });
    }
});

// Noise Data: Receive Data
app.post('/api/noise', async (req, res) => {
    try {
        const newLog = new NoiseLog(req.body);
        await newLog.save();
        console.log("📡 Data Saved to DB:", req.body);
        res.json({ msg: "Logged" });
    } catch (err) { res.status(500).json({ msg: "Error" }); }
});

// Noise Data: Send Data to Frontend
app.get('/api/noise', async (req, res) => {
    try {
        const logs = await NoiseLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (err) { res.status(500).json({ msg: "Error fetching logs" }); }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));