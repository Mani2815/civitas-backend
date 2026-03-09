/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'staff', 'citizen')
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`,
            });
        }

        next();
    };
};

module.exports = { requireRole };
