const NoiseLog = require('../models/NoiseLog');
const Zone = require('../models/Zone');

// @desc    Receive noise telemetry data (from Arduino Nano or simulator)
// @route   POST /api/noise
// @access  Public
exports.logNoise = async (req, res, next) => {
    try {
        const body = req.body;
        const newLog = new NoiseLog(body);

        // Update corresponding zones in database if recognized
        const recognizedRooms = ['Library', 'Classroom', 'Lab', 'ConferenceRoom'];
        for (const room of recognizedRooms) {
            if (body[room] !== undefined) {
                const level = Number(body[room]);
                let status = 'normal';
                if (level >= 70) status = 'critical';
                else if (level >= 60) status = 'warning';

                await Zone.findOneAndUpdate(
                    { name: { $regex: new RegExp(`^${room}`, 'i') } },
                    { currentLevel: level, status }
                );
            }
        }

        // Also if body has zoneId or zoneName directly
        if (body.zoneId && body.decibel) {
            let status = 'normal';
            if (body.decibel >= 70) status = 'critical';
            else if (body.decibel >= 60) status = 'warning';
            await Zone.findByIdAndUpdate(body.zoneId, { currentLevel: body.decibel, status });
        }

        await newLog.save();

        res.status(201).json({
            success: true,
            message: 'Telemetry Logged',
            data: newLog
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get recent noise logs (default 50)
// @route   GET /api/noise
// @access  Public
exports.getNoiseLogs = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        const logs = await NoiseLog.find().sort({ timestamp: -1 }).limit(limit);
        res.json(logs);
    } catch (err) {
        next(err);
    }
};

// @desc    Get noise analytics for dashboard charts
// @route   GET /api/noise/analytics
// @access  Public
exports.getNoiseAnalytics = async (req, res, next) => {
    try {
        const recentLogs = await NoiseLog.find().sort({ timestamp: -1 }).limit(30);
        const zones = await Zone.find();

        // Calculate zone decibel averages
        const zoneAverages = zones.map(z => ({
            name: z.name,
            current: z.currentLevel || 45,
            threshold: z.threshold || 60,
            status: z.status || 'normal'
        }));

        // Status counts
        const statusDistribution = {
            normal: zones.filter(z => z.status === 'normal').length,
            warning: zones.filter(z => z.status === 'warning').length,
            critical: zones.filter(z => z.status === 'critical').length
        };

        // Time series points
        const timeSeries = [...recentLogs].reverse().map(log => {
            const date = new Date(log.timestamp);
            const timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            return {
                timestamp: timeLabel,
                library: log.Library || 0,
                classroom: log.Classroom || 0,
                lab: log.Lab || 0,
                conference: log.ConferenceRoom || 0,
                average: log.averageDecibel || Math.round(((log.Library || 0) + (log.Classroom || 0) + (log.Lab || 0) + (log.ConferenceRoom || 0)) / 4)
            };
        });

        res.json({
            success: true,
            zoneAverages,
            statusDistribution,
            timeSeries
        });
    } catch (err) {
        next(err);
    }
};

