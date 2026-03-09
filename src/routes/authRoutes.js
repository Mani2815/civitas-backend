const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getCurrentUser,
    getUsers,
    createStaff,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { registerRules, loginRules, validate } = require('../utils/validators');

// Public routes
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);

// Protected routes
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getCurrentUser);

// Admin routes
router.get('/users', verifyToken, requireRole('admin'), getUsers);
router.post('/create-staff', verifyToken, requireRole('admin'), createStaff);

module.exports = router;
