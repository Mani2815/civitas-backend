require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

// Connect to DB temporarily for migration if needed
// Or assume standard connection from process
const migrateUsers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully. Starting migration...\n');

        const db = mongoose.connection.db;

        // Ensure new collections exist or let Mongoose/MongoDB create them implicitly
        const usersCol = db.collection('users');
        const citizensCol = db.collection('citizens');
        const staffCol = db.collection('staffs'); // Mongoose defaults typically append 's'
        const adminsCol = db.collection('admins');

        const complaintsCol = db.collection('complaints');
        const commentsCol = db.collection('comments');
        const timelinesCol = db.collection('statustimelines');

        const users = await usersCol.find({}).toArray();
        console.log(`Found ${users.length} users to migrate.`);

        if (users.length === 0) {
            console.log('No users to migrate. Existing users collection is empty or missing.');
            process.exit(0);
        }

        const citizens = [];
        const staff = [];
        const admins = [];

        for (const user of users) {
            const userDoc = {
                ...user
            };
            // Ensure we don't carry over the generic 'role' field unnecessarily, or keep it for safety during transition
            // delete userDoc.role; 

            if (user.role === 'citizen') {
                citizens.push(userDoc);
            } else if (user.role === 'staff') {
                staff.push(userDoc);
            } else if (user.role === 'admin') {
                admins.push(userDoc);
            }
        }

        if (citizens.length > 0) {
            await citizensCol.insertMany(citizens);
            console.log(`Migrated ${citizens.length} citizens.`);
        }
        if (staff.length > 0) {
            await staffCol.insertMany(staff);
            console.log(`Migrated ${staff.length} staff.`);
        }
        if (admins.length > 0) {
            await adminsCol.insertMany(admins);
            console.log(`Migrated ${admins.length} admins.`);
        }

        console.log('\nUpdating Complaints...');
        // Update citizen -> citizenId for complaints
        await complaintsCol.updateMany({}, { $rename: { 'citizen': 'citizenId' } });
        console.log('Complaints citizen reference renamed to citizenId.');

        console.log('\nUpdating Comments...');
        // Set userModel for comments
        const allComments = await commentsCol.find({}).toArray();
        let commentsUpdated = 0;
        for (const comment of allComments) {
            // Find which role this user belonged to
            const user = users.find(u => u._id.toString() === comment.userId.toString());
            if (user) {
                const modelName = user.role === 'citizen' ? 'Citizen' : (user.role === 'staff' ? 'Staff' : 'Admin');
                await commentsCol.updateOne({ _id: comment._id }, { $set: { userModel: modelName } });
                commentsUpdated++;
            }
        }
        console.log(`Updated userModel for ${commentsUpdated}/${allComments.length} comments.`);

        console.log('\nUpdating StatusTimelines...');
        // Set updatedByModel for Timelines
        const allTimelines = await timelinesCol.find({}).toArray();
        let timelinesUpdated = 0;
        for (const timeline of allTimelines) {
            const user = users.find(u => u._id.toString() === timeline.updatedBy.toString());
            if (user) {
                const modelName = user.role === 'citizen' ? 'Citizen' : (user.role === 'staff' ? 'Staff' : 'Admin');
                await timelinesCol.updateOne({ _id: timeline._id }, { $set: { updatedByModel: modelName } });
                timelinesUpdated++;
            }
        }
        console.log(`Updated updatedByModel for ${timelinesUpdated}/${allTimelines.length} timelines.`);

        console.log('\nMigration completed successfully.');

        // DANGEROUS! Better to rename than drop just in case
        console.log('Renaming "users" collection to "old_users_backup"...');
        try {
            await db.renameCollection('users', 'old_users_backup');
            console.log('Collection renamed successfully.');
        } catch (e) {
            console.log('Could not rename collection (it might already exist or be locked). Error:', e.message);
        }

        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateUsers();
