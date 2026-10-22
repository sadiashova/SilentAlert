const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register (or legacy /api/register)
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email and password' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const userExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email address' });
        }

        const user = await User.create({
            name: name || email.split('@')[0],
            email: email.toLowerCase().trim(),
            password,
            role: role === 'admin' ? 'admin' : 'user'
        });

        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to SilentAlert.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                organization: user.organization
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login (or legacy /api/login)
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email and password' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                organization: user.organization,
                phone: user.phone,
                bio: user.bio
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Demo auto-fill login
// @route   POST /api/auth/demo-login
// @access  Public
exports.demoLogin = async (req, res, next) => {
    try {
        const { role } = req.body; // 'admin' or 'user'
        const targetEmail = role === 'admin' ? 'admin@silentalert.io' : 'user@silentalert.io';
        
        let user = await User.findOne({ email: targetEmail });
        if (!user) {
            // Auto create demo account if not exists
            user = await User.create({
                name: role === 'admin' ? 'Acoustic Chief Administrator' : 'Lead Library Supervisor',
                email: targetEmail,
                password: role === 'admin' ? 'Admin@1234' : 'User@1234',
                role: role === 'admin' ? 'admin' : 'user',
                organization: role === 'admin' ? 'Metropolitan Smart Campus Network' : 'North Academic Library',
                phone: '+1 (555) 789-0123',
                bio: role === 'admin' 
                    ? 'Supervising campus-wide acoustic telemetry nodes and automated noise enforcement.'
                    : 'Managing quiet study zones and monitoring real-time library sensor thresholds.'
            });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: `Logged in as Demo ${user.role.toUpperCase()}`,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                organization: user.organization,
                phone: user.phone,
                bio: user.bio
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Sync or register user authenticated via Firebase (Google / Email)
// @route   POST /api/auth/firebase-sync
// @access  Public
exports.firebaseSync = async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Valid email is required from Firebase' });
        }

        const cleanEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: cleanEmail });

        if (!user) {
            // Create user account from Firebase profile
            user = await User.create({
                name: name || cleanEmail.split('@')[0],
                email: cleanEmail,
                password: 'FB_' + Math.random().toString(36).substring(2, 12) + '99!Aa',
                avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                role: 'user',
                organization: 'Firebase Authenticated Specialist',
                bio: 'Authenticated via Firebase Authentication (silentalert-6a832).'
            });
        } else if (avatar && (!user.avatar || user.avatar.includes('unsplash'))) {
            user.avatar = avatar;
            await user.save();
        }

        const token = generateToken(user._id, user.role);

        res.json({
            success: true,
            message: 'Firebase session verified & synchronized',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                organization: user.organization,
                phone: user.phone,
                bio: user.bio
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone, organization, bio, avatar } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (organization) user.organization = organization;
        if (bio) user.bio = bio;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both current and new passwords' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user.id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (err) {
        next(err);
    }
};

