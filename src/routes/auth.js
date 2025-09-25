const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validation');
const { authLimiter, otpLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { userSchemas, paramSchemas, commonSchemas } = require('../middleware/validation');
const Joi = require('joi');

// Import controllers
const authController = require('../controllers/authController');

// Public routes
router.post('/register', 
  authLimiter,
  validate(userSchemas.register),
  authController.register
);

router.post('/verify-otp',
  otpLimiter,
  validate(userSchemas.verifyOtp),
  authController.verifyOtp
);

router.post('/login',
  authLimiter,
  validate(userSchemas.login),
  authController.login
);

router.post('/forgot-password',
  passwordResetLimiter,
  validate(userSchemas.forgotPassword),
  authController.forgotPassword
);

router.post('/verify-recovery-otp',
  otpLimiter,
  validate(userSchemas.verifyOtp),
  authController.verifyRecoveryOtp
);

router.post('/reset-password',
  passwordResetLimiter,
  validate(userSchemas.resetPassword),
  authController.resetPassword
);

// Protected routes
router.post('/logout',
  authenticate,
  authController.logout
);

router.get('/profile',
  authenticate,
  authController.getProfile
);

router.put('/profile',
  authenticate,
  validate(userSchemas.updateProfile),
  authController.updateProfile
);

// Admin routes
router.get('/users',
  authenticate,
  requireAdmin,
  authController.getAllUsers
);

router.get('/users/:id',
  authenticate,
  requireAdmin,
  validateParams(paramSchemas.id),
  authController.getUserById
);

router.put('/users/:id',
  authenticate,
  requireAdmin,
  validateParams(paramSchemas.id),
  validate(userSchemas.updateProfile),
  authController.updateUser
);

router.delete('/users/:id',
  authenticate,
  requireAdmin,
  validateParams(paramSchemas.id),
  authController.deleteUser
);

// Additional auth routes
router.put('/change-password',
  authenticate,
  validate(Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password.required(),
  })),
  authController.changePassword
);

router.post('/send-phone-verification',
  authenticate,
  validate(Joi.object({
    phone: commonSchemas.phone.required(),
  })),
  authController.sendPhoneVerificationOTP
);

router.post('/verify-phone',
  authenticate,
  validate(userSchemas.verifyOtp),
  authController.verifyPhoneNumber
);

router.get('/stats',
  authenticate,
  requireAdmin,
  authController.getUserStats
);

module.exports = router;
