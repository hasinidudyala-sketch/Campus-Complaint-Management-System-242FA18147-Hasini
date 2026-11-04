/**
 * Staff Routes
 * CampusCare - VFSTR Hyderabad Campus Complaint Management System
 */

const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authController = require('../controllers/authController');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');
const { ROLES } = require('../config/constants');

// Apply authentication and STAFF role check to all staff routes
router.use(ensureAuthenticated);
router.use(authorizeRoles(ROLES.STAFF));

// Dashboard
router.get('/dashboard', staffController.getDashboard);

// Assigned Complaints List
router.get('/complaints', staffController.getAssignedComplaints);

// Complaint Details
router.get('/complaint/:id', staffController.getComplaintDetails);

// Update Complaint Status & Add Remarks
router.post('/complaint/:id/update-status', staffController.updateComplaintStatus);

// Notifications
router.get('/notifications', staffController.getNotifications);

// Profile
router.get('/profile', authController.getProfile);
router.post('/profile/update', uploadProfileImage, authController.updateProfile);
router.post('/profile/change-password', authController.changePassword);

module.exports = router;

