// Vercel Serverless Function Entry Point for SilentAlert API
const app = require('../server/index.js');
const connectDB = require('../server/config/db.js');

module.exports = async (req, res) => {
    // Ensure DB connected before processing serverless request
    await connectDB();
    return app(req, res);
};
