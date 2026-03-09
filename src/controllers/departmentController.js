const Department = require('../models/Department');
const Staff = require('../models/Staff');
const asyncWrapper = require('../utils/asyncWrapper');

/**
 * @route   POST /api/departments
 * @desc    Create department
 * @access  Private/Admin
 */
const createDepartment = asyncWrapper(async (req, res) => {
    const { name, description, categories } = req.body;

    const existing = await Department.findOne({ name });
    if (existing) {
        return res.status(400).json({
            success: false,
            message: 'Department already exists',
        });
    }

    const department = await Department.create({ name, description, categories });

    res.status(201).json({
        success: true,
        message: 'Department created',
        data: { department },
    });
});

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Private
 */
const getDepartments = asyncWrapper(async (req, res) => {
    const departments = await Department.find({ isActive: true })
        .populate('staffMembers', 'name email')
        .populate('complaintCount');

    res.json({
        success: true,
        data: { departments },
    });
});

/**
 * @route   GET /api/departments/:id
 * @desc    Get single department
 * @access  Private
 */
const getDepartmentById = asyncWrapper(async (req, res) => {
    const department = await Department.findById(req.params.id)
        .populate('staffMembers', 'name email')
        .populate('complaintCount');

    if (!department) {
        return res.status(404).json({
            success: false,
            message: 'Department not found',
        });
    }

    res.json({
        success: true,
        data: { department },
    });
});

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private/Admin
 */
const updateDepartment = asyncWrapper(async (req, res) => {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!department) {
        return res.status(404).json({
            success: false,
            message: 'Department not found',
        });
    }

    res.json({
        success: true,
        message: 'Department updated',
        data: { department },
    });
});

/**
 * @route   PATCH /api/departments/:id/assign-staff
 * @desc    Assign staff to department
 * @access  Private/Admin
 */
const assignStaff = asyncWrapper(async (req, res) => {
    const { staffId } = req.body;

    const user = await Staff.findById(staffId);
    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid staff member',
        });
    }

    user.department = req.params.id;
    await user.save();

    res.json({
        success: true,
        message: 'Staff assigned to department',
        data: { user },
    });
});

module.exports = {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    assignStaff,
};
