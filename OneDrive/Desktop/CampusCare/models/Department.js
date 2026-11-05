/**
 * Department Model
 * CAMPUSCARE - VFSTR Hyderabad Campus Complaint Management System
 */

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide department name'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Please provide department code'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, 'Department code cannot exceed 10 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    head: {
      type: String,
      trim: true,
      default: 'Head of Department'
    },
    assignedStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Department', departmentSchema);

