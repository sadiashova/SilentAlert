module.exports = async (req, res) => {
    try {
        const app = require('../server/index.js');
        const connectDB = require('../server/config/db.js');
        await connectDB();
        return app(req, res);
    } catch (err) {
        return res.status(500).json({
            error: "SERVERLESS_INIT_ERROR",
            message: err.message,
            stack: err.stack
        });
    }
};
