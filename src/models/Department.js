const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Department name is required'],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        categories: [
            {
                type: String,
                enum: ['Water', 'Roads', 'Electricity', 'Sanitation', 'Waste', 'Parks', 'Noise', 'Other'],
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for staff members in this department
departmentSchema.virtual('staffMembers', {
    ref: 'Staff',
    localField: '_id',
    foreignField: 'department',
});

// Virtual for complaint count
departmentSchema.virtual('complaintCount', {
    ref: 'Complaint',
    localField: '_id',
    foreignField: 'department',
    count: true,
});

module.exports = mongoose.model('Department', departmentSchema);
