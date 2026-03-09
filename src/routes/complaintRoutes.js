const express = require('express');
const router = express.Router();
const {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaintStatus,
    assignComplaint,
    deleteComplaint,
} = require('../controllers/complaintController');
const { addComment, getComments } = require('../controllers/commentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { complaintRules, commentRules, validate } = require('../utils/validators');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(verifyToken);

// Complaint CRUD
router.post(
    '/',
    requireRole('citizen'),
    upload.array('photos', 5),
    complaintRules,
    validate,
    createComplaint
);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);

// Status update (staff, admin)
router.patch('/:id/status', requireRole('staff', 'admin'), updateComplaintStatus);

// Assign complaint (admin only)
router.patch('/:id/assign', requireRole('admin'), assignComplaint);

// Delete complaint (admin only)
router.delete('/:id', requireRole('admin'), deleteComplaint);

// Comments
router.post('/:id/comments', commentRules, validate, addComment);
router.get('/:id/comments', getComments);

module.exports = router;
