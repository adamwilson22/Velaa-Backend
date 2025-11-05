const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../config/jwt');

// Middleware to authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('🔒 Auth failed: No Authorization header provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Extract token from "Bearer TOKEN"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      console.log('🔒 Auth failed: Empty token after extraction');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
    }

    // Log token validation attempt in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 Attempting to verify token:', token.substring(0, 20) + '...');
    }

    // Verify token
    const decoded = verifyToken(token);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token verified, userId:', decoded.userId);
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('🔒 Auth failed: User not found for userId:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.',
      });
    }

    if (!user.isActive) {
      console.log('🔒 Auth failed: User account is deactivated:', user._id);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      console.log('🔒 Auth failed: User account is locked:', user._id);
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts.',
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User authenticated:', user.phone, '- Role:', user.role);
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      console.log('🔒 Auth failed: Token is invalid or expired');
      console.log('Error details:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired.',
      });
    }

    console.error('❌ Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = authorize('admin');

// Middleware to check if user is admin or manager
const requireManager = authorize('admin', 'manager');

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive && !user.isLocked) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Middleware to check if user owns the resource or is admin/manager
const checkOwnership = (resourceField = 'createdBy') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Admin and manager can access all resources
    if (['admin', 'manager'].includes(req.user.role)) {
      return next();
    }

    // Check if user owns the resource
    const resource = req.resource || req.body;
    
    if (!resource) {
      return res.status(400).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    const ownerId = resource[resourceField];
    
    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
      });
    }

    next();
  };
};

// Middleware to check if user can modify the resource
const checkModifyPermission = (resourceField = 'createdBy') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Admin can modify all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Manager can modify resources in their warehouse
    if (req.user.role === 'manager') {
      // Additional logic can be added here to check warehouse ownership
      return next();
    }

    // Regular users can only modify their own resources
    const resource = req.resource || req.body;
    
    if (!resource) {
      return res.status(400).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    const ownerId = resource[resourceField];
    
    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own resources.',
      });
    }

    next();
  };
};

// Middleware to validate user account status
const validateAccountStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account is deactivated. Please contact administrator.',
    });
  }

  if (req.user.isLocked) {
    return res.status(403).json({
      success: false,
      message: 'Account is temporarily locked due to multiple failed login attempts.',
    });
  }

  if (!req.user.isEmailVerified && req.path !== '/verify-email') {
    return res.status(403).json({
      success: false,
      message: 'Email verification required.',
    });
  }

  next();
};

// Middleware to log user activity
const logActivity = (action) => {
  return (req, res, next) => {
    if (req.user) {
      // Log user activity - can be extended to save to database
      console.log(`User ${req.user._id} performed action: ${action} at ${new Date().toISOString()}`);
      
      // You can extend this to save activity logs to database
      // ActivityLog.create({
      //   user: req.user._id,
      //   action,
      //   ip: req.ip,
      //   userAgent: req.get('User-Agent'),
      //   timestamp: new Date()
      // });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireManager,
  optionalAuth,
  checkOwnership,
  checkModifyPermission,
  validateAccountStatus,
  logActivity,
};
