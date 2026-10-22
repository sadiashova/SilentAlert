const express = require('express');

let app;
try {
    app = require('../server/index.js');
} catch (e) {
    console.error('SERVER_BOOT_CRASH:', e);
    app = express();
    app.all('*', (req, res) => {
        res.status(500).json({
            error: 'SERVER_BOOT_CRASH',
            message: e.message,
            stack: e.stack
        });
    });
}

module.exports = app;
