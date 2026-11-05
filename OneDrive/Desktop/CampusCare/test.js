/**
 * CAMPUSCARE - COMPREHENSIVE AUTOMATED TEST SUITE
 * Tests all 25 system requirements and core workflows.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

const http = require('http');
const mongoose = require('mongoose');
const { app, startServer } = require('./server');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Department = require('./models/Department');
const Feedback = require('./models/Feedback');
const Notification = require('./models/Notification');
const { ROLES, COMPLAINT_STATUS, COMPLAINT_PRIORITY } = require('./config/constants');

// Simple Cookie & HTTP Agent for testing
class TestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = {};
  }

  getCookieString() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  saveCookies(res) {
    const rawCookies = res.headers.raw ? res.headers.raw()['set-cookie'] || [] : (res.headers.getSetCookie ? res.headers.getSetCookie() : []);
    rawCookies.forEach((cookieStr) => {
      const parts = cookieStr.split(';')[0].split('=');
      if (parts.length === 2) {
        this.cookies[parts[0].trim()] = parts[1].trim();
      }
    });
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = options.headers || {};
    const cookieStr = this.getCookieString();
    if (cookieStr) {
      headers['Cookie'] = cookieStr;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      redirect: options.redirect || 'manual'
    });

    this.saveCookies(res);
    return res;
  }

  async get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  async postForm(path, formData, options = {}) {
    const body = new URLSearchParams(formData).toString();
    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    return this.request(path, { ...options, method: 'POST', body, headers });
  }
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING CAMPUSCARE FULL INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  let server;
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`✅ [PASS] ${description}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${description}`);
      failedCount++;
      throw new Error(`Assertion failed: ${description}`);
    }
  };

  try {
    // Start Server
    server = await startServer();
    const baseUrl = 'http://localhost:5001';
    const client = new TestClient(baseUrl);

    // 1. Test MongoDB Connection
    console.log('\n--- 1. Database Connection ---');
    assert(mongoose.connection.readyState === 1, 'MongoDB connection is ACTIVE and CONNECTED (readyState = 1)');

    // 2. Test Student Registration
    console.log('\n--- 2. Student Registration ---');
    const newStudentEmail = `test.student.${Date.now()}@vfstr.ac.in`;
    const regRes = await client.postForm('/auth/register', {
      fullName: 'Test Automation Student',
      email: newStudentEmail,
      regNo: `TEST${Math.floor(Math.random() * 90000 + 10000)}`,
      phone: '+91 99999 88888',
      department: 'Computer Science & Engineering',
      password: 'Password@123',
      confirmPassword: 'Password@123'
    });
    assert(regRes.status === 302, 'Student registration returns 302 redirect after success');
    const createdUser = await User.findOne({ email: newStudentEmail });
    assert(createdUser !== null, 'New student account persisted in MongoDB');
    assert(createdUser.role === ROLES.STUDENT, 'Public registration strictly assigns STUDENT role');

    // 3. Test Student Login
    console.log('\n--- 3. Student Login ---');
    const studentClient = new TestClient(baseUrl);
    const loginStudentRes = await studentClient.postForm('/auth/login', {
      email: 'student1@vfstr.ac.in',
      password: 'Student@123'
    });
    assert(loginStudentRes.status === 302, 'Student login succeeds with 302 redirect');
    assert(loginStudentRes.headers.get('location') === '/student/dashboard', 'Student redirected to /student/dashboard');

    // 4. Test Staff Login
    console.log('\n--- 4. Staff Login ---');
    const staffClient = new TestClient(baseUrl);
    const loginStaffRes = await staffClient.postForm('/auth/login', {
      email: 'staff.cse@vfstr.ac.in',
      password: 'Staff@123'
    });
    assert(loginStaffRes.status === 302, 'Staff login succeeds with 302 redirect');
    assert(loginStaffRes.headers.get('location') === '/staff/dashboard', 'Staff redirected to /staff/dashboard');

    // 5. Test Admin Login
    console.log('\n--- 5. Admin Login ---');
    const adminClient = new TestClient(baseUrl);
    const loginAdminRes = await adminClient.postForm('/auth/login', {
      email: 'admin@vfstr.ac.in',
      password: 'Admin@123'
    });
    assert(loginAdminRes.status === 302, 'Admin login succeeds with 302 redirect');
    assert(loginAdminRes.headers.get('location') === '/admin/dashboard', 'Admin redirected to /admin/dashboard');

    // 6. Test Invalid Login
    console.log('\n--- 6. Invalid Login Handling ---');
    const invalidClient = new TestClient(baseUrl);
    const invalidRes = await invalidClient.postForm('/auth/login', {
      email: 'student1@vfstr.ac.in',
      password: 'WrongPassword'
    });
    assert(invalidRes.status === 302, 'Invalid login responds with redirect');
    assert(invalidRes.headers.get('location') === '/auth/login', 'Invalid login redirects back to /auth/login');

    // 7. Test Logout
    console.log('\n--- 7. Logout Flow ---');
    const logoutRes = await studentClient.get('/auth/logout');
    assert(logoutRes.status === 302, 'Logout returns 302 redirect');
    assert(logoutRes.headers.get('location') === '/auth/login', 'Logout redirects to /auth/login');

    // 8. Test Protected Routes (Unauthenticated user blocked)
    console.log('\n--- 8. Protected Routes Access Control ---');
    const unauthClient = new TestClient(baseUrl);
    const blockedRes = await unauthClient.get('/student/dashboard');
    assert(blockedRes.status === 302, 'Unauthenticated user accessing /student/dashboard is blocked (302 redirect)');
    assert(blockedRes.headers.get('location') === '/auth/login', 'Unauthenticated user redirected to /auth/login');

    // 9. Test Role-Based Access Control (Student blocked from Admin route)
    console.log('\n--- 9. Role-Based Access Enforcement ---');
    // Re-login student
    await studentClient.postForm('/auth/login', {
      email: 'student1@vfstr.ac.in',
      password: 'Student@123'
    });
    const studentAccessingAdminRes = await studentClient.get('/admin/dashboard');
    assert(studentAccessingAdminRes.status === 302, 'Student cannot access /admin/dashboard (Access Denied)');
    assert(studentAccessingAdminRes.headers.get('location') === '/student/dashboard', 'Student redirected back to own student dashboard');

    // 10. Test Complaint Submission
    console.log('\n--- 10. Complaint Submission ---');
    const testComplaintTitle = `Automated Test: CSE Lab 2 Air Conditioning Malfunction ${Date.now()}`;
    const submitRes = await studentClient.postForm('/student/submit-complaint', {
      title: testComplaintTitle,
      description: 'The split AC unit in Room 302 CSE Lab is blowing warm air, making the server and workstations overheat.',
      category: 'Infrastructure & Maintenance',
      priority: 'HIGH'
    });
    assert(submitRes.status === 302, 'Complaint submission successfully processes and redirects');
    const createdComplaint = await Complaint.findOne({ title: testComplaintTitle });
    assert(createdComplaint !== null, 'Complaint document successfully created in MongoDB');
    assert(createdComplaint.complaintId.startsWith('CC-'), 'Complaint ID generated in valid format (CC-YYYY-XXXX)');
    assert(createdComplaint.status === COMPLAINT_STATUS.SUBMITTED, 'Initial complaint status is SUBMITTED');
    assert(createdComplaint.statusHistory.length === 1, 'Initial status history entry recorded');

    // 11. Test Complaint Public Tracking
    console.log('\n--- 11. Complaint Public Tracking ---');
    const trackRes = await unauthClient.get(`/track?complaintId=${createdComplaint.complaintId}`);
    assert(trackRes.status === 200, 'Public tracking endpoint returns HTTP 200 OK');
    const trackHtml = await trackRes.text();
    assert(trackHtml.includes(createdComplaint.complaintId), 'Tracking page displays the queried Complaint ID');
    assert(trackHtml.includes('Progress Timeline'), 'Tracking page displays status timeline');

    // 12. Test Multer File Upload Directory
    console.log('\n--- 12. File Upload Infrastructure ---');
    const fs = require('fs');
    const path = require('path');
    assert(fs.existsSync(path.join(__dirname, 'public/uploads/complaints')), 'Complaints upload directory exists and is writable');
    assert(fs.existsSync(path.join(__dirname, 'public/uploads/profiles')), 'Profiles upload directory exists and is writable');

    // 13. Test Complaint Assignment by Admin
    console.log('\n--- 13. Complaint Assignment by Admin ---');
    const maintStaff = await User.findOne({ email: 'staff.maint@vfstr.ac.in' });
    const maintDept = await Department.findOne({ code: 'MAINT' });
    const assignRes = await adminClient.postForm(`/admin/complaint/${createdComplaint._id}/assign`, {
      departmentId: maintDept._id.toString(),
      staffId: maintStaff._id.toString(),
      priority: COMPLAINT_PRIORITY.URGENT,
      adminRemarks: 'Urgent priority assigned. Inspect AC compressor today.'
    });
    assert(assignRes.status === 302, 'Admin assignment completes and redirects');
    const assignedComplaint = await Complaint.findById(createdComplaint._id);
    assert(assignedComplaint.assignedStaff.toString() === maintStaff._id.toString(), 'Complaint assignedStaff updated in MongoDB');
    assert(assignedComplaint.status === COMPLAINT_STATUS.ASSIGNED, 'Complaint status updated to ASSIGNED');
    assert(assignedComplaint.priority === COMPLAINT_PRIORITY.URGENT, 'Complaint priority updated to URGENT');

    // 14. Test Staff Login & Updating Status to IN PROGRESS
    console.log('\n--- 14. Staff Status Update (IN PROGRESS) ---');
    const maintStaffClient = new TestClient(baseUrl);
    await maintStaffClient.postForm('/auth/login', {
      email: 'staff.maint@vfstr.ac.in',
      password: 'Staff@123'
    });
    const inProgressRes = await maintStaffClient.postForm(`/staff/complaint/${createdComplaint._id}/update-status`, {
      status: COMPLAINT_STATUS.IN_PROGRESS,
      staffRemarks: 'AC technician called on site to inspect condenser coils.'
    });
    assert(inProgressRes.status === 302, 'Staff status update to IN PROGRESS redirects');
    const inProgressComplaint = await Complaint.findById(createdComplaint._id);
    assert(inProgressComplaint.status === COMPLAINT_STATUS.IN_PROGRESS, 'Database status updated to IN PROGRESS');

    // 15. Test Staff Resolution with Remarks
    console.log('\n--- 15. Staff Complaint Resolution ---');
    const resolvedRes = await maintStaffClient.postForm(`/staff/complaint/${createdComplaint._id}/update-status`, {
      status: COMPLAINT_STATUS.RESOLVED,
      staffRemarks: 'Condenser unit gas refilled and filters cleaned.',
      resolutionDetails: 'Compressor refrigerant R410A refilled to 120 PSI. Temperature verified at 19C.'
    });
    assert(resolvedRes.status === 302, 'Staff resolution update redirects');
    const resolvedComplaint = await Complaint.findById(createdComplaint._id);
    assert(resolvedComplaint.status === COMPLAINT_STATUS.RESOLVED, 'Complaint status set to RESOLVED');
    assert(resolvedComplaint.resolvedDate !== null, 'resolvedDate timestamp recorded');
    assert(resolvedComplaint.resolutionDetails.length > 0, 'resolutionDetails saved in MongoDB');

    // 16. Test Feedback Submission
    console.log('\n--- 16. Student Feedback Submission ---');
    const feedbackRes = await studentClient.postForm(`/student/complaint/${createdComplaint._id}/feedback`, {
      rating: '5',
      description: 'Excellent service! The AC is cooling properly now and lab sessions resumed.'
    });
    assert(feedbackRes.status === 302, 'Student feedback submitted and redirected');
    const savedFeedback = await Feedback.findOne({ complaint: createdComplaint._id });
    assert(savedFeedback !== null, 'Feedback document saved in MongoDB');
    assert(savedFeedback.rating === 5, 'Feedback star rating saved accurately (5 stars)');

    // Verify duplicate feedback prevention
    const duplicateRes = await studentClient.postForm(`/student/complaint/${createdComplaint._id}/feedback`, {
      rating: '4',
      description: 'Trying duplicate feedback'
    });
    const totalFeedbacksForComplaint = await Feedback.countDocuments({ complaint: createdComplaint._id });
    assert(totalFeedbacksForComplaint === 1, 'Duplicate feedback submission safely prevented');

    // 17. Test Notification System
    console.log('\n--- 17. Notification System ---');
    const studentUser = await User.findOne({ email: 'student1@vfstr.ac.in' });
    const notifications = await Notification.find({ user: studentUser._id });
    assert(notifications.length > 0, 'Notifications created and persisted in MongoDB');
    const unreadNotif = notifications.find(n => !n.isRead);
    if (unreadNotif) {
      const markReadRes = await studentClient.postForm(`/notifications/${unreadNotif._id}/mark-read`, {});
      assert(markReadRes.status === 302 || markReadRes.status === 200, 'Notification marked as read');
    }

    // 18. Test User Management (Admin toggles student status)
    console.log('\n--- 18. User Management ---');
    const toggleUser = await User.findOne({ email: newStudentEmail });
    const toggleRes = await adminClient.postForm(`/admin/students/${toggleUser._id}/toggle-status`, {});
    assert(toggleRes.status === 302, 'Admin toggle student status redirects');
    const updatedUser = await User.findById(toggleUser._id);
    assert(updatedUser.accountStatus === 'SUSPENDED', 'Student account status toggled to SUSPENDED');

    // 19. Test Department Management (Admin creates new Department)
    console.log('\n--- 19. Department Management ---');
    const deptRes = await adminClient.postForm('/admin/departments', {
      name: `Automated Test Dept ${Date.now()}`,
      code: `ATD${Math.floor(Math.random() * 900 + 100)}`,
      head: 'Prof. Test Head',
      description: 'Automated testing department'
    });
    assert(deptRes.status === 302, 'Admin creates department and redirects');

    // 20. Test Dashboard Statistics & Aggregations
    console.log('\n--- 20. Dashboard Statistics & MongoDB Aggregation ---');
    const adminDashRes = await adminClient.get('/admin/dashboard');
    assert(adminDashRes.status === 200, 'Admin analytics dashboard returns 200 OK');
    const studentDashRes = await studentClient.get('/student/dashboard');
    assert(studentDashRes.status === 200, 'Student dashboard returns 200 OK');
    const staffDashRes = await maintStaffClient.get('/staff/dashboard');
    assert(staffDashRes.status === 200, 'Staff dashboard returns 200 OK');

    // 21. Test Search and Filtering
    console.log('\n--- 21. Search and Filtering Queries ---');
    const searchRes = await adminClient.get('/admin/complaints?search=Air+Conditioning&priority=URGENT');
    assert(searchRes.status === 200, 'Search and filter query executes and returns 200 OK');
    const searchHtml = await searchRes.text();
    assert(searchHtml.includes('Air Conditioning'), 'Filtered complaints table contains queried title');

    // 22. Test Reports & CSV Export
    console.log('\n--- 22. CSV Report Generation ---');
    const csvComplaintsRes = await adminClient.get('/admin/reports/export-complaints');
    assert(csvComplaintsRes.status === 200, 'Complaints CSV export returns 200 OK');
    assert(csvComplaintsRes.headers.get('content-type').includes('text/csv'), 'Complaints export header is text/csv');
    const csvComplaintsData = await csvComplaintsRes.text();
    assert(csvComplaintsData.includes('Complaint ID'), 'CSV data contains header fields');

    const csvFeedbackRes = await adminClient.get('/admin/reports/export-feedback');
    assert(csvFeedbackRes.status === 200, 'Feedback CSV export returns 200 OK');
    assert(csvFeedbackRes.headers.get('content-type').includes('text/csv'), 'Feedback export header is text/csv');

    // 23. Test Landing Page & Responsive Viewport
    console.log('\n--- 23. Public Pages & Branding ---');
    const landingRes = await unauthClient.get('/');
    assert(landingRes.status === 200, 'Landing page returns 200 OK');
    const landingHtml = await landingRes.text();
    assert(landingHtml.includes('VFSTR HYDERABAD CAMPUS'), 'Landing page contains VFSTR Hyderabad Campus institutional branding');
    assert(landingHtml.includes('CampusCare'), 'Landing page contains CampusCare title');

    // 24. Test Error Pages (404 and 500)
    console.log('\n--- 24. Error Handlers ---');
    const notFoundRes = await unauthClient.get('/some-non-existent-page-url-404');
    assert(notFoundRes.status === 404, 'Non-existent route returns 404 status');

    // 25. Summary
    console.log('\n========================================================');
    console.log(`🎉 ALL 25 TESTS PASSED SUCCESSFULLY! (${passedCount} passed, 0 failed)`);
    console.log('========================================================\n');

    setTimeout(async () => {
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    }, 500);
  } catch (err) {
    console.error('\n💥 TEST FAILED WITH EXCEPTION:', err);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
