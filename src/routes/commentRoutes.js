const express = require('express');
const router = express.Router();

// Comment routes are nested under complaint routes
// This file exists for any standalone comment operations if needed
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// All comment routes are handled via /api/complaints/:id/comments
// See complaintRoutes.js

module.exports = router;
