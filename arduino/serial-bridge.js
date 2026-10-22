/**
 * SilentAlert — Arduino Serial Bridge
 * ──────────────────────────────────────────────────────────
 * Arduino Nano → USB Serial → This script → POST /api/noise
 *
 * How to use:
 *   1. npm install serialport node-fetch   (one-time)
 *   2. Connect Arduino Nano via USB
 *   3. Find COM port (Device Manager → Ports)
 *   4. node arduino/serial-bridge.js COM3   (replace COM3)
 * ──────────────────────────────────────────────────────────
 */

const { SerialPort }   = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fetch            = require('node-fetch');

// ─── Config ───────────────────────────────────────────────
const COM_PORT    = process.argv[2] || 'COM3';    // Pass COM port as argument
const BAUD_RATE   = 9600;
const SERVER_URL  = 'http://127.0.0.1:5000/api/noise';
// ──────────────────────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║   SilentAlert — Arduino Serial Bridge        ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`📡 COM Port   : ${COM_PORT}`);
console.log(`🔊 Baud Rate  : ${BAUD_RATE}`);
console.log(`🌐 Server URL : ${SERVER_URL}`);
console.log('');

// Open Serial Port
const port = new SerialPort({
  path: COM_PORT,
  baudRate: BAUD_RATE,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
  console.log(`✅ Serial port ${COM_PORT} opened. Listening for Arduino data...`);
  console.log('   (Lines starting with # are debug logs — not sent to server)\n');
});

port.on('error', (err) => {
  console.error(`❌ Serial port error: ${err.message}`);
  console.error('\n📋 Troubleshooting:');
  console.error('   1. Arduino connected via USB?');
  console.error('   2. Correct COM port? Run: Get-WMIObject Win32_SerialPort');
  console.error('   3. Arduino IDE Serial Monitor is closed? (only 1 app can use port)');
  console.error(`   4. Try: node arduino/serial-bridge.js COM4  (or COM5, COM6...)\n`);
  process.exit(1);
});

// ─── Parse each line from Arduino ─────────────────────────
parser.on('data', async (line) => {
  line = line.trim();

  // Skip debug lines (starts with #) and empty lines
  if (!line || line.startsWith('#')) {
    if (line) console.log(`   ${line}`);   // print debug lines to console
    return;
  }

  // Try to parse as JSON
  let payload;
  try {
    payload = JSON.parse(line);
  } catch (e) {
    console.warn(`⚠️  Non-JSON line ignored: ${line}`);
    return;
  }

  // Log what we received
  const dB = payload.averageDecibel || '?';
  const zone = payload.zoneName || 'unknown';
  console.log(`🔊 [${new Date().toLocaleTimeString()}] Zone: ${zone.padEnd(16)} | dB: ${dB}`);

  // POST to server
  try {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`   ✅ Saved to MongoDB`);
    } else {
      const text = await res.text();
      console.warn(`   ⚠️  Server responded ${res.status}: ${text}`);
    }
  } catch (fetchErr) {
    console.error(`   ❌ Could not reach server: ${fetchErr.message}`);
    console.error('      Is "npm start" running in another terminal?');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Bridge stopped.');
  port.close(() => process.exit(0));
});

