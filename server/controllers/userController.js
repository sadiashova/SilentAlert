const User = require('../models/User');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private / Admin
exports.getUsers = async (req, res, next) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { organization: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'All') {
            query.role = role;
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum) || 1,
            data: users
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private / Admin
exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: `User role updated to ${role}`,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private / Admin
exports.deleteUser = async (req, res, next) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User removed successfully'
        });
    } catch (err) {
        next(err);
    }
};
