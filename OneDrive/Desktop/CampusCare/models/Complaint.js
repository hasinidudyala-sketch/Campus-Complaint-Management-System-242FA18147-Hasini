/**
 * Complaint Model
 * CAMPUSCARE - VFSTR Hyderabad Campus Complaint Management System
 */

const mongoose = require('mongoose');
const { COMPLAINT_STATUS, COMPLAINT_PRIORITY, COMPLAINT_CATEGORIES } = require('../config/constants');

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  path: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(COMPLAINT_STATUS),
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the complaint'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select a complaint category'],
      enum: COMPLAINT_CATEGORIES
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: COMPLAINT_PRIORITY.MEDIUM
    },
    attachments: [attachmentSchema],
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED,
      index: true
    },
    staffRemarks: {
      type: String,
      default: ''
    },
    adminRemarks: {
      type: String,
      default: ''
    },
    resolutionDetails: {
      type: String,
      default: ''
    },
    statusHistory: [statusHistorySchema],
    resolvedDate: {
      type: Date,
      default: null
    },
    closedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching and filtering
complaintSchema.index({ status: 1, department: 1, priority: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);

