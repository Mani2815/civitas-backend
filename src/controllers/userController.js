const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Citizen = require('../models/Citizen');
const asyncWrapper = require('../utils/asyncWrapper');

/**
 * Get current user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getProfile = asyncWrapper(async (req, res) => {
    // The user is already attached to req.user by verifyToken middleware
    // We just need to ensure we return the right format
    
    let user = req.user.toObject();
    delete user.password;

    res.status(200).json({
        success: true,
        user
    });
});

/**
 * Update current user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateProfile = asyncWrapper(async (req, res) => {
    const { name, phone } = req.body;
    const userId = req.user._id;
    const role = req.user.role;

    let user;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // Determine which model to update based on role
    if (role === 'admin') {
        user = await Admin.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true
        });
    } else if (role === 'staff') {
        user = await Staff.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true
        }).populate('department', 'name');
    } else {
        user = await Citizen.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true
        });
    }

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const updatedUser = user.toObject();
    delete updatedUser.password;
    updatedUser.role = role;

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
    });
});

module.exports = {
    getProfile,
    updateProfile
};
