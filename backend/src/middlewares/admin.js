/**
 * @function requireAdmin
 * @description Provide access to routes that admin role can access.
 */
const requireAdmin = (req, res, next) => {
    // Check if the role of the authenticated user or not
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    // If the user's role is 'admin', call the next middleware
    next();
};

module.exports = requireAdmin; 