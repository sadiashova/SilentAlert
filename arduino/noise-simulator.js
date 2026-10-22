/**
 * SilentAlert — Wokwi / Arduino Noise Simulator
 * ─────────────────────────────────────────────────────────────
 * Wokwi can't POST to localhost directly (it's AVR — no WiFi).
 * This script runs on your PC and sends REALISTIC simulated
 * noise data to the server, as if coming from real sensors.
 *
 * Simulates a school environment with 4 zones:
 *   Library       → quieter baseline   (35–58 dB)
 *   Classroom      → moderate activity  (48–72 dB)
 *   Lab            → variable activity  (42–78 dB)
 *   ConferenceRoom → high when active   (52–82 dB)
 *
 * Usage:
 *   node arduino/noise-simulator.js
 *   node arduino/noise-simulator.js --fast   (0.5s interval)
 *   node arduino/noise-simulator.js --zone Library
 * ─────────────────────────────────────────────────────────────
 */

const fetch = require('node-fetch');

// ─── Config ───────────────────────────────────────────────
const SERVER_URL   = 'http://127.0.0.1:5000/api/noise';
const INTERVAL_MS  = 2000;   // Send every 2 seconds

// Parse CLI args
const args = process.argv.slice(2);
const FAST_MODE    = args.includes('--fast');
const interval     = FAST_MODE ? 500 : INTERVAL_MS;

// ─── Zone Profiles ────────────────────────────────────────
// Each zone has: baseline dB, variation range, spike chance
const ZONES = {
  Library:       { base: 42,  range: 16, spikeChance: 0.03, spikeMax: 15 },
  Classroom:     { base: 58,  range: 20, spikeChance: 0.08, spikeMax: 20 },
  Lab:           { base: 52,  range: 22, spikeChance: 0.10, spikeMax: 25 },
  ConferenceRoom:{ base: 60,  range: 22, spikeChance: 0.06, spikeMax: 22 },
};

// ─── State ────────────────────────────────────────────────
let tickCount = 0;
// Each zone has its own "momentum" (smooth transitions)
const momentum = { Library: 0, Classroom: 0, Lab: 0, ConferenceRoom: 0 };

// ─── Helper: Generate realistic dB for a zone ─────────────
function generateDB(zoneName) {
  const z = ZONES[zoneName];

  // Time-of-day factor (simulate activity peaks)
  const hour = new Date().getHours();
  let timeFactor = 1.0;
  if (hour >= 9  && hour <= 11) timeFactor = 1.15;   // Morning peak
  if (hour >= 12 && hour <= 13) timeFactor = 1.20;   // Lunch
  if (hour >= 14 && hour <= 16) timeFactor = 1.10;   // Afternoon
  if (hour >= 20 || hour <= 6)  timeFactor = 0.70;   // Night (quiet)

  // Random walk with momentum (smooth, realistic)
  const drift = (Math.random() - 0.5) * 4;
  momentum[zoneName] = momentum[zoneName] * 0.7 + drift * 0.3;

  let dB = z.base * timeFactor + momentum[zoneName] + (Math.random() - 0.5) * z.range;

  // Occasional noise spike
  if (Math.random() < z.spikeChance) {
    dB += Math.random() * z.spikeMax;
    console.log(`   ⚡ Spike in ${zoneName}!`);
  }

  // Clamp to realistic range
  dB = Math.max(30, Math.min(100, dB));
  return parseFloat(dB.toFixed(1));
}

// ─── Helper: Status label ─────────────────────────────────
function statusLabel(dB) {
  if (dB >= 70) return '\x1b[31mCRITICAL\x1b[0m'; // red
  if (dB >= 60) return '\x1b[33mWARNING \x1b[0m'; // yellow
  return '\x1b[32mNORMAL  \x1b[0m';               // green
}

// ─── Send One Telemetry Batch ─────────────────────────────
async function sendTelemetry() {
  tickCount++;

  const lib  = generateDB('Library');
  const cls  = generateDB('Classroom');
  const lab  = generateDB('Lab');
  const conf = generateDB('ConferenceRoom');
  const avg  = parseFloat(((lib + cls + lab + conf) / 4).toFixed(1));

  const payload = {
    Library:        lib,
    Classroom:      cls,
    Lab:            lab,
    ConferenceRoom: conf,
    averageDecibel: avg,
    deviceId:       'WOKWI_SIMULATOR',
  };

  const now = new Date().toLocaleTimeString();
  console.log(`\n[${now}] Tick #${tickCount}`);
  console.log(`  📚 Library       : ${lib.toString().padStart(5)} dB  ${statusLabel(lib)}`);
  console.log(`  🏫 Classroom     : ${cls.toString().padStart(5)} dB  ${statusLabel(cls)}`);
  console.log(`  🔬 Lab           : ${lab.toString().padStart(5)} dB  ${statusLabel(lab)}`);
  console.log(`  🏢 ConferenceRoom: ${conf.toString().padStart(5)} dB  ${statusLabel(conf)}`);
  console.log(`  〰  Average       : ${avg.toString().padStart(5)} dB`);

  try {
    const res = await fetch(SERVER_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (res.ok) {
      console.log('  ✅ Saved to MongoDB');
    } else {
      const text = await res.text();
      console.warn(`  ⚠️  Server ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error(`  ❌ Cannot reach server: ${err.message}`);
    console.error('     Run "npm start" in another terminal first!');
  }
}

// ─── Startup Banner ───────────────────────────────────────
console.log('\x1b[36m');
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║   SilentAlert — Wokwi Noise Simulator             ║');
console.log('║   Sends realistic 4-zone dB data to server        ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('\x1b[0m');
console.log(`🌐 Server    : ${SERVER_URL}`);
console.log(`⏱  Interval  : ${interval}ms  ${FAST_MODE ? '(fast mode)' : ''}`);
console.log('📊 Dashboard : http://localhost:5000  → Dashboard');
console.log('');
console.log('Press Ctrl+C to stop.\n');

// ─── Start Simulation ─────────────────────────────────────
sendTelemetry();  // Send immediately on start
setInterval(sendTelemetry, interval);

process.on('SIGINT', () => {
  console.log(`\n\n🛑 Simulator stopped after ${tickCount} ticks.`);
  process.exit(0);
});
