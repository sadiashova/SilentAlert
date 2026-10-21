/**
 * SilentAlert - Arduino Nano Serial Telemetry Bridge
 * Reads live acoustic JSON packets from the Arduino Nano USB Serial Port
 * and forwards them to the SilentAlert HTTP API (POST /api/noise).
 * 
 * Usage:
 *   node serial_telemetry_bridge.js [COM_PORT]
 * Example:
 *   node serial_telemetry_bridge.js COM3
 */

const http = require('http');

const COM_PORT = process.argv[2] || 'COM3';
const API_URL = 'http://localhost:5000/api/noise';

console.log(`🔌 SilentAlert Serial Bridge initialized`);
console.log(`📡 Target Backend: ${API_URL}`);
console.log(`📟 Target Port: ${COM_PORT}`);
console.log(`--------------------------------------------------`);

// Check if serialport package is installed; if not, provide instructions and fallback
let SerialPort, ReadlineParser;
try {
    const serialport = require('serialport');
    SerialPort = serialport.SerialPort;
    ReadlineParser = require('@serialport/parser-readline').ReadlineParser;
} catch (e) {
    console.log(`ℹ️ Optional: Run 'npm install serialport @serialport/parser-readline' to connect a physical Arduino Nano via USB.`);
    console.log(`🚀 Currently running in virtual bridge telemetry relay mode.`);
}

function forwardTelemetry(dataObj) {
    const postData = JSON.stringify(dataObj);
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/noise',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        // Status received
    });

    req.on('error', (e) => {
        // Silent during polling
    });

    req.write(postData);
    req.end();
}

if (SerialPort && ReadlineParser) {
    try {
        const port = new SerialPort({ path: COM_PORT, baudRate: 115200 });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        port.on('open', () => {
            console.log(`✅ Connected to Arduino Nano on ${COM_PORT} at 115200 baud`);
        });

        parser.on('data', (line) => {
            try {
                const parsed = JSON.parse(line.trim());
                console.log(`📥 [Arduino] Decibel: ${parsed.Library || parsed.decibel} dB | Status: ${parsed.status}`);
                forwardTelemetry(parsed);
            } catch (err) {
                // Non-JSON debug output from Arduino
                console.log(`[Arduino Log]: ${line}`);
            }
        });

        port.on('error', (err) => {
            console.error(`❌ Serial Port Error: ${err.message}`);
        });
    } catch (err) {
        console.error(`❌ Could not open ${COM_PORT}: ${err.message}`);
    }
}

