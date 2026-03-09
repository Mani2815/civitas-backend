const mongoose = require('mongoose');

const statusTimelineSchema = new mongoose.Schema(
    {
        complaintId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Complaint',
            required: [true, 'Complaint reference is required'],
        },
        oldStatus: {
            type: String,
            enum: ['Pending', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected', null],
            default: null,
        },
        newStatus: {
            type: String,
            enum: ['Pending', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected'],
            required: [true, 'New status is required'],
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'updatedByModel',
            required: [true, 'Updated by user is required'],
        },
        updatedByModel: {
            type: String,
            required: true,
            enum: ['Citizen', 'Staff', 'Admin'],
        },
        remarks: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Index for fetching timeline by complaint
statusTimelineSchema.index({ complaintId: 1, createdAt: 1 });

module.exports = mongoose.model('StatusTimeline', statusTimelineSchema);
