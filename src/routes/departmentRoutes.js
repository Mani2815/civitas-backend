const express = require('express');
const router = express.Router();
const {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    assignStaff,
} = require('../controllers/departmentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(verifyToken);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

// Admin only
router.post('/', requireRole('admin'), createDepartment);
router.put('/:id', requireRole('admin'), updateDepartment);
router.patch('/:id/assign-staff', requireRole('admin'), assignStaff);

module.exports = router;
