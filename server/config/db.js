const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/silentalert_db';
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.log('💡 Tip: Make sure MongoDB Community Server is running on your system.');
        // Don't crash immediately in development, allow retry or fallback
    }
};

module.exports = connectDB;
