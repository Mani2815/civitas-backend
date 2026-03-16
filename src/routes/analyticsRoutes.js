const express = require('express');
const router = express.Router();
const {
    getOverviewStats,
    getCategoryDistribution,
    getStatusDistribution,
    getTrendData,
    getDepartmentPerformance,
    getHeatmapData,
    getCitizenStats,
    getCityStats,
    getPublicImpactStats,
} = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Routes accessible to citizens
router.get('/citizen/stats', verifyToken, requireRole('citizen'), getCitizenStats);
router.get('/city-stats', verifyToken, getCityStats);
router.get('/impact-stats', getPublicImpactStats);

router.use(verifyToken, requireRole('admin'));

router.get('/overview', getOverviewStats);
router.get('/category-distribution', getCategoryDistribution);
router.get('/status-distribution', getStatusDistribution);
router.get('/trends', getTrendData);
router.get('/departments', getDepartmentPerformance);
router.get('/heatmap', getHeatmapData);

module.exports = router;
