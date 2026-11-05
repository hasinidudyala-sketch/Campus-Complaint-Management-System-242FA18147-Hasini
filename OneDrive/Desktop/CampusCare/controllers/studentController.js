/**
 * Student Controller
 * Handles Student Dashboard, Complaints submission, Tracking, and Feedback
 */

const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { generateComplaintId } = require('../utils/idGenerator');
const { COMPLAINT_STATUS, COMPLAINT_CATEGORIES, COMPLAINT_PRIORITY, ROLES, NOTIFICATION_TYPES } = require('../config/constants');

// GET /student/dashboard
const getDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // MongoDB aggregations for real statistics
    const [totalComplaints, pendingComplaints, inProgressComplaints, resolvedComplaints] = await Promise.all([
      Complaint.countDocuments({ student: studentId }),
      Complaint.countDocuments({
        student: studentId,
        status: { $in: [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.UNDER_REVIEW, COMPLAINT_STATUS.ASSIGNED] }
      }),
      Complaint.countDocuments({
        student: studentId,
        status: COMPLAINT_STATUS.IN_PROGRESS
      }),
      Complaint.countDocuments({
        student: studentId,
        status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] }
      })
    ]);

    // Fetch 5 most recent complaints
    const recentComplaints = await Complaint.find({ student: studentId })
      .populate('department', 'name code')
      .populate('assignedStaff', 'fullName designation')
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch recent unread notifications
    const recentNotifications = await Notification.find({ user: studentId })
      .sort({ createdAt: -1 })
      .limit(5);

    const unreadCount = await Notification.countDocuments({ user: studentId, isRead: false });

    res.render('student/dashboard', {
      pageTitle: 'Student Dashboard - CampusCare VFSTR',
      user: req.user,
      stats: {
        total: totalComplaints,
        pending: pendingComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints
      },
      recentComplaints,
      recentNotifications,
      unreadCount,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    req.flash('error_msg', 'Could not load dashboard information.');
    res.render('student/dashboard', {
      pageTitle: 'Student Dashboard',
      user: req.user,
      stats: { total: 0, pending: 0, inProgress: 0, resolved: 0 },
      recentComplaints: [],
      recentNotifications: [],
      unreadCount: 0,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  }
};

// GET /student/submit-complaint
const getSubmitComplaint = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.render('student/submit-complaint', {
      pageTitle: 'Submit Grievance - CampusCare VFSTR',
      user: req.user,
      departments,
      categories: COMPLAINT_CATEGORIES,
      priorities: Object.values(COMPLAINT_PRIORITY),
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Submit complaint page error:', err);
    req.flash('error_msg', 'Could not load complaint submission form.');
    res.redirect('/student/dashboard');
  }
};

// POST /student/submit-complaint
const postSubmitComplaint = async (req, res) => {
  try {
    const { title, description, category, department, priority } = req.body;

    // Process uploaded attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        attachments.push({
          filename: file.filename,
          originalname: file.originalname,
          path: `/uploads/complaints/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }

    const complaintId = await generateComplaintId();

    const newComplaint = new Complaint({
      complaintId,
      student: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category,
      department: department || null,
      priority: priority || COMPLAINT_PRIORITY.MEDIUM,
      attachments,
      status: COMPLAINT_STATUS.SUBMITTED,
      statusHistory: [
        {
          status: COMPLAINT_STATUS.SUBMITTED,
          updatedBy: req.user._id,
          remarks: 'Complaint successfully registered by student.',
          timestamp: new Date()
        }
      ]
    });

    await newComplaint.save();

    // Create Notification for the Student
    await Notification.create({
      user: req.user._id,
      title: 'Complaint Submitted',
      message: `Your grievance #${complaintId} (${title}) has been submitted and is under initial review.`,
      type: NOTIFICATION_TYPES.SUCCESS,
      relatedComplaint: newComplaint._id
    });

    // Notify all active Admin accounts
    const admins = await User.find({ role: ROLES.ADMIN, accountStatus: 'ACTIVE' });
    const adminNotifications = admins.map((admin) => ({
      user: admin._id,
      title: 'New Student Grievance',
      message: `New complaint ${complaintId} submitted by ${req.user.fullName} (${req.user.regNo || 'Student'}).`,
      type: NOTIFICATION_TYPES.ALERT,
      relatedComplaint: newComplaint._id
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    req.flash('success_msg', `Complaint lodged successfully! Your Tracking ID is ${complaintId}.`);
    res.redirect(`/student/complaint/${newComplaint._id}`);
  } catch (err) {
    console.error('Complaint submission error:', err);
    req.flash('error_msg', err.message || 'Failed to submit complaint. Please check all fields.');
    res.redirect('/student/submit-complaint');
  }
};

// GET /student/complaints
const getMyComplaints = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { search, category, status, priority } = req.query;

    const query = { student: studentId };

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority;
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
      .populate('department', 'name code')
      .populate('assignedStaff', 'fullName designation')
      .sort({ createdAt: -1 });

    const departments = await Department.find({ isActive: true });

    res.render('student/my-complaints', {
      pageTitle: 'My Complaints - CampusCare VFSTR',
      user: req.user,
      complaints,
      categories: COMPLAINT_CATEGORIES,
      statuses: Object.values(COMPLAINT_STATUS),
      priorities: Object.values(COMPLAINT_PRIORITY),
      departments,
      filters: { search, category, status, priority },
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('My complaints error:', err);
    req.flash('error_msg', 'Could not load complaints.');
    res.redirect('/student/dashboard');
  }
};

// GET /student/complaint/:id
const getComplaintDetails = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      student: req.user._id
    })
      .populate('department', 'name code head')
      .populate('assignedStaff', 'fullName email phone designation')
      .populate('statusHistory.updatedBy', 'fullName role designation');

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found or unauthorized.');
      return res.redirect('/student/complaints');
    }

    // Check if feedback already submitted
    const feedback = await Feedback.findOne({ complaint: complaint._id });

    res.render('student/complaint-details', {
      pageTitle: `Grievance #${complaint.complaintId} - CampusCare VFSTR`,
      user: req.user,
      complaint,
      feedback,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Complaint details error:', err);
    req.flash('error_msg', 'Error retrieving complaint details.');
    res.redirect('/student/complaints');
  }
};

// POST /student/complaint/:id/feedback
const postFeedback = async (req, res) => {
  try {
    const { rating, description } = req.body;
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      student: req.user._id
    });

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found.');
      return res.redirect('/student/complaints');
    }

    if (complaint.status !== COMPLAINT_STATUS.RESOLVED && complaint.status !== COMPLAINT_STATUS.CLOSED) {
      req.flash('error_msg', 'Feedback can only be submitted once the grievance is marked as RESOLVED.');
      return res.redirect(`/student/complaint/${complaint._id}`);
    }

    // Check for existing feedback
    const existingFeedback = await Feedback.findOne({ complaint: complaint._id });
    if (existingFeedback) {
      req.flash('error_msg', 'Feedback has already been submitted for this complaint.');
      return res.redirect(`/student/complaint/${complaint._id}`);
    }

    const feedback = new Feedback({
      student: req.user._id,
      complaint: complaint._id,
      rating: parseInt(rating, 10),
      description: description.trim()
    });
    await feedback.save();

    // Also close complaint if student rated 4 or 5
    if (parseInt(rating, 10) >= 3 && complaint.status === COMPLAINT_STATUS.RESOLVED) {
      complaint.status = COMPLAINT_STATUS.CLOSED;
      complaint.closedDate = new Date();
      complaint.statusHistory.push({
        status: COMPLAINT_STATUS.CLOSED,
        updatedBy: req.user._id,
        remarks: `Complaint closed automatically following satisfactory student rating (${rating}/5).`,
        timestamp: new Date()
      });
      await complaint.save();
    }

    // Notify assigned staff
    if (complaint.assignedStaff) {
      await Notification.create({
        user: complaint.assignedStaff,
        title: 'Student Feedback Received',
        message: `${req.user.fullName} rated complaint #${complaint.complaintId} with ${rating} stars.`,
        type: NOTIFICATION_TYPES.INFO,
        relatedComplaint: complaint._id
      });
    }

    req.flash('success_msg', 'Thank you! Your feedback has been recorded successfully.');
    res.redirect(`/student/complaint/${complaint._id}`);
  } catch (err) {
    console.error('Feedback submit error:', err);
    req.flash('error_msg', 'Could not record feedback.');
    res.redirect(`/student/complaint/${req.params.id}`);
  }
};

// GET /student/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('relatedComplaint', 'complaintId title status')
      .sort({ createdAt: -1 });

    res.render('student/notifications', {
      pageTitle: 'Notifications - CampusCare VFSTR',
      user: req.user,
      notifications,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Notifications error:', err);
    req.flash('error_msg', 'Could not load notifications.');
    res.redirect('/student/dashboard');
  }
};

module.exports = {
  getDashboard,
  getSubmitComplaint,
  postSubmitComplaint,
  getMyComplaints,
  getComplaintDetails,
  postFeedback,
  getNotifications
};

