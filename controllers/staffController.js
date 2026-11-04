/**
 * Staff Controller
 * Handles Staff Dashboard, Assigned Complaints, Status Updates, Remarks & Resolution
 */

const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { COMPLAINT_STATUS, COMPLAINT_PRIORITY, NOTIFICATION_TYPES, ROLES } = require('../config/constants');

// GET /staff/dashboard
const getDashboard = async (req, res) => {
  try {
    const staffId = req.user._id;

    // Real database counts for assigned complaints
    const [totalAssigned, inProgressCount, resolvedCount, pendingCount] = await Promise.all([
      Complaint.countDocuments({ assignedStaff: staffId }),
      Complaint.countDocuments({ assignedStaff: staffId, status: COMPLAINT_STATUS.IN_PROGRESS }),
      Complaint.countDocuments({ assignedStaff: staffId, status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] } }),
      Complaint.countDocuments({ assignedStaff: staffId, status: COMPLAINT_STATUS.ASSIGNED })
    ]);

    // Priority breakdown for staff
    const [urgentCount, highCount] = await Promise.all([
      Complaint.countDocuments({ assignedStaff: staffId, priority: COMPLAINT_PRIORITY.URGENT, status: { $ne: COMPLAINT_STATUS.CLOSED } }),
      Complaint.countDocuments({ assignedStaff: staffId, priority: COMPLAINT_PRIORITY.HIGH, status: { $ne: COMPLAINT_STATUS.CLOSED } })
    ]);

    // Recent 5 complaints assigned
    const recentComplaints = await Complaint.find({ assignedStaff: staffId })
      .populate('student', 'fullName regNo department phone')
      .populate('department', 'name code')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Recent notifications
    const recentNotifications = await Notification.find({ user: staffId })
      .sort({ createdAt: -1 })
      .limit(5);

    const unreadCount = await Notification.countDocuments({ user: staffId, isRead: false });

    res.render('staff/dashboard', {
      pageTitle: 'Staff Dashboard - CampusCare VFSTR',
      user: req.user,
      stats: {
        total: totalAssigned,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        pending: pendingCount,
        urgent: urgentCount,
        high: highCount
      },
      recentComplaints,
      recentNotifications,
      unreadCount,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Staff dashboard error:', err);
    req.flash('error_msg', 'Could not load staff dashboard.');
    res.render('staff/dashboard', {
      pageTitle: 'Staff Dashboard',
      user: req.user,
      stats: { total: 0, inProgress: 0, resolved: 0, pending: 0, urgent: 0, high: 0 },
      recentComplaints: [],
      recentNotifications: [],
      unreadCount: 0,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  }
};

// GET /staff/complaints
const getAssignedComplaints = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { search, status, priority } = req.query;

    const query = { assignedStaff: staffId };

    if (status && status !== 'ALL') {
      query.status = status;
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
      .populate('student', 'fullName regNo department phone')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    res.render('staff/assigned-complaints', {
      pageTitle: 'Assigned Complaints - CampusCare VFSTR',
      user: req.user,
      complaints,
      statuses: [
        COMPLAINT_STATUS.ASSIGNED,
        COMPLAINT_STATUS.IN_PROGRESS,
        COMPLAINT_STATUS.RESOLVED,
        COMPLAINT_STATUS.CLOSED
      ],
      priorities: Object.values(COMPLAINT_PRIORITY),
      filters: { search, status, priority },
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Assigned complaints error:', err);
    req.flash('error_msg', 'Could not load assigned complaints.');
    res.redirect('/staff/dashboard');
  }
};

// GET /staff/complaint/:id
const getComplaintDetails = async (req, res) => {
  try {
    const staffId = req.user._id;

    // Staff only accesses complaints assigned to them
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedStaff: staffId
    })
      .populate('student', 'fullName regNo department phone email')
      .populate('department', 'name code head')
      .populate('statusHistory.updatedBy', 'fullName role designation');

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found or you are not authorized to view this complaint.');
      return res.redirect('/staff/complaints');
    }

    res.render('staff/complaint-details', {
      pageTitle: `Complaint #${complaint.complaintId} - CampusCare VFSTR`,
      user: req.user,
      complaint,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Staff complaint details error:', err);
    req.flash('error_msg', 'Failed to retrieve complaint details.');
    res.redirect('/staff/complaints');
  }
};

// POST /staff/complaint/:id/update-status
const updateComplaintStatus = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { status, staffRemarks, resolutionDetails } = req.body;

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedStaff: staffId
    });

    if (!complaint) {
      req.flash('error_msg', 'Complaint not found or unauthorized.');
      return res.redirect('/staff/complaints');
    }

    const previousStatus = complaint.status;
    complaint.status = status;

    if (staffRemarks) {
      complaint.staffRemarks = staffRemarks.trim();
    }
    if (resolutionDetails) {
      complaint.resolutionDetails = resolutionDetails.trim();
    }

    if (status === COMPLAINT_STATUS.RESOLVED && !complaint.resolvedDate) {
      complaint.resolvedDate = new Date();
    }

    // Append to status history
    complaint.statusHistory.push({
      status,
      updatedBy: staffId,
      remarks: staffRemarks ? staffRemarks.trim() : `Status updated to ${status} by staff member.`,
      timestamp: new Date()
    });

    await complaint.save();

    // Notify the Student
    await Notification.create({
      user: complaint.student,
      title: `Complaint Status: ${status}`,
      message: `Staff member ${req.user.fullName} updated your grievance #${complaint.complaintId} status to "${status}". ${staffRemarks ? 'Remark: ' + staffRemarks : ''}`,
      type: status === COMPLAINT_STATUS.RESOLVED ? NOTIFICATION_TYPES.SUCCESS : NOTIFICATION_TYPES.INFO,
      relatedComplaint: complaint._id
    });

    // Notify Admins
    const admins = await User.find({ role: ROLES.ADMIN, accountStatus: 'ACTIVE' });
    const adminNotifications = admins.map((admin) => ({
      user: admin._id,
      title: `Complaint Updated: #${complaint.complaintId}`,
      message: `Staff ${req.user.fullName} updated #${complaint.complaintId} from ${previousStatus} to ${status}.`,
      type: NOTIFICATION_TYPES.INFO,
      relatedComplaint: complaint._id
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    req.flash('success_msg', `Complaint #${complaint.complaintId} status updated to ${status}.`);
    res.redirect(`/staff/complaint/${complaint._id}`);
  } catch (err) {
    console.error('Update complaint status error:', err);
    req.flash('error_msg', 'Failed to update complaint status.');
    res.redirect(`/staff/complaint/${req.params.id}`);
  }
};

// GET /staff/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('relatedComplaint', 'complaintId title status')
      .sort({ createdAt: -1 });

    res.render('staff/notifications', {
      pageTitle: 'Notifications - CampusCare VFSTR',
      user: req.user,
      notifications,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Notifications error:', err);
    req.flash('error_msg', 'Could not load notifications.');
    res.redirect('/staff/dashboard');
  }
};

module.exports = {
  getDashboard,
  getAssignedComplaints,
  getComplaintDetails,
  updateComplaintStatus,
  getNotifications
};

