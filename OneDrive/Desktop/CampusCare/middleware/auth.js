/**
 * Authentication & Authorization Middleware
 * Protects routes based on session state and user roles.
 */

const { ROLES } = require('../config/constants');
const User = require('../models/User');

// Check if user is logged in
const ensureAuthenticated = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        req.session.destroy();
        req.flash('error_msg', 'Session invalid. Please log in again.');
        return res.redirect('/auth/login');
      }

      if (user.accountStatus !== 'ACTIVE') {
        req.session.destroy();
        req.flash('error_msg', 'Your account has been deactivated. Please contact administrator.');
        return res.redirect('/auth/login');
      }

      req.user = user;
      res.locals.currentUser = user;
      return next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      req.flash('error_msg', 'Authentication error.');
      return res.redirect('/auth/login');
    }
  }

  // Not logged in
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
  }

  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
};

// Check if user has required role(s)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error_msg', 'Access denied.');
      return res.redirect('/auth/login');
    }

    if (!roles.includes(req.user.role)) {
      req.flash('error_msg', 'Unauthorized access to this resource.');
      // Redirect to their own dashboard
      if (req.user.role === ROLES.ADMIN) {
        return res.redirect('/admin/dashboard');
      } else if (req.user.role === ROLES.STAFF) {
        return res.redirect('/staff/dashboard');
      } else {
        return res.redirect('/student/dashboard');
      }
    }

    next();
  };
};

// Redirect logged-in users away from login/register pages
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userRole) {
    if (req.session.userRole === ROLES.ADMIN) {
      return res.redirect('/admin/dashboard');
    } else if (req.session.userRole === ROLES.STAFF) {
      return res.redirect('/staff/dashboard');
    } else {
      return res.redirect('/student/dashboard');
    }
  }
  next();
};

module.exports = {
  ensureAuthenticated,
  authorizeRoles,
  redirectIfAuthenticated
};

