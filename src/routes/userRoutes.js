const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes here are protected
router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
