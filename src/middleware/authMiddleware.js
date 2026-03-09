const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Citizen = require('../models/Citizen');

/**
 * Verify JWT token from Authorization header or cookies
 * Attaches user object to req.user
 */
const verifyToken = async (req, res, next) => {
    try {
        let token;

        // Check Authorization header first
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Then check cookies
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        let user;
        if (decoded.role === 'admin') {
            user = await Admin.findById(decoded.id);
        } else if (decoded.role === 'staff') {
            user = await Staff.findById(decoded.id);
        } else {
            user = await Citizen.findById(decoded.id);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token is valid but user no longer exists.',
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated.',
            });
        }

        // Attach user and role to req
        req.user = user;
        req.user.role = decoded.role; // Add role explicitly to the user object

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired.',
            });
        }
        next(error);
    }
};

module.exports = { verifyToken };
