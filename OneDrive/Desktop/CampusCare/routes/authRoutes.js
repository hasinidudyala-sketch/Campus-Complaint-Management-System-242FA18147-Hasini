/**
 * Auth Routes
 * Handles user login, registration, password reset, and logout
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');
const { validate, registerRules, loginRules } = require('../middleware/validator');

// Login
router.get('/login', redirectIfAuthenticated, authController.getLogin);
router.post('/login', redirectIfAuthenticated, validate(loginRules), authController.postLogin);

// Registration (Students only)
router.get('/register', redirectIfAuthenticated, authController.getRegister);
router.post('/register', redirectIfAuthenticated, validate(registerRules), authController.postRegister);

// Logout
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

// Forgot & Reset Password
router.get('/forgot-password', redirectIfAuthenticated, authController.getForgotPassword);
router.post('/forgot-password', redirectIfAuthenticated, authController.postForgotPassword);
router.get('/reset-password/:token', redirectIfAuthenticated, authController.getResetPassword);
router.post('/reset-password/:token', redirectIfAuthenticated, authController.postResetPassword);

module.exports = router;

