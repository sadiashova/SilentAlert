const mongoose = require('mongoose');

// Cache connection across serverless invocations (for Vercel / Cloud Functions)
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/silentalert_db';

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 4000
        };

        cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
            console.log(`✅ MongoDB Connected Successfully: ${mongooseInstance.connection.host}`);
            return mongooseInstance;
        }).catch((err) => {
            console.log('-------------------------------------------------------');
            console.log('⚠️  MongoDB Local Connection (localhost:27017) not found.');
            console.log('💡 To use a Cloud Database (MongoDB Atlas):');
            console.log('   1. Create a free M0 cluster at https://mongodb.com/atlas');
            console.log('   2. Add your connection string to the .env file:');
            console.log('      MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/silentalert_db');
            console.log('-------------------------------------------------------');
            cached.promise = null;
            return null;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
    }

    return cached.conn;
};

module.exports = connectDB;
