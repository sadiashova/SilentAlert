require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const noiseRoutes = require('./routes/noiseRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Controllers for backward compatibility
const authController = require('./controllers/authController');
const zoneController = require('./controllers/zoneController');
const noiseController = require('./controllers/noiseController');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Core Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files from project root
app.use(express.static(path.join(__dirname, '..')));

// --- REST API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/noise', noiseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);

// --- BACKWARD COMPATIBILITY ENDPOINTS ---
// (Guarantees any legacy script or Arduino sketch continues working uninterrupted)
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        system: 'SilentAlert IoT Acoustic System',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Fallback to index.html for SPA page refresh if not an API route
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 SilentAlert Engine Running on http://localhost:${PORT}`);
        console.log(`📡 IoT Acoustic API Live & Connected to MongoDB`);
        console.log(`🔐 Authentication: JWT + Bcrypt`);
        console.log(`=======================================================`);
    });
}

module.exports = app;
