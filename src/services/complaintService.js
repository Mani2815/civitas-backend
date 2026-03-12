const Complaint = require('../models/Complaint');
const StatusTimeline = require('../models/StatusTimeline');
const Staff = require('../models/Staff');
const Citizen = require('../models/Citizen');
const Department = require('../models/Department');
const { calculatePriorityScore } = require('../utils/priorityCalculator');

/**
 * Auto-assign a complaint to the least-loaded staff member.
 * Strategy C: match category → department first, then pick staff with fewest active complaints.
 * Falls back to any active staff if no department match found.
 */
async function autoAssignStaff(category) {
    // Step 1: Find the department that handles this category
    const dept = await Department.findOne({ categories: category, isActive: true }).lean();

    let candidates = [];

    if (dept) {
        candidates = await Staff.find({
            isActive: true,
            department: dept._id,
        }).select('_id').lean();
    }

    // Fallback: any active staff if no departmental match
    if (candidates.length === 0) {
        candidates = await Staff.find({ isActive: true }).select('_id').lean();
    }

    if (candidates.length === 0) return { staffId: null, departmentId: null };

    // Step 2: Count active (non-resolved/rejected) complaints per candidate
    const counts = await Promise.all(
        candidates.map(async (s) => {
            const count = await Complaint.countDocuments({
                assignedTo: s._id,
                status: { $nin: ['Resolved', 'Rejected'] },
            });
            return { staffId: s._id, count };
        })
    );

    // Step 3: Pick the least loaded
    counts.sort((a, b) => a.count - b.count);
    return {
        staffId: counts[0].staffId,
        departmentId: dept ? dept._id : null,
    };
}

const { cloudinary } = require('../config/cloudinary');

/**
 * Create a new complaint
 */
const createComplaint = async (complaintData, citizenId, files = []) => {
    // Upload files to Cloudinary if buffer exists, else fallback to disk
    const photos = [];
    for (const file of files) {
        if (file.buffer) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'civitas_complaints' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(file.buffer);
            });
            photos.push({
                url: result.secure_url,
                publicId: result.public_id,
            });
        } else if (file.filename) {
            photos.push({
                url: `/uploads/${file.filename}`,
                publicId: file.filename,
            });
        }
    }

    const complaint = await Complaint.create({
        ...complaintData,
        citizenId: citizenId,
        photos,
        location: {
            lat: parseFloat(complaintData.lat) || 0,
            lng: parseFloat(complaintData.lng) || 0,
        },
    });

    // Calculate initial priority
    const allComplaints = await Complaint.find({
        status: { $nin: ['Resolved', 'Rejected'] },
    }).lean();

    const { priorityScore, priorityLevel } = calculatePriorityScore(complaint, allComplaints);
    complaint.priorityScore = priorityScore;
    complaint.priorityLevel = priorityLevel;
    await complaint.save();

    // Auto-assign to least-loaded staff in matching department
    const { staffId, departmentId } = await autoAssignStaff(complaintData.category);
    if (staffId) {
        complaint.assignedTo = staffId;
        if (departmentId) complaint.department = departmentId;
        await complaint.save();
    }

    // Create initial timeline entry
    await StatusTimeline.create({
        complaintId: complaint._id,
        oldStatus: null,
        newStatus: 'Pending',
        updatedBy: citizenId,
        updatedByModel: 'Citizen',
        remarks: staffId ? 'Complaint filed and auto-assigned' : 'Complaint filed',
    });

    return complaint;
};

/**
 * Get complaints based on user role
 */
const getComplaints = async (user, queryParams = {}) => {
    const { status, category, priority, page = 1, limit = 20, sort = '-createdAt', scope } = queryParams;

    const filter = {};

    // Role-based filtering
    if (user.role === 'citizen') {
        if (scope !== 'city') {
            filter.citizenId = user._id;
        }
    } else if (user.role === 'staff') {
        filter.assignedTo = user._id;
    }
    // Admin sees all

    // Optional filters
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priorityLevel = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [complaints, total] = await Promise.all([
        Complaint.find(filter)
            .populate('citizenId', 'name email')
            .populate('assignedTo', 'name email')
            .populate('department', 'name')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Complaint.countDocuments(filter),
    ]);

    return {
        complaints,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
    };
};

/**
 * Get single complaint by ID with timeline and comments
 */
const getComplaintById = async (id, userId, userRole) => {
    const complaint = await Complaint.findById(id)
        .populate('citizenId', 'name email phone')
        .populate('assignedTo', 'name email')
        .populate('department', 'name description')
        .populate({
            path: 'timeline',
            populate: { path: 'updatedBy', select: 'name role' },
            options: { sort: { createdAt: 1 } },
        })
        .populate({
            path: 'comments',
            populate: { path: 'userId', select: 'name role' },
            options: { sort: { createdAt: -1 } },
            match: userRole === 'citizen' ? { isInternal: false } : {},
        });

    if (!complaint) return null;

    // Mask sensitive citizen info if not the owner and not staff/admin
    const isOwner = complaint.citizenId?._id?.toString() === userId.toString();
    const isPrivileged = userRole === 'admin' || userRole === 'staff';

    if (!isOwner && !isPrivileged && complaint.citizenId) {
        complaint.citizenId.email = undefined;
        complaint.citizenId.phone = undefined;
    }

    return complaint;
};

/**
 * Update complaint status
 */
const updateStatus = async (complaintId, newStatus, remarks, userId) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return null;

    const oldStatus = complaint.status;
    complaint.status = newStatus;
    complaint.resolutionRemarks = remarks || complaint.resolutionRemarks;

    if (newStatus === 'Resolved') {
        complaint.resolvedAt = new Date();
    }

    // Recalculate priority
    const allComplaints = await Complaint.find({
        status: { $nin: ['Resolved', 'Rejected'] },
    }).lean();
    const { priorityScore, priorityLevel } = calculatePriorityScore(complaint, allComplaints);
    complaint.priorityScore = priorityScore;
    complaint.priorityLevel = priorityLevel;

    await complaint.save();

    // Determine role of the user updating the status
    let modelName = 'Admin';
    if (await Staff.findById(userId)) modelName = 'Staff';
    if (await Citizen.findById(userId)) modelName = 'Citizen';

    // Create timeline entry
    await StatusTimeline.create({
        complaintId,
        oldStatus,
        newStatus,
        updatedBy: userId,
        updatedByModel: modelName,
        remarks: remarks || `Status changed to ${newStatus}`,
    });

    return complaint;
};

/**
 * Assign complaint to staff member
 */
const assignComplaint = async (complaintId, staffId, departmentId) => {
    const complaint = await Complaint.findByIdAndUpdate(
        complaintId,
        {
            assignedTo: staffId,
            department: departmentId || undefined,
        },
        { new: true }
    )
        .populate('assignedTo', 'name email')
        .populate('department', 'name');

    return complaint;
};

/**
 * Upvote a complaint
 */
const upvoteComplaint = async (complaintId, userId) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new Error('Complaint not found');
    }

    // Prevent upvoting resolved or rejected complaints
    if (['Resolved', 'Rejected'].includes(complaint.status)) {
        const error = new Error(`Cannot support a ${complaint.status.toLowerCase()} complaint`);
        error.statusCode = 400;
        throw error;
    }

    const upvoteIndex = complaint.upvotedBy.indexOf(userId);

    if (upvoteIndex > -1) {
        // Undo upvote
        complaint.upvotedBy.splice(upvoteIndex, 1);
        complaint.upvotes = Math.max(0, complaint.upvotes - 1);
    } else {
        // Add upvote
        complaint.upvotedBy.push(userId);
        complaint.upvotes += 1;
    }

    // Recalculate priority after upvote/downvote
    const allComplaints = await Complaint.find({
        status: { $nin: ['Resolved', 'Rejected'] },
    }).lean();
    const { priorityScore, priorityLevel } = calculatePriorityScore(complaint, allComplaints);
    complaint.priorityScore = priorityScore;
    complaint.priorityLevel = priorityLevel;
    
    await complaint.save();
    return complaint;
};

module.exports = {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateStatus,
    assignComplaint,
    upvoteComplaint,
};
