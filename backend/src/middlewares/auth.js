// Import the jsonwebtoken library for working with JWTs
const jwt = require('jsonwebtoken');
// Import the User model (Mongoose schema)
const User = require('../models/User');
// Import the JWT secret from the configuration file 
const { secret } = require('../config/jwt'); 

/**
 * @function authenticateToken
 * @description Middleware to authenticate requests using a JSON Web Token (JWT).
 * It checks for a token in the Authorization header, verifies it,
 * and attaches the authenticated user to the request object.
 */
const authenticateToken = async (req, res, next) => {
    // Get the Authorization header from the request
    const authHeader = req.headers['authorization'];
    // Extract the token from the header
    const token = authHeader && authHeader.split(' ')[1];

    // If no token is provided in the request
    if (!token) {
        // Return a 401 Unauthorized status with a message
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        // Verify the token using the imported secret key.
        const decoded = jwt.verify(token, secret);

        // Find the user in the database based on the userId extracted from the decoded token.
        const user = await User.findById(decoded.userId);

        // If no user is found with the ID from the token, it means the token is invalid or the user no longer exists.
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Attach the found user object to the request object.
        req.user = user;
        
        // Call the next middleware function in the stack.
        next();
    } catch (error) {
        // If jwt.verify fails (e.g., token is expired, malformed, or signature is invalid)
        // or if any other error occurs during the process.
        return res.status(403).json({ message: 'Invalid token' }); 
    }
};

module.exports = authenticateToken;