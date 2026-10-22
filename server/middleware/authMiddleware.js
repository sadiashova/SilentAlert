const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
        token = req.headers['x-auth-token'];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this resource. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session token. Please log in again.' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Access denied: Administrator privileges required.' });
    }
};

module.exports = { protect, adminOnly };

