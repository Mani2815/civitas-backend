const { body, validationResult } = require('express-validator');

/**
 * Process validation results and return errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

/**
 * Registration validation rules
 */
const registerRules = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];

/**
 * Login validation rules
 */
const loginRules = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Complaint creation validation rules
 */
const complaintRules = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
    body('category')
        .isIn(['Water', 'Roads', 'Electricity', 'Sanitation', 'Waste', 'Parks', 'Noise', 'Other'])
        .withMessage('Invalid category'),
    body('address').trim().notEmpty().withMessage('Address is required'),
];

/**
 * Comment validation rules
 */
const commentRules = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ max: 1000 })
        .withMessage('Comment cannot exceed 1000 characters'),
];

module.exports = {
    validate,
    registerRules,
    loginRules,
    complaintRules,
    commentRules,
};
