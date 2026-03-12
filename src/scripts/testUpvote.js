const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Complaint = require('../models/Complaint');
const Citizen = require('../models/Citizen');
const { upvoteComplaint } = require('../services/complaintService');

dotenv.config(); // This will look for .env in the current working directory (backend/)

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get a citizen or create one
        let citizen = await Citizen.findOne();
        if (!citizen) {
            console.log('No citizen found, creating temporary citizen...');
            citizen = await Citizen.create({
                name: 'Test Citizen',
                email: `test_citizen_${Date.now()}@example.com`,
                password: 'password123'
            });
        }
        console.log(`Using citizen ID: ${citizen._id}`);

        // 2. Create a test complaint
        const complaint = await Complaint.create({
            title: 'Test Upvote Complaint',
            description: 'Testing upvote functionality',
            category: 'Water',
            address: '123 Test St',
            citizenId: citizen._id,
            status: 'Pending'
        });
        console.log(`Created test complaint: ${complaint._id}`);
        console.log(`Initial upvotes: ${complaint.upvotes}, Priority Score: ${complaint.priorityScore}`);

        // 3. Upvote once
        const updated1 = await upvoteComplaint(complaint._id, citizen._id);
        console.log(`After 1st upvote - upvotes: ${updated1.upvotes}, Priority Score: ${updated1.priorityScore}`);

        if (updated1.upvotes !== 1) throw new Error('Upvote count mismatch');

        // 4. Try upvoting again (should fail)
        try {
            await upvoteComplaint(complaint._id, citizen._id);
            console.log('Error: Second upvote succeeded (SHOULD HAVE FAILED)');
        } catch (err) {
            console.log(`Success: Second upvote failed as expected: ${err.message}`);
        }

        // Cleanup
        await Complaint.findByIdAndDelete(complaint._id);
        console.log('Deleted test complaint');

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

runTest();
