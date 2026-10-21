const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Your name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Your email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        default: 'General Acoustic Inquiries'
    },
    message: {
        type: String,
        required: [true, 'Message content is required'],
        minlength: [10, 'Message must be at least 10 characters']
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'responded'],
        default: 'unread'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Contact', ContactSchema);
