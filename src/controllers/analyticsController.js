const asyncWrapper = require('../utils/asyncWrapper');
const analyticsService = require('../services/analyticsService');

/**
 * @route   GET /api/analytics/overview
 * @desc    Get dashboard overview statistics
 * @access  Private/Admin
 */
const getOverviewStats = asyncWrapper(async (req, res) => {
    const stats = await analyticsService.getOverviewStats();
    res.json({ success: true, data: stats });
});

/**
 * @route   GET /api/analytics/category-distribution
 * @desc    Get complaint category distribution (pie chart)
 * @access  Private/Admin
 */
const getCategoryDistribution = asyncWrapper(async (req, res) => {
    const data = await analyticsService.getCategoryDistribution();
    res.json({ success: true, data });
});

/**
 * @route   GET /api/analytics/status-distribution
 * @desc    Get complaint status distribution (bar chart)
 * @access  Private/Admin
 */
const getStatusDistribution = asyncWrapper(async (req, res) => {
    const data = await analyticsService.getStatusDistribution();
    res.json({ success: true, data });
});

/**
 * @route   GET /api/analytics/trends
 * @desc    Get filed vs resolved trend data (line chart)
 * @access  Private/Admin
 */
const getTrendData = asyncWrapper(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getTrendData(days);
    res.json({ success: true, data });
});

/**
 * @route   GET /api/analytics/departments
 * @desc    Get department performance comparison
 * @access  Private/Admin
 */
const getDepartmentPerformance = asyncWrapper(async (req, res) => {
    const data = await analyticsService.getDepartmentPerformance();
    res.json({ success: true, data });
});

/**
 * @route   GET /api/analytics/heatmap
 * @desc    Get heatmap data (GPS coordinates with frequency)
 * @access  Private/Admin
 */
const getHeatmapData = asyncWrapper(async (req, res) => {
    const data = await analyticsService.getHeatmapData();
    res.json({ success: true, data });
});

/**
 * @route   GET /api/analytics/citizen/stats
 * @desc    Get statistics for a specific citizen
 * @access  Private/Citizen
 */
const getCitizenStats = asyncWrapper(async (req, res) => {
    const stats = await analyticsService.getCitizenStats(req.user._id);
    res.json({ success: true, data: stats });
});

/**
 * @route   GET /api/analytics/city-stats
 * @desc    Get city-wide aggregate statistics (Public/Citizen)
 * @access  Private/Citizen/Staff/Admin
 */
const getCityStats = asyncWrapper(async (req, res) => {
    const [overview, categories, statuses] = await Promise.all([
        analyticsService.getOverviewStats(),
        analyticsService.getCategoryDistribution(),
        analyticsService.getStatusDistribution(),
    ]);

    res.json({
        success: true,
        data: {
            overview: {
                total: overview.totalComplaints,
                resolved: overview.resolvedCount,
                pending: overview.pendingCount,
                avgTime: overview.avgResolutionTime,
            },
            categories,
            statuses,
        },
    });
});

/**
 * @route   GET /api/analytics/impact-stats
 * @desc    Get public impact statistics for landing page
 * @access  Public
 */
const getPublicImpactStats = asyncWrapper(async (req, res) => {
    const stats = await analyticsService.getPublicImpactStats();
    res.json({ success: true, data: stats });
});

module.exports = {
    getOverviewStats,
    getCategoryDistribution,
    getStatusDistribution,
    getTrendData,
    getDepartmentPerformance,
    getHeatmapData,
    getCitizenStats,
    getCityStats,
    getPublicImpactStats,
};
