const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Citizen = require('../models/Citizen');
const asyncWrapper = require('../utils/asyncWrapper');

/**
 * Generate JWT token
 */
const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new citizen
 * @access  Public
 */
const register = asyncWrapper(async (req, res) => {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await Citizen.findOne({ email }) ||
        await Staff.findOne({ email }) ||
        await Admin.findOne({ email });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered',
        });
    }

    const user = await Citizen.create({
        name,
        email,
        password,
        phone,
        isActive: true
    });

    const token = generateToken(user._id, 'citizen');

    // Set cookie (consistent with login)
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: 'citizen',
            },
            token,
        },
    });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;

    // Get user with password field
    let user = await Citizen.findOne({ email }).select('+password');
    let role = 'citizen';

    if (!user) {
        user = await Staff.findOne({ email }).select('+password').populate('department', 'name');
        role = 'staff';
    }

    if (!user) {
        user = await Admin.findOne({ email }).select('+password');
        role = 'admin';
    }
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
        });
    }

    if (!user.isActive) {
        return res.status(401).json({
            success: false,
            message: 'Account has been deactivated. Contact administrator.',
        });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
        });
    }

    const token = generateToken(user._id, role);

    // Set cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: role,
                department: role === 'staff' ? user.department : undefined,
            },
            token,
        },
    });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
const logout = asyncWrapper(async (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
    });

    res.json({
        success: true,
        message: 'Logout successful',
    });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
const getCurrentUser = asyncWrapper(async (req, res) => {
    let user;
    let role = req.user.role;
    if (role === 'admin') {
        user = await Admin.findById(req.user._id);
    } else if (role === 'staff') {
        user = await Staff.findById(req.user._id).populate('department', 'name');
    } else {
        user = await Citizen.findById(req.user._id);
    }

    // Attach role since it's implied by collection now
    const userObj = user.toJSON();
    userObj.role = role;

    res.json({
        success: true,
        data: { user: userObj },
    });
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
const getUsers = asyncWrapper(async (req, res) => {
    const { role, ...restQuery } = req.query;
    const filter = { ...restQuery };

    let users = [];
    if (role === 'admin') {
        users = await Admin.find(filter).sort('name').lean();
        users.forEach(u => u.role = 'admin');
    } else if (role === 'staff') {
        users = await Staff.find(filter).populate('department', 'name').sort('name').lean();
        users.forEach(u => u.role = 'staff');
    } else if (role === 'citizen') {
        users = await Citizen.find(filter).sort('name').lean();
        users.forEach(u => u.role = 'citizen');
    } else {
        const [admins, staffs, citizens] = await Promise.all([
            Admin.find(filter).sort('name').lean(),
            Staff.find(filter).populate('department', 'name').sort('name').lean(),
            Citizen.find(filter).sort('name').lean()
        ]);
        admins.forEach(u => u.role = 'admin');
        staffs.forEach(u => u.role = 'staff');
        citizens.forEach(u => u.role = 'citizen');
        users = [...admins, ...staffs, ...citizens].sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json({
        success: true,
        data: { users },
    });
});

/**
 * @route   POST /api/auth/create-staff
 * @desc    Create staff account (admin only)
 * @access  Private/Admin
 */
const createStaff = asyncWrapper(async (req, res) => {
    const { name, email, password, department, phone } = req.body;

    const existingUser = await Citizen.findOne({ email }) ||
        await Staff.findOne({ email }) ||
        await Admin.findOne({ email });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered',
        });
    }

    const user = await Staff.create({
        name,
        email,
        password,
        phone,
        department,
        isActive: true
    });

    res.status(201).json({
        success: true,
        message: 'Staff account created',
        data: { user },
    });
});

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    getUsers,
    createStaff,
};
