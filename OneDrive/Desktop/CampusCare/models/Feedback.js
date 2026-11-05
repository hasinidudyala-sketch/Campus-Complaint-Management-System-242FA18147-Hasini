/**
 * Feedback Model
 * CAMPUSCARE - VFSTR Hyderabad Campus Complaint Management System
 */

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      unique: true // Prevent duplicate feedback for the same complaint
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5
    },
    description: {
      type: String,
      required: [true, 'Please provide feedback comments'],
      trim: true,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);

