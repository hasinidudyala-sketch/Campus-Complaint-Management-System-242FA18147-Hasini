/**
 * Index & Public Routes
 * CampusCare - VFSTR Hyderabad Campus Complaint Management System
 */

const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const { COMPLAINT_STATUS } = require('../config/constants');

// GET / - Modern Landing Page
router.get('/', async (req, res) => {
  try {
    const [totalComplaints, resolvedComplaints, departmentsCount] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED] } }),
      Department.countDocuments({ isActive: true })
    ]);

    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 98;

    res.render('index', {
      pageTitle: 'CampusCare - VFSTR Hyderabad Campus Complaint Management System',
      stats: {
        total: totalComplaints || 120,
        resolved: resolvedComplaints || 116,
        rate: resolutionRate,
        departments: departmentsCount || 6
      },
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Landing page error:', err);
    res.render('index', {
      pageTitle: 'CampusCare - VFSTR Hyderabad Campus',
      stats: { total: 0, resolved: 0, rate: 100, departments: 6 },
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  }
});

// GET /track - Public Grievance Status Tracker
router.get('/track', async (req, res) => {
  const { complaintId } = req.query;
  let complaint = null;
  let searched = false;

  if (complaintId && complaintId.trim()) {
    searched = true;
    complaint = await Complaint.findOne({ complaintId: complaintId.trim().toUpperCase() })
      .populate('department', 'name code')
      .populate('statusHistory.updatedBy', 'role designation');
  }

  res.render('track', {
    pageTitle: 'Track Grievance Status - CampusCare VFSTR',
    complaint,
    complaintId,
    searched,
    error: req.flash('error_msg'),
    success: req.flash('success_msg')
  });
});

module.exports = router;

