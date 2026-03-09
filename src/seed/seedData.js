require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Citizen = require('../models/Citizen');
const Staff = require('../models/Staff');
const Admin = require('../models/Admin');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const StatusTimeline = require('../models/StatusTimeline');
const Comment = require('../models/Comment');
const { calculatePriorityScore } = require('../utils/priorityCalculator');

const seedDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully.\n');

        // Clear existing data
        console.log('Clearing existing data...');
        await Promise.all([
            Citizen.deleteMany({}),
            Staff.deleteMany({}),
            Admin.deleteMany({}),
            Department.deleteMany({}),
            Complaint.deleteMany({}),
            StatusTimeline.deleteMany({}),
            Comment.deleteMany({}),
        ]);
        console.log('Data cleared.\n');

        // ── Create Departments ──
        console.log('Creating departments...');
        const departments = await Department.insertMany([
            {
                name: 'Water Supply',
                description: 'Handles water supply, leakage, and pipeline complaints',
                categories: ['Water'],
            },
            {
                name: 'Roads & Transport',
                description: 'Manages road infrastructure, potholes, and traffic issues',
                categories: ['Roads'],
            },
            {
                name: 'Electrical Services',
                description: 'Manages electricity supply, streetlights, and power outages',
                categories: ['Electricity'],
            },
            {
                name: 'Sanitation & Waste',
                description: 'Handles sanitation, waste collection, and cleanliness',
                categories: ['Sanitation', 'Waste'],
            },
            {
                name: 'Parks & Recreation',
                description: 'Manages parks, public spaces, and recreation facilities',
                categories: ['Parks', 'Noise', 'Other'],
            },
        ]);
        console.log(`  Created ${departments.length} departments`);

        // ── Create Users ──
        console.log('Creating users...');
        const admin = await Admin.create({
            name: 'Admin User',
            email: 'admin@demo.com',
            password: 'password123',
            mustChangePassword: false,
            phone: '+91 9876543210',
        });

        const staffMembers = await Promise.all([
            Staff.create({
                name: 'Rajesh Kumar',
                email: 'staff@demo.com',
                password: 'password123',
                department: departments[0]._id,
                phone: '+91 9876543211',
            }),
            Staff.create({
                name: 'Priya Sharma',
                email: 'staff2@demo.com',
                password: 'password123',
                department: departments[1]._id,
                phone: '+91 9876543212',
            }),
            Staff.create({
                name: 'Amit Patel',
                email: 'staff3@demo.com',
                password: 'password123',
                department: departments[2]._id,
                phone: '+91 9876543213',
            }),
            Staff.create({
                name: 'Deepa Nair',
                email: 'staff4@demo.com',
                password: 'password123',
                department: departments[3]._id,
                phone: '+91 9876543214',
            }),
            Staff.create({
                name: 'Vikram Singh',
                email: 'staff5@demo.com',
                password: 'password123',
                department: departments[4]._id,
                phone: '+91 9876543215',
            }),
        ]);

        const citizens = await Promise.all([
            Citizen.create({
                name: 'Citizen User',
                email: 'citizen@demo.com',
                password: 'password123',
                phone: '+91 9876543220',
            }),
            Citizen.create({
                name: 'Ananya Verma',
                email: 'citizen2@demo.com',
                password: 'password123',
                phone: '+91 9876543221',
            }),
            Citizen.create({
                name: 'Suresh Iyer',
                email: 'citizen3@demo.com',
                password: 'password123',
                phone: '+91 9876543222',
            }),
        ]);

        console.log(`  Created 1 admin, ${staffMembers.length} staff, ${citizens.length} citizens`);

        // ── Create Complaints ──
        console.log('Creating complaints...');
        const complaintData = [
            {
                title: 'Major water pipeline burst on MG Road',
                description: 'A large water pipeline has burst near MG Road junction causing flooding and water wastage. The area is becoming waterlogged and causing traffic disruption. Immediate repair needed.',
                category: 'Water',
                severity: 'Critical',
                address: '123 MG Road, Bangalore 560001',
                location: { lat: 12.9716, lng: 77.5946 },
                citizenId: citizens[0]._id,
                assignedTo: staffMembers[0]._id,
                department: departments[0]._id,
                status: 'In Progress',
            },
            {
                title: 'Pothole causing accidents near City Mall',
                description: 'A deep pothole has formed on the main road near City Mall. Two-wheeler riders have fallen multiple times. The pothole is approximately 3 feet wide and 1 foot deep.',
                category: 'Roads',
                severity: 'High',
                address: '456 Brigade Road, Bangalore 560025',
                location: { lat: 12.9722, lng: 77.6070 },
                citizenId: citizens[1]._id,
                assignedTo: staffMembers[1]._id,
                department: departments[1]._id,
                status: 'Acknowledged',
            },
            {
                title: 'Streetlights not working on 5th Cross',
                description: 'All streetlights on 5th Cross, Jayanagar have been non-functional for the past week. The area becomes very dark after sunset, creating safety concerns for pedestrians.',
                category: 'Electricity',
                severity: 'Medium',
                address: '5th Cross, Jayanagar, Bangalore 560041',
                location: { lat: 12.9279, lng: 77.5937 },
                citizenId: citizens[0]._id,
                assignedTo: staffMembers[2]._id,
                department: departments[2]._id,
                status: 'Pending',
            },
            {
                title: 'Garbage overflow at community bin',
                description: 'The community garbage bin near Dairy Circle has not been cleaned for 5 days. Garbage is overflowing onto the road, creating unhygienic conditions and foul smell.',
                category: 'Waste',
                severity: 'High',
                address: 'Dairy Circle, Bangalore 560029',
                location: { lat: 12.9380, lng: 77.5990 },
                citizenId: citizens[2]._id,
                assignedTo: staffMembers[3]._id,
                department: departments[3]._id,
                status: 'In Progress',
            },
            {
                title: 'Broken park bench and damaged fence',
                description: 'The public park near Koramangala has multiple broken benches and a damaged boundary fence. Children play here daily and the broken equipment poses safety risks.',
                category: 'Parks',
                severity: 'Low',
                address: 'Koramangala 4th Block Park, Bangalore 560034',
                location: { lat: 12.9352, lng: 77.6245 },
                citizenId: citizens[1]._id,
                department: departments[4]._id,
                status: 'Pending',
            },
            {
                title: 'Sewage overflow near residential area',
                description: 'Sewage is overflowing from the drainage on 3rd Main Road, causing horrible stench and health hazards. The manhole cover is broken and sewage water is spreading to nearby homes.',
                category: 'Sanitation',
                severity: 'Critical',
                address: '3rd Main Road, Indiranagar, Bangalore 560038',
                location: { lat: 12.9784, lng: 77.6408 },
                citizenId: citizens[0]._id,
                assignedTo: staffMembers[3]._id,
                department: departments[3]._id,
                status: 'Acknowledged',
            },
            {
                title: 'Water supply disruption in entire ward',
                description: 'No water supply in Ward 45 for the last 3 days. Multiple households affected. The BWSSB helpline is not responding. Residents are forced to buy tanker water.',
                category: 'Water',
                severity: 'Critical',
                address: 'Ward 45, HSR Layout, Bangalore 560102',
                location: { lat: 12.9121, lng: 77.6446 },
                citizenId: citizens[2]._id,
                assignedTo: staffMembers[0]._id,
                department: departments[0]._id,
                status: 'In Progress',
            },
            {
                title: 'Road surface completely damaged after rains',
                description: 'Heavy rains have completely destroyed the road surface on Outer Ring Road near Marathahalli. Multiple potholes and uneven surface making it dangerous for all vehicles.',
                category: 'Roads',
                severity: 'High',
                address: 'Outer Ring Road, Marathahalli, Bangalore 560037',
                location: { lat: 12.9591, lng: 77.6974 },
                citizenId: citizens[1]._id,
                department: departments[1]._id,
                status: 'Pending',
            },
            {
                title: 'Power outage in commercial area',
                description: 'Frequent power outages in the commercial area of Whitefield. Businesses are suffering losses due to 4-5 hour long power cuts daily. UPS and generators are overloaded.',
                category: 'Electricity',
                severity: 'High',
                address: 'Whitefield Main Road, Bangalore 560066',
                location: { lat: 12.9698, lng: 77.7500 },
                citizenId: citizens[0]._id,
                assignedTo: staffMembers[2]._id,
                department: departments[2]._id,
                status: 'In Progress',
            },
            {
                title: 'Construction noise violation at night',
                description: 'A construction site near BTM Layout 2nd Stage is operating heavy machinery after 10 PM, violating noise pollution norms. Residents unable to sleep for the past week.',
                category: 'Noise',
                severity: 'Medium',
                address: 'BTM Layout 2nd Stage, Bangalore 560076',
                location: { lat: 12.9166, lng: 77.6101 },
                citizenId: citizens[2]._id,
                department: departments[4]._id,
                status: 'Pending',
            },
            {
                title: 'Illegal dumping of waste near lake',
                description: 'Illegal dumping of construction debris and waste near Ulsoor Lake. This is damaging the lake ecosystem and causing water pollution. Immediate action required.',
                category: 'Waste',
                severity: 'Critical',
                address: 'Ulsoor Lake Area, Bangalore 560008',
                location: { lat: 12.9810, lng: 77.6210 },
                citizenId: citizens[1]._id,
                assignedTo: staffMembers[3]._id,
                department: departments[3]._id,
                status: 'Acknowledged',
            },
            {
                title: 'Low water pressure in apartment complex',
                description: 'Extremely low water pressure in Prestige Lakeside Habitat apartment complex for the past 10 days. Upper floors receive no water at all during peak hours.',
                category: 'Water',
                severity: 'Medium',
                address: 'Prestige Lakeside, Varthur, Bangalore 560087',
                location: { lat: 12.9400, lng: 77.7390 },
                citizenId: citizens[0]._id,
                department: departments[0]._id,
                status: 'Pending',
            },
            {
                title: 'Traffic signal malfunction at major junction',
                description: 'The traffic signal at Silk Board junction is malfunctioning, showing green on all sides simultaneously. This is extremely dangerous and has already caused minor accidents.',
                category: 'Roads',
                severity: 'Critical',
                address: 'Silk Board Junction, Bangalore 560068',
                location: { lat: 12.9177, lng: 77.6238 },
                citizenId: citizens[2]._id,
                assignedTo: staffMembers[1]._id,
                department: departments[1]._id,
                status: 'In Progress',
            },
            {
                title: 'Open drainage causing mosquito breeding',
                description: 'An open drainage on 2nd Cross Road in Malleshwaram has become a breeding ground for mosquitoes. Multiple dengue cases reported in the vicinity.',
                category: 'Sanitation',
                severity: 'High',
                address: '2nd Cross, Malleshwaram, Bangalore 560003',
                location: { lat: 13.0030, lng: 77.5680 },
                citizenId: citizens[1]._id,
                assignedTo: staffMembers[3]._id,
                department: departments[3]._id,
                status: 'Resolved',
                resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                resolutionRemarks: 'Drainage covered and cleaned. Fogging conducted in surrounding area.',
            },
            {
                title: 'Fallen tree blocking footpath',
                description: 'A large tree has fallen and is blocking the entire footpath on 100 Feet Road, Indiranagar. Pedestrians forced to walk on the main road, risking accidents.',
                category: 'Parks',
                severity: 'Medium',
                address: '100 Feet Road, Indiranagar, Bangalore 560038',
                location: { lat: 12.9719, lng: 77.6412 },
                citizenId: citizens[0]._id,
                assignedTo: staffMembers[4]._id,
                department: departments[4]._id,
                status: 'Resolved',
                resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                resolutionRemarks: 'Tree removed and footpath cleared. Area inspected for further risks.',
            },
            {
                title: 'Transformer explosion in residential area',
                description: 'An electrical transformer exploded in Basavanagudi causing sparks and fire. Nearby houses at risk. Power line wires hanging dangerously low.',
                category: 'Electricity',
                severity: 'Critical',
                address: 'Bull Temple Road, Basavanagudi, Bangalore 560004',
                location: { lat: 12.9432, lng: 77.5712 },
                citizenId: citizens[2]._id,
                assignedTo: staffMembers[2]._id,
                department: departments[2]._id,
                status: 'Resolved',
                resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                resolutionRemarks: 'Transformer replaced and wires secured. Area declared safe after inspection.',
            },
            {
                title: 'Blocked storm water drain causing flooding',
                description: 'Storm water drain near Hebbal flyover is completely blocked with debris. Even light rain causes severe flooding affecting traffic and nearby properties.',
                category: 'Water',
                severity: 'High',
                address: 'Hebbal Flyover, Bangalore 560024',
                location: { lat: 13.0358, lng: 77.5970 },
                citizenId: citizens[1]._id,
                department: departments[0]._id,
                status: 'Pending',
            },
            {
                title: 'Unhygienic public toilet near bus stop',
                description: 'The public toilet near Majestic bus station is in extremely unhygienic condition. Broken fixtures, no water supply, and foul smell. Needs immediate cleaning and repair.',
                category: 'Sanitation',
                severity: 'Medium',
                address: 'Majestic Bus Station, Bangalore 560009',
                location: { lat: 12.9767, lng: 77.5713 },
                citizenId: citizens[0]._id,
                assignedTo: staffMembers[3]._id,
                department: departments[3]._id,
                status: 'Rejected',
                resolutionRemarks: 'This facility is under BMTC jurisdiction. Complaint forwarded to appropriate authority.',
            },
        ];

        // Adjust timestamps for realistic data spread (spread over 30 days)
        const complaints = [];
        for (let i = 0; i < complaintData.length; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const hoursAgo = Math.floor(Math.random() * 24);
            const createdAt = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);

            const complaint = await Complaint.create({
                ...complaintData[i],
                createdAt,
            });
            complaints.push(complaint);
        }
        console.log(`  Created ${complaints.length} complaints`);

        // ── Calculate Priorities ──
        console.log('Calculating priorities...');
        const allComplaints = await Complaint.find().lean();
        for (const complaint of allComplaints) {
            if (['Resolved', 'Rejected'].includes(complaint.status)) continue;
            const { priorityScore, priorityLevel } = calculatePriorityScore(complaint, allComplaints);
            await Complaint.findByIdAndUpdate(complaint._id, { priorityScore, priorityLevel });
        }

        // ── Create Timeline Entries ──
        console.log('Creating status timelines...');
        for (const complaint of complaints) {
            // Initial status
            await StatusTimeline.create({
                complaintId: complaint._id,
                oldStatus: null,
                newStatus: 'Pending',
                updatedBy: complaint.citizenId,
                updatedByModel: 'Citizen',
                remarks: 'Complaint filed by citizen',
                createdAt: complaint.createdAt,
            });

            // Additional status transitions
            if (['Acknowledged', 'In Progress', 'Resolved', 'Rejected'].includes(complaint.status)) {
                await StatusTimeline.create({
                    complaintId: complaint._id,
                    oldStatus: 'Pending',
                    newStatus: 'Acknowledged',
                    updatedBy: complaint.assignedTo || admin._id,
                    updatedByModel: complaint.assignedTo ? 'Staff' : 'Admin',
                    remarks: 'Complaint acknowledged and under review',
                    createdAt: new Date(complaint.createdAt.getTime() + 2 * 60 * 60 * 1000),
                });
            }
            if (['In Progress', 'Resolved'].includes(complaint.status)) {
                await StatusTimeline.create({
                    complaintId: complaint._id,
                    oldStatus: 'Acknowledged',
                    newStatus: 'In Progress',
                    updatedBy: complaint.assignedTo || admin._id,
                    updatedByModel: complaint.assignedTo ? 'Staff' : 'Admin',
                    remarks: 'Work has begun on resolving this complaint',
                    createdAt: new Date(complaint.createdAt.getTime() + 6 * 60 * 60 * 1000),
                });
            }
            if (complaint.status === 'Resolved') {
                await StatusTimeline.create({
                    complaintId: complaint._id,
                    oldStatus: 'In Progress',
                    newStatus: 'Resolved',
                    updatedBy: complaint.assignedTo || admin._id,
                    updatedByModel: complaint.assignedTo ? 'Staff' : 'Admin',
                    remarks: complaint.resolutionRemarks || 'Complaint resolved successfully',
                    createdAt: complaint.resolvedAt || new Date(),
                });
            }
            if (complaint.status === 'Rejected') {
                await StatusTimeline.create({
                    complaintId: complaint._id,
                    oldStatus: 'Pending',
                    newStatus: 'Rejected',
                    updatedBy: admin._id,
                    updatedByModel: 'Admin',
                    remarks: complaint.resolutionRemarks || 'Complaint rejected',
                    createdAt: new Date(complaint.createdAt.getTime() + 4 * 60 * 60 * 1000),
                });
            }
        }
        console.log('  Status timelines created');

        // ── Create Sample Comments ──
        console.log('Creating sample comments...');
        const commentData = [
            { complaintId: complaints[0]._id, userId: staffMembers[0]._id, userModel: 'Staff', message: 'Team dispatched to inspect the pipeline. ETA 2 hours.', isInternal: false },
            { complaintId: complaints[0]._id, userId: staffMembers[0]._id, userModel: 'Staff', message: 'Internal note: Need excavation equipment for this repair.', isInternal: true },
            { complaintId: complaints[0]._id, userId: citizens[0]._id, userModel: 'Citizen', message: 'The flooding is getting worse. Please expedite the repair.', isInternal: false },
            { complaintId: complaints[1]._id, userId: staffMembers[1]._id, userModel: 'Staff', message: 'Inspection completed. Pothole dimensions recorded. Repair scheduled for tomorrow.', isInternal: false },
            { complaintId: complaints[3]._id, userId: staffMembers[3]._id, userModel: 'Staff', message: 'Additional truck deployed for complete cleanup.', isInternal: false },
            { complaintId: complaints[5]._id, userId: admin._id, userModel: 'Admin', message: 'This is marked as high priority. Please ensure resolution within 24 hours.', isInternal: true },
            { complaintId: complaints[6]._id, userId: citizens[2]._id, userModel: 'Citizen', message: 'When will the water supply be restored? Its been 3 days now.', isInternal: false },
            { complaintId: complaints[6]._id, userId: staffMembers[0]._id, userModel: 'Staff', message: 'Repair work ongoing. Supply expected to resume by evening.', isInternal: false },
        ];

        await Comment.insertMany(commentData);
        console.log(`  Created ${commentData.length} comments`);

        console.log('\n========================================');
        console.log('  Database seeded successfully!');
        console.log('========================================');
        console.log('\nDemo Accounts:');
        console.log('  Admin:   admin@demo.com   / password123');
        console.log('  Staff:   staff@demo.com   / password123');
        console.log('  Citizen: citizen@demo.com / password123');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedDatabase();
