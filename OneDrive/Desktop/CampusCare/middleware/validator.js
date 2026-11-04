/**
 * Express Validator Rules Middleware
 * Sanitizes and validates user input
 */

const { body, validationResult } = require('express-validator');
const { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITY } = require('../config/constants');

// Validation runner helper
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMsg = errors.array().map((err) => err.msg).join('; ');

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(400).json({ success: false, message: errorMsg, errors: errors.array() });
    }

    req.flash('error_msg', errorMsg);
    return res.redirect(req.get('Referrer') || '/');
  };
};

// Registration validation
const registerRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address (e.g. yourname@gmail.com)'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('regNo')
    .optional({ checkFalsy: true })
    .trim(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim(),
  body('department')
    .optional({ checkFalsy: true })
    .trim()
];

// Login validation
const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Complaint creation validation
const complaintRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Complaint title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Complaint description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category selection is required')
    .isIn(COMPLAINT_CATEGORIES)
    .withMessage('Invalid complaint category selected'),
  body('priority')
    .optional()
    .isIn(Object.values(COMPLAINT_PRIORITY))
    .withMessage('Invalid priority selected')
];

// Feedback validation
const feedbackRules = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5 stars'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Feedback comment is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Feedback must be between 5 and 1000 characters')
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  complaintRules,
  feedbackRules
};
