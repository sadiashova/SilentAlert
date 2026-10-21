const Contact = require('../models/Contact');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
exports.submitContact = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message content'
            });
        }

        const newContact = await Contact.create({
            name,
            email: email.toLowerCase().trim(),
            subject: subject || 'Acoustic Monitoring Inquiry',
            message
        });

        res.status(201).json({
            success: true,
            message: 'Thank you! Your inquiry has been received. Our acoustic specialist team will contact you shortly.',
            data: newContact
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all contact messages (Admin only)
// @route   GET /api/contact
// @access  Private / Admin
exports.getContacts = async (req, res, next) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (err) {
        next(err);
    }
};

