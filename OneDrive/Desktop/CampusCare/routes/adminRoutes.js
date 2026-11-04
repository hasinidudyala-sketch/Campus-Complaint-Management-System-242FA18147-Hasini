/**
 * Admin Routes
 * CampusCare - VFSTR Hyderabad Campus Complaint Management System
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');
const { ROLES } = require('../config/constants');

// Apply authentication and ADMIN role check to all admin routes
router.use(ensureAuthenticated);
router.use(authorizeRoles(ROLES.ADMIN));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Complaints Management
router.get('/complaints', adminController.getAllComplaints);
router.get('/complaint/:id', adminController.getComplaintDetails);
router.post('/complaint/:id/assign', adminController.postAssignComplaint);
router.post('/complaint/:id/update-status', adminController.postUpdateComplaintStatus);

// Department Management
router.get('/departments', adminController.getDepartments);
router.post('/departments', adminController.postCreateDepartment);
router.post('/departments/:id/edit', adminController.postEditDepartment);

// Staff Management
router.get('/staff', adminController.getStaffManagement);
router.post('/staff', adminController.postCreateStaff);
router.post('/staff/:id/toggle-status', adminController.toggleStaffStatus);

// Student Management
router.get('/students', adminController.getStudentManagement);
router.post('/students/:id/toggle-status', adminController.toggleStudentStatus);

// Feedback Management
router.get('/feedback', adminController.getFeedbackList);

// Reports & CSV Exports
router.get('/reports', adminController.getReports);
router.get('/reports/export-complaints', adminController.exportComplaintsCSV);
router.get('/reports/export-feedback', adminController.exportFeedbackCSV);

// Notifications
router.get('/notifications', adminController.getNotifications);

// Profile
router.get('/profile', authController.getProfile);
router.post('/profile/update', uploadProfileImage, authController.updateProfile);
router.post('/profile/change-password', authController.changePassword);

module.exports = router;

