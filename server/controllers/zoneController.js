const Zone = require('../models/Zone');

// @desc    Get all zones with search, filters, sorting & pagination
// @route   GET /api/zones
// @access  Public
exports.getZones = async (req, res, next) => {
    try {
        const { search, category, status, sort, page = 1, limit = 8 } = req.query;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        if (status && status !== 'All') {
            query.status = status;
        }

        // Sorting
        let sortOption = { createdAt: -1 };
        if (sort === 'name-asc') sortOption = { name: 1 };
        if (sort === 'name-desc') sortOption = { name: -1 };
        if (sort === 'noise-high') sortOption = { currentLevel: -1 };
        if (sort === 'noise-low') sortOption = { currentLevel: 1 };
        if (sort === 'threshold-high') sortOption = { threshold: -1 };
        if (sort === 'threshold-low') sortOption = { threshold: 1 };

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 8;
        const skip = (pageNum - 1) * limitNum;

        const total = await Zone.countDocuments(query);
        const zones = await Zone.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum);

        res.json({
            success: true,
            count: zones.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum) || 1,
            data: zones
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single zone by ID with related zones
// @route   GET /api/zones/:id
// @access  Public
exports.getZoneById = async (req, res, next) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }

        // Fetch related zones in same category or location
        const relatedZones = await Zone.find({
            _id: { $ne: zone._id },
            category: zone.category
        }).limit(3);

        res.json({
            success: true,
            data: zone,
            related: relatedZones
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new zone
// @route   POST /api/zones
// @access  Private
exports.createZone = async (req, res, next) => {
    try {
        const {
            name,
            category,
            location,
            threshold,
            description,
            capacity,
            image,
            hardwareNode
        } = req.body;

        if (!name || !location) {
            return res.status(400).json({ success: false, message: 'Please provide both Zone Name and Location' });
        }

        const newZone = new Zone({
            name,
            category: category || 'Library',
            location,
            threshold: Number(threshold) || 60,
            description: description || `Monitored silent zone located in ${location}.`,
            capacity: Number(capacity) || 40,
            image: image || 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
            hardwareNode: hardwareNode || {
                nodeId: `ARDUINO-NANO-${Math.floor(10 + Math.random() * 90)}`,
                mcu: 'Arduino Nano (ATmega328P)',
                sensorType: 'MAX4466 Electret Microphone',
                samplingRate: '1000 Hz RMS',
                status: 'online'
            },
            createdBy: req.user ? req.user.id : null
        });

        const savedZone = await newZone.save();

        res.status(201).json({
            success: true,
            message: 'Acoustic Zone created successfully',
            data: savedZone
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update zone
// @route   PUT /api/zones/:id
// @access  Private
exports.updateZone = async (req, res, next) => {
    try {
        let zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }

        zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json({
            success: true,
            message: 'Zone updated successfully',
            data: zone
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete zone
// @route   DELETE /api/zones/:id
// @access  Private
exports.deleteZone = async (req, res, next) => {
    try {
        const zone = await Zone.findById(req.params.id);
        if (!zone) {
            return res.status(404).json({ success: false, message: 'Zone not found' });
        }

        await Zone.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Zone deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
