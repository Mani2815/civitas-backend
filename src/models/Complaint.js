const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Complaint title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['Water', 'Roads', 'Electricity', 'Sanitation', 'Waste', 'Parks', 'Noise', 'Other'],
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        location: {
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },
        photos: [
            {
                url: { type: String },
                publicId: { type: String },
            },
        ],
        citizenId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Citizen',
            required: [true, 'Citizen reference is required'],
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Staff',
            default: null,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            default: null,
        },
        status: {
            type: String,
            enum: ['Pending', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected'],
            default: 'Pending',
        },
        priorityScore: {
            type: Number,
            default: 0,
        },
        priorityLevel: {
            type: String,
            enum: ['Critical', 'High', 'Medium', 'Low'],
            default: 'Low',
        },
        slaDeadline: {
            type: Date,
            default: null,
        },
        slaBreach: {
            type: Boolean,
            default: false,
        },
        resolutionRemarks: {
            type: String,
            trim: true,
            default: '',
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
        upvotes: {
            type: Number,
            default: 0,
        },
        upvotedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Citizen',
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for query performance
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priorityScore: -1 });
complaintSchema.index({ upvotes: -1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ department: 1 });
complaintSchema.index({ 'location.lat': 1, 'location.lng': 1 });

// Virtual for timeline entries
complaintSchema.virtual('timeline', {
    ref: 'StatusTimeline',
    localField: '_id',
    foreignField: 'complaintId',
});

// Virtual for comments
complaintSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'complaintId',
});

// Calculate SLA deadline based on priorityLevel before saving
complaintSchema.pre('save', function (next) {
    if (this.isNew && !this.slaDeadline) {
        const slaHours = {
            Critical: 24,
            High: 48,
            Medium: 72,
            Low: 168, // 7 days
        };
        const hours = slaHours[this.priorityLevel] || 72;
        this.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    // Check SLA breach
    if (
        this.slaDeadline &&
        this.status !== 'Resolved' &&
        this.status !== 'Rejected' &&
        new Date() > this.slaDeadline
    ) {
        this.slaBreach = true;
    }

    next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
