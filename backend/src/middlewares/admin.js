
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