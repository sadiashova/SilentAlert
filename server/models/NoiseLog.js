const mongoose = require('mongoose');

const NoiseLogSchema = new mongoose.Schema({
    // Legacy fields for backward compatibility
    Library: { type: Number, default: 0 },
    Classroom: { type: Number, default: 0 },
    Lab: { type: Number, default: 0 },
    ConferenceRoom: { type: Number, default: 0 },

    // Modern telemetry support
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone'
    },
    zoneName: {
        type: String
    },
    decibel: {
        type: Number
    },
    readings: [{
        zoneName: String,
        decibel: Number,
        status: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' }
    }],
    peakDecibel: {
        type: Number,
        default: 0
    },
    averageDecibel: {
        type: Number,
        default: 0
    },
    source: {
        type: String,
        default: 'Arduino Nano Edge Node'
    },
    alertTriggered: {
        type: Boolean,
        default: false
    },
    alertMessage: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Auto-calculate peak and average before saving if legacy fields provided
NoiseLogSchema.pre('save', function (next) {
    const vals = [this.Library, this.Classroom, this.Lab, this.ConferenceRoom].filter(v => v !== undefined && v !== null && v > 0);
    if (vals.length > 0) {
        this.peakDecibel = Math.max(...vals);
        this.averageDecibel = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
        if (this.peakDecibel >= 70) {
            this.alertTriggered = true;
            this.alertMessage = `High noise detected: ${this.peakDecibel} dB`;
        }
    }
    if (typeof next === 'function') next();
});

module.exports = mongoose.model('NoiseLog', NoiseLogSchema);
