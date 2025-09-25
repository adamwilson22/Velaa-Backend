const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

// Create MongoDB store for rate limiting (optional, falls back to memory store)
const createMongoStore = () => {
  try {
    return new MongoStore({
      uri: process.env.MONGODB_URI,
      collectionName: 'rate_limits',
      expireTimeMs: 15 * 60 * 1000, // 15 minutes
    });
  } catch (error) {
    console.warn('MongoDB store for rate limiting not available, using memory store');
    return undefined;
  }
};

// Custom key generator that includes user ID if authenticated
const createKeyGenerator = (includeUserId = false) => {
  return (req) => {
    let key = req.ip;
    
    if (includeUserId && req.user && req.user._id) {
      key += `:${req.user._id}`;
    }
    
    return key;
  };
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000),
  });
};

// Skip rate limiting for certain conditions
const skipSuccessfulRequests = (req, res) => {
  return res.statusCode < 400;
};

const skipFailedRequests = (req, res) => {
  return res.statusCode >= 400;
};

// General rate limiter - applies to all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(false),
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication attempts per windowMs
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(false),
  skipSuccessfulRequests: true, // Don't count successful requests
});

// OTP rate limiter - very strict
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 OTP requests per hour
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(false),
  skipSuccessfulRequests: false, // Count all requests
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(false),
});

// API rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 API requests per windowMs
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(true), // Include user ID
});

// Upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 upload requests per windowMs
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(true),
});

// Search rate limiter
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 search requests per minute
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(true),
});

// Report generation rate limiter
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 report generation requests per windowMs
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(true),
});

// Notification rate limiter
const notificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 notification requests per minute
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMongoStore(),
  keyGenerator: createKeyGenerator(true),
});

// Create custom rate limiter
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Default limit
    message: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    store: createMongoStore(),
    keyGenerator: createKeyGenerator(false),
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Middleware to add rate limit info to response
const addRateLimitInfo = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (req.rateLimit) {
      data.rateLimit = {
        limit: req.rateLimit.limit,
        current: req.rateLimit.current,
        remaining: req.rateLimit.remaining,
        resetTime: new Date(req.rateLimit.resetTime),
      };
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware to skip rate limiting for certain users/conditions
const skipRateLimitFor = (condition) => {
  return (req, res, next) => {
    if (condition(req)) {
      req.skipRateLimit = true;
    }
    next();
  };
};

// Skip rate limiting for admin users
const skipForAdmin = skipRateLimitFor((req) => {
  return req.user && req.user.role === 'admin';
});

// Skip rate limiting for internal requests
const skipForInternal = skipRateLimitFor((req) => {
  const internalIPs = ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
  return internalIPs.some(ip => req.ip.includes(ip.split('/')[0]));
});

// Dynamic rate limiter based on user role
const dynamicRateLimiter = (req, res, next) => {
  let maxRequests = 100; // Default for unauthenticated users
  
  if (req.user) {
    switch (req.user.role) {
      case 'admin':
        maxRequests = 1000;
        break;
      case 'manager':
        maxRequests = 500;
        break;
      case 'user':
        maxRequests = 200;
        break;
      default:
        maxRequests = 100;
    }
  }
  
  const limiter = createCustomLimiter({
    max: maxRequests,
    keyGenerator: createKeyGenerator(true),
  });
  
  limiter(req, res, next);
};

module.exports = {
  generalLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
  apiLimiter,
  uploadLimiter,
  searchLimiter,
  reportLimiter,
  notificationLimiter,
  createCustomLimiter,
  addRateLimitInfo,
  skipRateLimitFor,
  skipForAdmin,
  skipForInternal,
  dynamicRateLimiter,
};
