/**
 * Admin Controller
 * Full Administration, Department Management, Staff/Student Management,
 * Complaint Assignment, Status Control, Analytics, and CSV Reports.
 */

const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const { exportComplaintsToCSV, exportFeedbackToCSV } = require('../utils/csvExporter');
const { ROLES, COMPLAINT_STATUS, COMPLAINT_PRIORITY, COMPLAINT_CATEGORIES, NOTIFICATION_TYPES } = require('../config/constants');

// GET /admin/dashboard
const getDashboard = async (req, res) => {
  try {
    // 1. Basic counts
    const [
      totalStudents,
      totalStaff,
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      closedComplaints
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.STAFF }),
      Complaint.countDocuments(),
      Complaint.countDocuments({
        status: { $in: [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.UNDER_REVIEW] }
      }),
      Complaint.countDocuments({
        status: { $in: [COMPLAINT_STATUS.ASSIGNED, COMPLAINT_STATUS.IN_PROGRESS] }
      }),
      Complaint.countDocuments({ status: COMPLAINT_STATUS.RESOLVED }),
      Complaint.countDocuments({ status: COMPLAINT_STATUS.CLOSED })
    ]);

    // 2. Department-wise complaint statistics via MongoDB Aggregation
    const departmentStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          resolvedCount: {
            $sum: {
              $cond: [{ $in: ['$status', [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED]] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'deptInfo'
        }
      },
      {
        $unwind: {
          path: '$deptInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: { $ifNull: ['$deptInfo.name', 'General / Unassigned'] },
          code: { $ifNull: ['$deptInfo.code', 'GEN'] },
          count: 1,
          resolvedCount: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 3. Status breakdown
    const statusBreakdown = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 4. Priority breakdown
    const priorityBreakdown = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // 5. Average Feedback Rating
    const feedbackStats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 }
        }
      }
    ]);
    const avgRating = feedbackStats.length > 0 ? feedbackStats[0].avgRating.toFixed(1) : 0;
    const totalFeedbackCount = feedbackStats.length > 0 ? feedbackStats[0].totalFeedback : 0;

    // 6. Recent 5 complaints
    const recentComplaints = await Complaint.find()
      .populate('student', 'fullName regNo department')
      .populate('department', 'name code')
      .populate('assignedStaff', 'fullName designation')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Recent notifications
    const recentNotifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.render('admin/dashboard', {
      pageTitle: 'Campus Administrator Dashboard - CampusCare VFSTR',
      user: req.user,
      stats: {
        totalStudents,
        totalStaff,
        totalComplaints,
        pending: pendingComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        closed: closedComplaints,
        avgRating,
        totalFeedbackCount
      },
      departmentStats,
      statusBreakdown,
      priorityBreakdown,
      recentComplaints,
      recentNotifications,
      unreadCount,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error_msg', 'Could not load admin analytics.');
    res.render('admin/dashboard', {
      pageTitle: 'Admin Dashboard',
      user: req.user,
      stats: { totalStudents: 0, totalStaff: 0, totalComplaints: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0, avgRating: 0, totalFeedbackCount: 0 },
      departmentStats: [],
      statusBreakdown: [],
      priorityBreakdown: [],
      recentComplaints: [],
      recentNotifications: [],
      unreadCount: 0,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  }
};

// GET /admin/complaints
const getAllComplaints = async (req, res) => {
  try {
    const { search, department, status, priority, category } = req.query;

    const query = {};

    if (department && department !== 'ALL') {
      query.department = department;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { complaintId: searchRegex },
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('student', 'fullName regNo department phone email')
      .populate('department', 'name code')
      .populate('assignedStaff', 'fullName designation')
      .sort({ createdAt: -1 });

    const departments = await Department.find({ isActive: true }).sort({ name: 1 });

    res.render('admin/all-complaints', {
      pageTitle: 'All Grievances - CampusCare VFSTR',
      user: req.user,
      complaints,
      departments,
      categories: COMPLAINT_CATEGORIES,
      statuses: Object.values(COMPLAINT_STATUS),
      priorities: Object.values(COMPLAINT_PRIORITY),
      filters: { search, department, status, priority, category },
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Get all complaints error:', err);
    req.flash('error_msg', 'Failed to retrieve complaints.');
    res.redirect('/admin/dashboard');
  }
};

// GET /admin/complaint/:id
const getComplaintDetails = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'fullName regNo department phone email')
      .populate('department', 'name code head')
      .populate('assignedStaff', 'fullName designation email phone department')
      .populate('statusHistory.updatedBy', 'fullName role designation');

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found.');
      return res.redirect('/admin/complaints');
    }

    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    const staffMembers = await User.find({ role: ROLES.STAFF, accountStatus: 'ACTIVE' }).sort({ fullName: 1 });
    const feedback = await Feedback.findOne({ complaint: complaint._id });

    res.render('admin/complaint-details', {
      pageTitle: `Manage Complaint #${complaint.complaintId} - CampusCare VFSTR`,
      user: req.user,
      complaint,
      departments,
      staffMembers,
      feedback,
      statuses: Object.values(COMPLAINT_STATUS),
      priorities: Object.values(COMPLAINT_PRIORITY),
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Admin complaint details error:', err);
    req.flash('error_msg', 'Error fetching complaint details.');
    res.redirect('/admin/complaints');
  }
};

// POST /admin/complaint/:id/assign
const postAssignComplaint = async (req, res) => {
  try {
    const { departmentId, staffId, priority, adminRemarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found.');
      return res.redirect('/admin/complaints');
    }

    const previousStaff = complaint.assignedStaff;
    if (departmentId) complaint.department = departmentId;
    if (priority) complaint.priority = priority;
    if (adminRemarks) complaint.adminRemarks = adminRemarks.trim();

    let statusRemark = 'Complaint assigned/updated by Administrator.';

    if (staffId) {
      complaint.assignedStaff = staffId;
      complaint.status = COMPLAINT_STATUS.ASSIGNED;
      const assignedStaffUser = await User.findById(staffId);
      statusRemark = `Assigned to staff: ${assignedStaffUser ? assignedStaffUser.fullName : 'Staff'}.`;

      // Notify the assigned staff
      await Notification.create({
        user: staffId,
        title: 'New Complaint Assigned',
        message: `Admin assigned complaint #${complaint.complaintId} ("${complaint.title}") to you.`,
        type: NOTIFICATION_TYPES.ALERT,
        relatedComplaint: complaint._id
      });
    }

    // Append history
    complaint.statusHistory.push({
      status: complaint.status,
      updatedBy: req.user._id,
      remarks: adminRemarks ? `${statusRemark} Note: ${adminRemarks}` : statusRemark,
      timestamp: new Date()
    });

    await complaint.save();

    // Notify Student
    await Notification.create({
      user: complaint.student,
      title: 'Complaint Update',
      message: `Your grievance #${complaint.complaintId} has been assigned to department personnel for action.`,
      type: NOTIFICATION_TYPES.INFO,
      relatedComplaint: complaint._id
    });

    req.flash('success_msg', `Complaint #${complaint.complaintId} successfully updated/assigned.`);
    res.redirect(`/admin/complaint/${complaint._id}`);
  } catch (err) {
    console.error('Assign complaint error:', err);
    req.flash('error_msg', 'Could not assign complaint.');
    res.redirect(`/admin/complaint/${req.params.id}`);
  }
};

// POST /admin/complaint/:id/update-status
const postUpdateComplaintStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found.');
      return res.redirect('/admin/complaints');
    }

    const previousStatus = complaint.status;
    complaint.status = status;

    if (adminRemarks) {
      complaint.adminRemarks = adminRemarks.trim();
    }

    if (status === COMPLAINT_STATUS.RESOLVED && !complaint.resolvedDate) {
      complaint.resolvedDate = new Date();
    }
    if (status === COMPLAINT_STATUS.CLOSED && !complaint.closedDate) {
      complaint.closedDate = new Date();
    }

    complaint.statusHistory.push({
      status,
      updatedBy: req.user._id,
      remarks: adminRemarks ? adminRemarks.trim() : `Status changed from ${previousStatus} to ${status} by Administrator.`,
      timestamp: new Date()
    });

    await complaint.save();

    // Notify Student
    await Notification.create({
      user: complaint.student,
      title: `Grievance #${complaint.complaintId} Status: ${status}`,
      message: `The administrator updated your complaint status to ${status}. ${adminRemarks ? 'Remarks: ' + adminRemarks : ''}`,
      type: status === COMPLAINT_STATUS.RESOLVED || status === COMPLAINT_STATUS.CLOSED ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.INFO,
      relatedComplaint: complaint._id
    });

    // Notify Staff if assigned
    if (complaint.assignedStaff) {
      await Notification.create({
        user: complaint.assignedStaff,
        title: `Complaint #${complaint.complaintId} status changed to ${status}`,
        message: `Admin updated status to ${status}.`,
        type: NOTIFICATION_TYPES.INFO,
        relatedComplaint: complaint._id
      });
    }

    req.flash('success_msg', `Status updated to ${status} for complaint #${complaint.complaintId}.`);
    res.redirect(`/admin/complaint/${complaint._id}`);
  } catch (err) {
    console.error('Update status error:', err);
    req.flash('error_msg', 'Could not update status.');
    res.redirect(`/admin/complaint/${req.params.id}`);
  }
};

// GET /admin/departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('assignedStaff', 'fullName designation email')
      .sort({ name: 1 });

    const staffList = await User.find({ role: ROLES.STAFF, accountStatus: 'ACTIVE' }).sort({ fullName: 1 });

    // Aggregate complaints count per department
    const deptComplaintsCount = await Complaint.aggregate([
      { $group: { _id: '$department', total: { $sum: 1 } } }
    ]);
    const countMap = {};
    deptComplaintsCount.forEach((item) => {
      if (item._id) countMap[item._id.toString()] = item.total;
    });

    res.render('admin/departments', {
      pageTitle: 'Manage Departments - CampusCare VFSTR',
      user: req.user,
      departments,
      staffList,
      countMap,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Get departments error:', err);
    req.flash('error_msg', 'Could not load departments.');
    res.redirect('/admin/dashboard');
  }
};

// POST /admin/departments
const postCreateDepartment = async (req, res) => {
  try {
    const { name, code, description, head } = req.body;

    const existingDept = await Department.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }]
    });

    if (existingDept) {
      req.flash('error_msg', 'A department with that name or code already exists.');
      return res.redirect('/admin/departments');
    }

    await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      head: head ? head.trim() : 'Head of Department'
    });

    req.flash('success_msg', `Department "${name}" successfully created.`);
    res.redirect('/admin/departments');
  } catch (err) {
    console.error('Create department error:', err);
    req.flash('error_msg', 'Failed to create department.');
    res.redirect('/admin/departments');
  }
};

// POST /admin/departments/:id/edit
const postEditDepartment = async (req, res) => {
  try {
    const { name, code, description, head, isActive, assignedStaff } = req.body;
    const dept = await Department.findById(req.params.id);

    if (!dept) {
      req.flash('error_msg', 'Department not found.');
      return res.redirect('/admin/departments');
    }

    dept.name = name.trim();
    dept.code = code.trim().toUpperCase();
    dept.description = description ? description.trim() : '';
    dept.head = head ? head.trim() : dept.head;
    dept.isActive = isActive === 'on' || isActive === 'true';

    if (assignedStaff) {
      dept.assignedStaff = Array.isArray(assignedStaff) ? assignedStaff : [assignedStaff];
    } else {
      dept.assignedStaff = [];
    }

    await dept.save();

    req.flash('success_msg', `Department "${dept.name}" updated successfully.`);
    res.redirect('/admin/departments');
  } catch (err) {
    console.error('Edit department error:', err);
    req.flash('error_msg', 'Failed to update department.');
    res.redirect('/admin/departments');
  }
};

// GET /admin/staff
const getStaffManagement = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: ROLES.STAFF }).sort({ createdAt: -1 });
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });

    // Count complaints assigned to each staff
    const assignedCounts = await Complaint.aggregate([
      { $match: { assignedStaff: { $ne: null } } },
      { $group: { _id: '$assignedStaff', count: { $sum: 1 } } }
    ]);
    const staffCountMap = {};
    assignedCounts.forEach((item) => {
      staffCountMap[item._id.toString()] = item.count;
    });

    res.render('admin/staff-management', {
      pageTitle: 'Staff Management - CampusCare VFSTR',
      user: req.user,
      staffMembers,
      departments,
      staffCountMap,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Staff management error:', err);
    req.flash('error_msg', 'Could not load staff list.');
    res.redirect('/admin/dashboard');
  }
};

// POST /admin/staff
const postCreateStaff = async (req, res) => {
  try {
    const { fullName, email, password, phone, department, designation } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error_msg', 'A user with this email address already exists.');
      return res.redirect('/admin/staff');
    }

    const newStaff = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      department: department || 'General',
      designation: designation ? designation.trim() : 'Grievance Committee Staff',
      role: ROLES.STAFF,
      accountStatus: 'ACTIVE'
    });

    // Also link staff to department if selected
    if (department) {
      const dept = await Department.findOne({ name: department });
      if (dept) {
        dept.assignedStaff.push(newStaff._id);
        await dept.save();
      }
    }

    req.flash('success_msg', `Staff member ${newStaff.fullName} registered successfully.`);
    res.redirect('/admin/staff');
  } catch (err) {
    console.error('Create staff error:', err);
    req.flash('error_msg', 'Failed to register staff.');
    res.redirect('/admin/staff');
  }
};

// POST /admin/staff/:id/toggle-status
const toggleStaffStatus = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== ROLES.STAFF) {
      req.flash('error_msg', 'Staff member not found.');
      return res.redirect('/admin/staff');
    }

    staff.accountStatus = staff.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await staff.save();

    req.flash('success_msg', `Status for ${staff.fullName} changed to ${staff.accountStatus}.`);
    res.redirect('/admin/staff');
  } catch (err) {
    console.error('Toggle staff status error:', err);
    req.flash('error_msg', 'Error toggling staff status.');
    res.redirect('/admin/staff');
  }
};

// GET /admin/students
const getStudentManagement = async (req, res) => {
  try {
    const { search, department, status } = req.query;
    const query = { role: ROLES.STUDENT };

    if (department && department !== 'ALL') {
      query.department = department;
    }
    if (status && status !== 'ALL') {
      query.accountStatus = status;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { regNo: searchRegex }
      ];
    }

    const students = await User.find(query).sort({ createdAt: -1 });
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });

    // Aggregate complaints count per student
    const studentComplaints = await Complaint.aggregate([
      { $group: { _id: '$student', count: { $sum: 1 } } }
    ]);
    const studentCountMap = {};
    studentComplaints.forEach((item) => {
      studentCountMap[item._id.toString()] = item.count;
    });

    res.render('admin/student-management', {
      pageTitle: 'Student Directory - CampusCare VFSTR',
      user: req.user,
      students,
      departments,
      studentCountMap,
      filters: { search, department, status },
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Student management error:', err);
    req.flash('error_msg', 'Failed to retrieve students.');
    res.redirect('/admin/dashboard');
  }
};

// POST /admin/students/:id/toggle-status
const toggleStudentStatus = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== ROLES.STUDENT) {
      req.flash('error_msg', 'Student not found.');
      return res.redirect('/admin/students');
    }

    student.accountStatus = student.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await student.save();

    req.flash('success_msg', `Status for ${student.fullName} updated to ${student.accountStatus}.`);
    res.redirect('/admin/students');
  } catch (err) {
    console.error('Toggle student status error:', err);
    req.flash('error_msg', 'Error toggling student status.');
    res.redirect('/admin/students');
  }
};

// GET /admin/feedback
const getFeedbackList = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('student', 'fullName regNo email department')
      .populate('complaint', 'complaintId title category status')
      .sort({ createdAt: -1 });

    // Aggregate rating breakdown
    const ratingBreakdown = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const totalRatings = feedbacks.length;
    const avgRating = totalRatings > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalRatings).toFixed(1)
      : '0.0';

    res.render('admin/feedback-list', {
      pageTitle: 'Student Feedback & Ratings - CampusCare VFSTR',
      user: req.user,
      feedbacks,
      ratingBreakdown,
      avgRating,
      totalRatings,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Feedback list error:', err);
    req.flash('error_msg', 'Could not load feedback.');
    res.redirect('/admin/dashboard');
  }
};

// GET /admin/reports
const getReports = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });

    // Aggregate detailed complaint statistics for reports
    const [deptReport, statusReport, priorityReport, monthlyReport] = await Promise.all([
      Complaint.aggregate([
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $in: ['$status', [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED]] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $in: ['$status', [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.UNDER_REVIEW]] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'dept'
          }
        },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } }
      ]),
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.render('admin/reports', {
      pageTitle: 'Grievance Reports & Analytics - CampusCare VFSTR',
      user: req.user,
      departments,
      deptReport,
      statusReport,
      priorityReport,
      monthlyReport,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Reports page error:', err);
    req.flash('error_msg', 'Could not load grievance reports.');
    res.redirect('/admin/dashboard');
  }
};

// GET /admin/reports/export-complaints
const exportComplaintsCSV = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('student', 'fullName regNo department')
      .populate('department', 'name')
      .populate('assignedStaff', 'fullName')
      .sort({ createdAt: -1 });

    const csvData = exportComplaintsToCSV(complaints);

    res.header('Content-Type', 'text/csv');
    res.attachment(`VFSTR-Complaints-Report-${Date.now()}.csv`);
    return res.send(csvData);
  } catch (err) {
    console.error('Export complaints CSV error:', err);
    req.flash('error_msg', 'Failed to generate CSV export.');
    res.redirect('/admin/reports');
  }
};

// GET /admin/reports/export-feedback
const exportFeedbackCSV = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('student', 'fullName regNo')
      .populate('complaint', 'complaintId title')
      .sort({ createdAt: -1 });

    const csvData = exportFeedbackToCSV(feedbacks);

    res.header('Content-Type', 'text/csv');
    res.attachment(`VFSTR-Feedback-Report-${Date.now()}.csv`);
    return res.send(csvData);
  } catch (err) {
    console.error('Export feedback CSV error:', err);
    req.flash('error_msg', 'Failed to generate Feedback CSV export.');
    res.redirect('/admin/reports');
  }
};

// GET /admin/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('relatedComplaint', 'complaintId title status')
      .sort({ createdAt: -1 });

    res.render('admin/notifications', {
      pageTitle: 'Notifications - CampusCare VFSTR',
      user: req.user,
      notifications,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Admin notifications error:', err);
    req.flash('error_msg', 'Could not load notifications.');
    res.redirect('/admin/dashboard');
  }
};

module.exports = {
  getDashboard,
  getAllComplaints,
  getComplaintDetails,
  postAssignComplaint,
  postUpdateComplaintStatus,
  getDepartments,
  postCreateDepartment,
  postEditDepartment,
  getStaffManagement,
  postCreateStaff,
  toggleStaffStatus,
  getStudentManagement,
  toggleStudentStatus,
  getFeedbackList,
  getReports,
  exportComplaintsCSV,
  exportFeedbackCSV,
  getNotifications
};

