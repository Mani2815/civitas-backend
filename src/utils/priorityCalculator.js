const Complaint = require('../models/Complaint');

/**
 * Category weight scores — inherent risk/impact of each category (0-100)
 */
const CATEGORY_WEIGHTS = {
    Electricity: 95,
    Water: 90,
    Roads: 85,
    Sanitation: 75,
    Waste: 60,
    Noise: 50,
    Parks: 40,
    Other: 30,
};

/**
 * Calculate the time-based score component
 * Score increases linearly with hours pending, capping at 100 after 72h
 * @param {Date} createdAt - Complaint creation timestamp
 * @returns {number} Time score (0-100)
 */
const calculateTimeScore = (createdAt) => {
    const hoursPending = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return Math.min(Math.round((hoursPending / 72) * 100), 100);
};

/**
 * Calculate hotspot score based on nearby complaint density
 * Complaints within ~1km radius contribute to hotspot scoring
 * @param {Object} location - { lat, lng } of the complaint
 * @param {Array} allComplaints - All active complaints to compare against
 * @returns {number} Hotspot score (0-100)
 */
const calculateHotspotScore = (location, allComplaints) => {
    if (!location || !location.lat || !location.lng) return 0;

    const RADIUS_KM = 1;
    // Approximate conversion: 1 degree lat ≈ 111km
    const latThreshold = RADIUS_KM / 111;
    const lngThreshold = RADIUS_KM / (111 * Math.cos((location.lat * Math.PI) / 180));

    const nearbyCount = allComplaints.filter((c) => {
        if (!c.location || !c.location.lat || !c.location.lng) return false;
        const latDiff = Math.abs(c.location.lat - location.lat);
        const lngDiff = Math.abs(c.location.lng - location.lng);
        return latDiff <= latThreshold && lngDiff <= lngThreshold;
    }).length;

    // Each nearby complaint adds 10 points, cap at 100
    return Math.min(nearbyCount * 10, 100);
};

/**
 * Calculate priority score for a single complaint
 * Formula: (categoryWeight × 0.4) + (time × 0.3) + (hotspot × 0.3)
 * @param {Object} complaint - Complaint document
 * @param {Array} allComplaints - All active complaints for hotspot calculation
 * @returns {Object} { priorityScore, priorityLevel }
 */
const calculatePriorityScore = (complaint, allComplaints = []) => {
    const categoryScore = CATEGORY_WEIGHTS[complaint.category] || 30;
    const timeScore = calculateTimeScore(complaint.createdAt);
    const hotspotScore = calculateHotspotScore(complaint.location, allComplaints);

    const priorityScore = Math.round(
        categoryScore * 0.4 + timeScore * 0.3 + hotspotScore * 0.3
    );

    let priorityLevel = 'Low';
    if (priorityScore >= 80) priorityLevel = 'Critical';
    else if (priorityScore >= 60) priorityLevel = 'High';
    else if (priorityScore >= 40) priorityLevel = 'Medium';

    return { priorityScore, priorityLevel };
};

/**
 * Recalculate priorities for all active (non-resolved/rejected) complaints
 * Called periodically via cron job
 */
const recalculateAllPriorities = async () => {
    try {
        const activeComplaints = await Complaint.find({
            status: { $nin: ['Resolved', 'Rejected'] },
        }).lean();

        for (const complaint of activeComplaints) {
            const { priorityScore, priorityLevel } = calculatePriorityScore(
                complaint,
                activeComplaints
            );

            // Check SLA breach
            const slaBreach =
                complaint.slaDeadline && new Date() > new Date(complaint.slaDeadline);

            await Complaint.findByIdAndUpdate(complaint._id, {
                priorityScore,
                priorityLevel,
                slaBreach,
            });
        }

        console.log(`Priority recalculated for ${activeComplaints.length} complaints`);
    } catch (error) {
        console.error('Priority recalculation error:', error.message);
    }
};

module.exports = {
    calculatePriorityScore,
    recalculateAllPriorities,
    calculateTimeScore,
    calculateHotspotScore,
    CATEGORY_WEIGHTS,
};
