const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        complaintId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Complaint',
            required: [true, 'Complaint reference is required'],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'userModel',
            required: [true, 'User reference is required'],
        },
        userModel: {
            type: String,
            required: true,
            enum: ['Citizen', 'Staff', 'Admin'],
        },
        message: {
            type: String,
            required: [true, 'Comment message is required'],
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        isInternal: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fetching comments by complaint
commentSchema.index({ complaintId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
