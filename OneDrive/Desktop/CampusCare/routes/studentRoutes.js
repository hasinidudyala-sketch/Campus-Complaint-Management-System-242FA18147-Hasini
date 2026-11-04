/**
 * Student Routes
 * CampusCare - VFSTR Hyderabad Campus Complaint Management System
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authController = require('../controllers/authController');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');
const { uploadComplaintFiles, uploadProfileImage } = require('../middleware/upload');
const { validate, complaintRules, feedbackRules } = require('../middleware/validator');
const { ROLES } = require('../config/constants');

// Apply authentication and STUDENT role check to all student routes
router.use(ensureAuthenticated);
router.use(authorizeRoles(ROLES.STUDENT));

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Submit Complaint
router.get('/submit-complaint', studentController.getSubmitComplaint);
router.post(
  '/submit-complaint',
  uploadComplaintFiles,
  validate(complaintRules),
  studentController.postSubmitComplaint
);

// My Complaints List
router.get('/complaints', studentController.getMyComplaints);

// Complaint Details
router.get('/complaint/:id', studentController.getComplaintDetails);

// Feedback Submission
router.post(
  '/complaint/:id/feedback',
  validate(feedbackRules),
  studentController.postFeedback
);

// Notifications
router.get('/notifications', studentController.getNotifications);

// Profile
router.get('/profile', authController.getProfile);
router.post('/profile/update', uploadProfileImage, authController.updateProfile);
router.post('/profile/change-password', authController.changePassword);

module.exports = router;

