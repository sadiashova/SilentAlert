const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Zone name is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['Library', 'Hospital', 'Classroom', 'Lab', 'Conference', 'Office', 'Other'],
        default: 'Library'
    },
    location: {
        type: String,
        required: [true, 'Zone location is required'],
        trim: true
    },
    threshold: {
        type: Number,
        required: [true, 'Threshold dB is required'],
        min: 20,
        max: 140,
        default: 60
    },
    currentLevel: {
        type: Number,
        default: 42
    },
    status: {
        type: String,
        enum: ['normal', 'warning', 'critical'],
        default: 'normal'
    },
    description: {
        type: String,
        default: 'High-priority quiet acoustic environment monitored via continuous edge decibel sampling.'
    },
    capacity: {
        type: Number,
        default: 50
    },
    rating: {
        type: Number,
        default: 4.8
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80'
    },
    gallery: {
        type: [String],
        default: [
            'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
        ]
    },
    hardwareNode: {
        nodeId: {
            type: String,
            default: 'ARDUINO-NANO-01'
        },
        mcu: {
            type: String,
            default: 'Arduino Nano (ATmega328P / BLE Sense)'
        },
        sensorType: {
            type: String,
            default: 'MAX4466 Electret Microphone with AGC'
        },
        samplingRate: {
            type: String,
            default: '1000 Hz RMS windowed'
        },
        baudRate: {
            type: Number,
            default: 115200
        },
        status: {
            type: String,
            enum: ['online', 'offline', 'standby'],
            default: 'online'
        }
    },
    acousticSpecs: {
        targetSpl: { type: String, default: '40-55 dBA' },
        noiseRatingCriterion: { type: String, default: 'NC-25' },
        reverberationTime: { type: String, default: '0.6s RT60' },
        complianceStandard: { type: String, default: 'ISO 1996-2 / WHO Guidelines' }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update status automatically based on currentLevel vs threshold
ZoneSchema.pre('save', function (next) {
    if (this.currentLevel) {
        if (this.currentLevel >= this.threshold + 10) {
            this.status = 'critical';
        } else if (this.currentLevel >= this.threshold) {
            this.status = 'warning';
        } else {
            this.status = 'normal';
        }
    }
    if (typeof next === 'function') next();
});

module.exports = mongoose.model('Zone', ZoneSchema);
