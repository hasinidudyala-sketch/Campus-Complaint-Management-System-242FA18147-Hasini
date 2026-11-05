/**
 * Notification Model
 * CAMPUSCARE - VFSTR Hyderabad Campus Complaint Management System
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.INFO
    },
    relatedComplaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index to query unread notifications quickly
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

