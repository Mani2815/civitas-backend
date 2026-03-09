const asyncWrapper = require('../utils/asyncWrapper');
const complaintService = require('../services/complaintService');
const Complaint = require('../models/Complaint');

/**
 * @route   POST /api/complaints
 * @desc    Create new complaint
 * @access  Private/Citizen
 */
const createComplaint = asyncWrapper(async (req, res) => {
    const complaint = await complaintService.createComplaint(
        req.body,
        req.user._id,
        req.files || []
    );

    const populated = await Complaint.findById(complaint._id)
        .populate('citizenId', 'name email')
        .populate('department', 'name');

    res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully',
        data: { complaint: populated },
    });
});

/**
 * @route   GET /api/complaints
 * @desc    Get complaints (role-based)
 * @access  Private
 */
const getComplaints = asyncWrapper(async (req, res) => {
    const result = await complaintService.getComplaints(req.user, req.query);

    res.json({
        success: true,
        data: result,
    });
});

/**
 * @route   GET /api/complaints/:id
 * @desc    Get single complaint
 * @access  Private
 */
const getComplaintById = asyncWrapper(async (req, res) => {
    const complaint = await complaintService.getComplaintById(
        req.params.id,
        req.user._id,
        req.user.role
    );

    if (!complaint) {
        return res.status(404).json({
            success: false,
            message: 'Complaint not found',
        });
    }

    res.json({
        success: true,
        data: { complaint },
    });
});

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private/Staff/Admin
 */
const updateComplaintStatus = asyncWrapper(async (req, res) => {
    const { status, remarks } = req.body;

    const validStatuses = ['Pending', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
    }

    const complaint = await complaintService.updateStatus(
        req.params.id,
        status,
        remarks,
        req.user._id
    );

    if (!complaint) {
        return res.status(404).json({
            success: false,
            message: 'Complaint not found',
        });
    }

    res.json({
        success: true,
        message: `Complaint status updated to ${status}`,
        data: { complaint },
    });
});

/**
 * @route   PATCH /api/complaints/:id/assign
 * @desc    Assign complaint to staff
 * @access  Private/Admin
 */
const assignComplaint = asyncWrapper(async (req, res) => {
    const { staffId, departmentId } = req.body;

    if (!staffId) {
        return res.status(400).json({
            success: false,
            message: 'Staff ID is required',
        });
    }

    const complaint = await complaintService.assignComplaint(
        req.params.id,
        staffId,
        departmentId
    );

    if (!complaint) {
        return res.status(404).json({
            success: false,
            message: 'Complaint not found',
        });
    }

    res.json({
        success: true,
        message: 'Complaint assigned successfully',
        data: { complaint },
    });
});

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete complaint (admin only)
 * @access  Private/Admin
 */
const deleteComplaint = asyncWrapper(async (req, res) => {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);

    if (!complaint) {
        return res.status(404).json({
            success: false,
            message: 'Complaint not found',
        });
    }

    res.json({
        success: true,
        message: 'Complaint deleted successfully',
    });
});

module.exports = {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaintStatus,
    assignComplaint,
    deleteComplaint,
};
