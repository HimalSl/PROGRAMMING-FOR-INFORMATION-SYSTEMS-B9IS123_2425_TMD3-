/**
 * @function requireAdmin
 * @description Middleware to restrict access to routes only to users with the 'admin' role.
 * This middleware assumes that a previous authentication middleware (like `authenticateToken`)
 * has already run and successfully attached the `user` object (including their `role`)
 * to the `req` (request) object.
 *
 */
const requireAdmin = (req, res, next) => {
    // Check if the role of the authenticated user (from req.user) is not 'admin'.
    if (req.user.role !== 'admin') {
        // This prevents unauthorized users from accessing the protected resource.
        return res.status(403).json({ message: 'Admin access required' });
    }

    // If the user's role is 'admin', call the next middleware or route handler.
    next();
};

module.exports = requireAdmin; 