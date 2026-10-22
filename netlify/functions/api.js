const serverless = require('serverless-http');
const app = require('../../server/index.js');
const connectDB = require('../../server/config/db.js');

let isConnected = false;

const handler = serverless(app);

module.exports.handler = async (event, context) => {
    // Keep lambda connection warm across calls
    context.callbackWaitsForEmptyEventLoop = false;
    
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
        } catch (err) {
            console.error('Netlify MongoDB Connection Error:', err);
        }
    }

    return await handler(event, context);
};
