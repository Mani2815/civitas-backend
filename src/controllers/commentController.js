const Comment = require('../models/Comment');
const asyncWrapper = require('../utils/asyncWrapper');

/**
 * @route   POST /api/complaints/:id/comments
 * @desc    Add comment to complaint
 * @access  Private
 */
const addComment = asyncWrapper(async (req, res) => {
    const { message, isInternal } = req.body;

    // Only staff and admin can add internal comments
    const internal = isInternal && ['staff', 'admin'].includes(req.user.role);

    const modelName = req.user.role === 'citizen' ? 'Citizen' : (req.user.role === 'staff' ? 'Staff' : 'Admin');

    const comment = await Comment.create({
        complaintId: req.params.id,
        userId: req.user._id,
        userModel: modelName,
        message,
        isInternal: internal,
    });

    const populated = await Comment.findById(comment._id).populate('userId', 'name role');

    res.status(201).json({
        success: true,
        message: 'Comment added',
        data: { comment: populated },
    });
});

/**
 * @route   GET /api/complaints/:id/comments
 * @desc    Get comments for a complaint
 * @access  Private
 */
const getComments = asyncWrapper(async (req, res) => {
    const filter = { complaintId: req.params.id };

    // Citizens can only see public comments
    if (req.user.role === 'citizen') {
        filter.isInternal = false;
    }

    const comments = await Comment.find(filter)
        .populate('userId', 'name role')
        .sort('-createdAt');

    res.json({
        success: true,
        data: { comments },
    });
});

module.exports = { addComment, getComments };
