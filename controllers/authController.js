/**
 * Auth Controller
 * Handles user authentication, registration, password reset, and profile
 */

const User = require('../models/User');
const Department = require('../models/Department');
const { ROLES } = require('../config/constants');
const crypto = require('crypto');

// GET /auth/login
const getLogin = (req, res) => {
  res.render('auth/login', {
    pageTitle: 'Login - CampusCare VFSTR',
    error: req.flash('error_msg'),
    success: req.flash('success_msg')
  });
};

// POST /auth/login
const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error_msg', 'Please fill in all credentials');
      return res.redirect('/auth/login');
    }

    const cleanEmail = email.toLowerCase().trim();
    // Allow matching with or without dots for gmail compatibility
    const strippedEmail = cleanEmail.replace(/\.(?=.*@)/g, '');

    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: strippedEmail }
      ]
    }).select('+password');

    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    if (user.accountStatus !== 'ACTIVE') {
      req.flash('error_msg', 'Your account has been deactivated. Please contact administrator.');
      return res.redirect('/auth/login');
    }

    // Set session data
    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.userName = user.fullName;

    req.flash('success_msg', `Welcome back, ${user.fullName}!`);

    // Redirect based on role
    if (user.role === ROLES.ADMIN) {
      return res.redirect('/admin/dashboard');
    } else if (user.role === ROLES.STAFF) {
      return res.redirect('/staff/dashboard');
    } else {
      return res.redirect('/student/dashboard');
    }
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error_msg', 'An error occurred during login. Please try again.');
    res.redirect('/auth/login');
  }
};

// GET /auth/register
const getRegister = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.render('auth/register', {
      pageTitle: 'Student Registration - CampusCare VFSTR',
      departments,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Register page error:', err);
    res.render('auth/register', {
      pageTitle: 'Student Registration - CampusCare VFSTR',
      departments: [],
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  }
};

// POST /auth/register
const postRegister = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, regNo, phone, department } = req.body;

    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/auth/register');
    }

    const cleanEmail = email.toLowerCase().trim();
    const strippedEmail = cleanEmail.replace(/\.(?=.*@)/g, '');

    // Check if email already exists
    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: strippedEmail }
      ]
    });
    if (existingUser) {
      req.flash('error_msg', 'An account with this email address already exists. Please log in.');
      return res.redirect('/auth/login');
    }

    // Check if Reg No already exists if provided
    let finalRegNo = regNo ? regNo.toUpperCase().trim() : '';
    if (finalRegNo) {
      const existingReg = await User.findOne({ regNo: finalRegNo });
      if (existingReg) {
        req.flash('error_msg', 'A student with this Registration Number already exists');
        return res.redirect('/auth/register');
      }
    } else {
      finalRegNo = `STU${Date.now().toString().slice(-6)}`;
    }

    // Public registration strictly creates STUDENT accounts
    const student = new User({
      fullName: fullName.trim(),
      email: cleanEmail,
      password,
      regNo: finalRegNo,
      phone: phone ? phone.trim() : '',
      department: department || 'General',
      role: ROLES.STUDENT,
      designation: 'Student',
      accountStatus: 'ACTIVE'
    });

    await student.save();

    req.flash('success_msg', 'Registration successful! You can now log in with your credentials.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error_msg', err.message || 'Error creating account. Please try again.');
    res.redirect('/auth/register');
  }
};

// GET /auth/logout
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
};

// GET /auth/forgot-password
const getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    pageTitle: 'Forgot Password - CampusCare VFSTR',
    error: req.flash('error_msg'),
    success: req.flash('success_msg')
  });
};

// POST /auth/forgot-password
const postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      req.flash('error_msg', 'Please enter your email address.');
      return res.redirect('/auth/forgot-password');
    }

    const cleanEmail = email.toLowerCase().trim();
    const strippedEmail = cleanEmail.replace(/\.(?=.*@)/g, '');

    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: strippedEmail }
      ]
    });

    if (!user) {
      req.flash('error_msg', 'No account found with that email address.');
      return res.redirect('/auth/forgot-password');
    }

    // Generate token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // In a production server, email is sent here. For demonstration, provide direct reset link:
    const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;
    req.flash('success_msg', `Password reset token generated. In a live system an email is sent. For demo, reset here: ${resetUrl}`);
    res.redirect(`/auth/reset-password/${resetToken}`);
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error_msg', 'Could not process password reset request.');
    res.redirect('/auth/forgot-password');
  }
};

// GET /auth/reset-password/:token
const getResetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired.');
      return res.redirect('/auth/forgot-password');
    }

    res.render('auth/reset-password', {
      pageTitle: 'Reset Password - CampusCare VFSTR',
      token: req.params.token,
      error: req.flash('error_msg'),
      success: req.flash('success_msg')
    });
  } catch (err) {
    console.error('Reset password get error:', err);
    req.flash('error_msg', 'Invalid reset request.');
    res.redirect('/auth/forgot-password');
  }
};

// POST /auth/reset-password/:token
const postResetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect(`/auth/reset-password/${req.params.token}`);
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      req.flash('error_msg', 'Password reset token is invalid or has expired.');
      return res.redirect('/auth/forgot-password');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    req.flash('success_msg', 'Password reset successfully! Please log in with your new password.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Reset password post error:', err);
    req.flash('error_msg', 'Could not reset password.');
    res.redirect('/auth/forgot-password');
  }
};

// GET /profile
const getProfile = async (req, res) => {
  res.render(`${req.user.role.toLowerCase()}/profile`, {
    pageTitle: 'My Profile - CampusCare VFSTR',
    user: req.user,
    error: req.flash('error_msg'),
    success: req.flash('success_msg')
  });
};

// POST /profile/update
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, designation } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName.trim();
    if (phone) user.phone = phone.trim();
    if (designation && req.user.role !== ROLES.STUDENT) {
      user.designation = designation.trim();
    }

    if (req.file) {
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();
    req.flash('success_msg', 'Profile updated successfully!');
    res.redirect(`/${req.user.role.toLowerCase()}/profile`);
  } catch (err) {
    console.error('Profile update error:', err);
    req.flash('error_msg', 'Failed to update profile.');
    res.redirect(`/${req.user.role.toLowerCase()}/profile`);
  }
};

// POST /profile/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'New passwords do not match');
      return res.redirect(`/${req.user.role.toLowerCase()}/profile`);
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      req.flash('error_msg', 'Current password is incorrect');
      return res.redirect(`/${req.user.role.toLowerCase()}/profile`);
    }

    user.password = newPassword;
    await user.save();

    req.flash('success_msg', 'Password changed successfully!');
    res.redirect(`/${req.user.role.toLowerCase()}/profile`);
  } catch (err) {
    console.error('Password change error:', err);
    req.flash('error_msg', 'Failed to change password.');
    res.redirect(`/${req.user.role.toLowerCase()}/profile`);
  }
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
  getForgotPassword,
  postForgotPassword,
  getResetPassword,
  postResetPassword,
  getProfile,
  updateProfile,
  changePassword
};

