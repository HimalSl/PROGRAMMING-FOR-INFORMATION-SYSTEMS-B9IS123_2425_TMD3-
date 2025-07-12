const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { secret } = require('../config/jwt'); 

// when user tries to access a protected route this middleware will check if the user is authenticated
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.userId);

        // If no token found that token is invalid
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' }); 
    }
};

module.exports = authenticateToken;