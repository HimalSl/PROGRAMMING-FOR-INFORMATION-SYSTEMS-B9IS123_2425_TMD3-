const User = require('../models/User');

// Get user profile details
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -verificationToken');
        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Failed to load profile' });
    }
};