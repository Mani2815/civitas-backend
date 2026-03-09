require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const { recalculateAllPriorities } = require('./utils/priorityCalculator');
const cron = require('node-cron');

const PORT = process.env.PORT || 5000;

// Global Unhandled Promise Rejection Handler
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    process.exit(1);
});

const startServer = async () => {
    try {
        // ✅ Connect to MongoDB Atlas
        await connectDB();

        // ✅ Configure Cloudinary if enabled
        if (process.env.USE_CLOUDINARY === 'true') {
            configureCloudinary();
            console.log('Cloudinary configured');
        }

        // ✅ Schedule priority recalculation every hour
        cron.schedule('0 * * * *', async () => {
            console.log('[CRON] Running priority recalculation...');
            try {
                await recalculateAllPriorities();
                console.log('[CRON] Priority recalculation completed');
            } catch (error) {
                console.error('[CRON] Error recalculating priorities:', error.message);
            }
        });

        // ✅ Start Express Server
        app.listen(PORT, () => {
            console.log(`\n========================================`);
            console.log(`  Smart City CMS API Server`);
            console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`  Port: ${PORT}`);
            console.log(`  API: http://localhost:${PORT}/api`);
            console.log(`========================================\n`);
        });

    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();