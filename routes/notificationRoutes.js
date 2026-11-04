/**
 * Notification Routes
 * CampusCare - VFSTR Hyderabad Campus Complaint Management System
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

// Mark single notification as read
router.post('/:id/mark-read', notificationController.markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.post('/:id/delete', notificationController.deleteNotification);

module.exports = router;

