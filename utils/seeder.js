/**
 * Database Seeder Utility
 * Seeds initial Departments, Admin, Staff, Students, Complaints, Feedback, and Notifications.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const { ROLES, COMPLAINT_STATUS, COMPLAINT_PRIORITY, NOTIFICATION_TYPES } = require('../config/constants');

const seedData = async (isSilent = false) => {
  const log = (...args) => {
    if (!isSilent) console.log(...args);
  };

  try {
    log('[Seeder] Checking existing data...');

    // Clear existing data if manual seed script is invoked
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount > 0 && isSilent) {
      log('[Seeder] Admin already exists. Skipping auto-seed.');
      return;
    }

    if (!isSilent) {
      log('[Seeder] Purging collections for fresh seed...');
      await User.deleteMany({});
      await Department.deleteMany({});
      await Complaint.deleteMany({});
      await Feedback.deleteMany({});
      await Notification.deleteMany({});
    }

    log('[Seeder] Creating Departments...');
    const departments = await Department.create([
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        description: 'Department of CSE - Lab, Network, Academic & Project facilities',
        head: 'Dr. K. Venkateswarlu'
      },
      {
        name: 'Electronics & Communication',
        code: 'ECE',
        description: 'Department of ECE - Labs, Instruments & Academic resources',
        head: 'Dr. P. Srinivas'
      },
      {
        name: 'Campus Maintenance & Infrastructure',
        code: 'MAINT',
        description: 'Electricity, Air Conditioning, Plumbing, Cleanliness and Civil Repairs',
        head: 'Er. R. Mohan Rao'
      },
      {
        name: 'Hostel & Food Services',
        code: 'HOSTEL',
        description: 'Campus Hostel rooms, Water supply, Hygiene and Mess food quality',
        head: 'Chief Warden - Dr. T. Ramana'
      },
      {
        name: 'Transportation & Logistics',
        code: 'TRANS',
        description: 'College bus routes, Timings, Fleet maintenance and Pass verification',
        head: 'Mr. V. Suresh Kumar'
      },
      {
        name: 'Examination & Student Affairs',
        code: 'ACAD',
        description: 'Marks memos, Hall tickets, Attendance grievances and Certificates',
        head: 'Controller of Examinations - Dr. B. Rajesh'
      }
    ]);

    log('[Seeder] Creating Users (Admin, Staff, Students)...');
    
    // 1. Admin
    const admin = await User.create({
      fullName: 'VFSTR Campus Administrator',
      email: 'admin@vfstr.ac.in',
      password: 'Admin@123',
      role: ROLES.ADMIN,
      phone: '+91 98480 12345',
      department: 'Administration',
      designation: 'Chief Grievance Officer',
      accountStatus: 'ACTIVE'
    });

    // 2. Staff members
    const staff1 = await User.create({
      fullName: 'Prof. Ramesh Sharma',
      email: 'staff.cse@vfstr.ac.in',
      password: 'Staff@123',
      role: ROLES.STAFF,
      phone: '+91 98480 23456',
      department: 'Computer Science & Engineering',
      designation: 'Senior Lab Coordinator & Grievance Staff',
      accountStatus: 'ACTIVE'
    });

    const staff2 = await User.create({
      fullName: 'Er. Rajesh Varma',
      email: 'staff.maint@vfstr.ac.in',
      password: 'Staff@123',
      role: ROLES.STAFF,
      phone: '+91 98480 34567',
      department: 'Campus Maintenance & Infrastructure',
      designation: 'Facilities Supervisor',
      accountStatus: 'ACTIVE'
    });

    const staff3 = await User.create({
      fullName: 'Mrs. Sunita Reddy',
      email: 'staff.hostel@vfstr.ac.in',
      password: 'Staff@123',
      role: ROLES.STAFF,
      phone: '+91 98480 45678',
      department: 'Hostel & Food Services',
      designation: 'Hostel Warden & Quality In-charge',
      accountStatus: 'ACTIVE'
    });

    // Assign staff to departments
    departments[0].assignedStaff.push(staff1._id);
    await departments[0].save();

    departments[2].assignedStaff.push(staff2._id);
    await departments[2].save();

    departments[3].assignedStaff.push(staff3._id);
    await departments[3].save();

    // 3. Students
    const student1 = await User.create({
      fullName: 'Bhavya Sri',
      email: 'student1@vfstr.ac.in',
      password: 'Student@123',
      role: ROLES.STUDENT,
      regNo: '231FA04001',
      phone: '+91 98480 56789',
      department: 'Computer Science & Engineering',
      designation: 'B.Tech CSE Student (3rd Year)',
      accountStatus: 'ACTIVE'
    });

    const student2 = await User.create({
      fullName: 'Rahul Teja',
      email: 'student2@vfstr.ac.in',
      password: 'Student@123',
      role: ROLES.STUDENT,
      regNo: '231FA04002',
      phone: '+91 98480 67890',
      department: 'Electronics & Communication',
      designation: 'B.Tech ECE Student (2nd Year)',
      accountStatus: 'ACTIVE'
    });

    log('[Seeder] Creating Initial Complaints...');

    // Complaint 1 - Resolved with Feedback
    const complaint1 = await Complaint.create({
      complaintId: 'CC-2026-1001',
      student: student1._id,
      title: 'Lab 4 High-End Workstation GPU issue in CSE Block',
      description: 'System #18 in Computer Systems Lab 4 is shutting down abruptly during Deep Learning practical execution due to GPU thermal throttling.',
      category: 'Academic',
      department: departments[0]._id,
      priority: COMPLAINT_PRIORITY.HIGH,
      assignedStaff: staff1._id,
      status: COMPLAINT_STATUS.RESOLVED,
      staffRemarks: 'Replaced thermal paste on GPU and updated drivers. Tested for 2 hours with benchmark suite.',
      adminRemarks: 'Approved for closure upon student feedback.',
      resolutionDetails: 'Hardware heatsink cleaned and thermal interface renewed. Workstation tested stable.',
      resolvedDate: new Date(Date.now() - 24 * 3600 * 1000),
      statusHistory: [
        {
          status: COMPLAINT_STATUS.SUBMITTED,
          updatedBy: student1._id,
          remarks: 'Complaint lodged by student',
          timestamp: new Date(Date.now() - 72 * 3600 * 1000)
        },
        {
          status: COMPLAINT_STATUS.UNDER_REVIEW,
          updatedBy: admin._id,
          remarks: 'Reviewed by admin and verified priority',
          timestamp: new Date(Date.now() - 60 * 3600 * 1000)
        },
        {
          status: COMPLAINT_STATUS.ASSIGNED,
          updatedBy: admin._id,
          remarks: 'Assigned to Lab In-charge Prof. Ramesh Sharma',
          timestamp: new Date(Date.now() - 48 * 3600 * 1000)
        },
        {
          status: COMPLAINT_STATUS.IN_PROGRESS,
          updatedBy: staff1._id,
          remarks: 'Technician opened cabinet to inspect cooling fan and paste',
          timestamp: new Date(Date.now() - 36 * 3600 * 1000)
        },
        {
          status: COMPLAINT_STATUS.RESOLVED,
          updatedBy: staff1._id,
          remarks: 'Replaced thermal compound. Workstation functioning normally.',
          timestamp: new Date(Date.now() - 24 * 3600 * 1000)
        }
      ]
    });

    // Feedback for Complaint 1
    await Feedback.create({
      student: student1._id,
      complaint: complaint1._id,
      rating: 5,
      description: 'Quick resolution! The PC is now running our deep learning models without crashing. Thank you!'
    });

    // Complaint 2 - In Progress
    const complaint2 = await Complaint.create({
      complaintId: 'CC-2026-1002',
      student: student1._id,
      title: 'Water cooler filtration unit leaking on 2nd floor CSE Block',
      description: 'The drinking water cooler near Room 204 is leaking onto the corridor floor causing a slipping hazard.',
      category: 'Infrastructure & Maintenance',
      department: departments[2]._id,
      priority: COMPLAINT_PRIORITY.MEDIUM,
      assignedStaff: staff2._id,
      status: COMPLAINT_STATUS.IN_PROGRESS,
      staffRemarks: 'Plumber dispatched to inspect valve gaskets and overflow drainage.',
      adminRemarks: 'Expedite maintenance before evening classes.',
      statusHistory: [
        {
          status: COMPLAINT_STATUS.SUBMITTED,
          updatedBy: student1._id,
          remarks: 'Submitted by student',
          timestamp: new Date(Date.now() - 12 * 3600 * 1000)
        },
        {
          status: COMPLAINT_STATUS.ASSIGNED,
          updatedBy: admin._id,
          remarks: 'Assigned to Facilities Supervisor Er. Rajesh Varma',
          timestamp: new Date(Date.now() - 8 * 3600 * 1000)
        },
        {
          status: COMPLAINT_STATUS.IN_PROGRESS,
          updatedBy: staff2._id,
          remarks: 'Work initiated by maintenance team',
          timestamp: new Date(Date.now() - 4 * 3600 * 1000)
        }
      ]
    });

    // Complaint 3 - Submitted (New)
    const complaint3 = await Complaint.create({
      complaintId: 'CC-2026-1003',
      student: student2._id,
      title: 'Hostel Block B Hot Water Geyser not heating properly',
      description: 'The solar/electrical geyser on the 3rd floor of Hostel Block B is tripping the MCB frequently.',
      category: 'Hostel & Accommodation',
      department: departments[3]._id,
      priority: COMPLAINT_PRIORITY.URGENT,
      status: COMPLAINT_STATUS.SUBMITTED,
      statusHistory: [
        {
          status: COMPLAINT_STATUS.SUBMITTED,
          updatedBy: student2._id,
          remarks: 'Complaint registered by student',
          timestamp: new Date(Date.now() - 2 * 3600 * 1000)
        }
      ]
    });

    log('[Seeder] Creating Notifications...');
    await Notification.create([
      {
        user: student1._id,
        title: 'Complaint Resolved',
        message: 'Your complaint CC-2026-1001 regarding Lab 4 GPU issue has been marked as RESOLVED. Please provide your feedback.',
        type: NOTIFICATION_TYPES.SUCCESS,
        relatedComplaint: complaint1._id,
        isRead: false
      },
      {
        user: student1._id,
        title: 'Complaint In Progress',
        message: 'Complaint CC-2026-1002 (Water cooler leak) is currently in progress with Er. Rajesh Varma.',
        type: NOTIFICATION_TYPES.INFO,
        relatedComplaint: complaint2._id,
        isRead: true
      },
      {
        user: staff2._id,
        title: 'New Complaint Assigned',
        message: 'Admin assigned complaint CC-2026-1002 (Water cooler leak) to your queue.',
        type: NOTIFICATION_TYPES.ALERT,
        relatedComplaint: complaint2._id,
        isRead: false
      },
      {
        user: admin._id,
        title: 'New Urgent Grievance Received',
        message: 'Student Rahul Teja submitted urgent complaint CC-2026-1003 regarding Hostel Geyser.',
        type: NOTIFICATION_TYPES.ALERT,
        relatedComplaint: complaint3._id,
        isRead: false
      }
    ]);

    log('[Seeder] Database seeding completed successfully!');
    log('====================================================');
    log('DEFAULT LOGIN CREDENTIALS:');
    log('ADMIN:   admin@vfstr.ac.in    | Admin@123');
    log('STAFF:   staff.cse@vfstr.ac.in| Staff@123');
    log('STUDENT: student1@vfstr.ac.in | Student@123');
    log('STUDENT: student2@vfstr.ac.in | Student@123');
    log('====================================================');
  } catch (error) {
    console.error('[Seeder] Seeding error:', error);
    throw error;
  }
};

// If run directly from command line: node utils/seeder.js
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedData(false);
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

module.exports = { seedData };

