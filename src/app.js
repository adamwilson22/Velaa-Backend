const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');

// Import middleware
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const clientRoutes = require('./routes/clients');
const billingRoutes = require('./routes/billing');
const dashboardRoutes = require('./routes/dashboard');

// Import constants
const { HTTP_STATUS, ERROR_MESSAGES, APP_CONSTANTS } = require('./utils/constants');
const { responseHelpers } = require('./utils/helpers');

// Create Express app
const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// XSS protection is now handled by helmet middleware above

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'brand', 'model', 'status', 'condition']
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(generalLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      service: APP_CONSTANTS.NAME,
      version: APP_CONSTANTS.VERSION,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Documentation',
    data: {
      service: APP_CONSTANTS.NAME,
      version: APP_CONSTANTS.VERSION,
      description: APP_CONSTANTS.DESCRIPTION,
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      endpoints: {
        authentication: {
          base: '/api/auth',
          endpoints: [
            'POST /register - User registration',
            'POST /verify-otp - OTP verification',
            'POST /login - User login',
            'POST /forgot-password - Password recovery',
            'POST /verify-recovery-otp - Verify recovery OTP',
            'POST /reset-password - Reset password',
            'POST /logout - User logout',
            'GET /profile - Get user profile',
            'PUT /profile - Update user profile',
          ],
        },
        vehicles: {
          base: '/api/vehicles',
          endpoints: [
            'GET / - Get all vehicles',
            'POST / - Add new vehicle',
            'GET /:id - Get vehicle by ID',
            'PUT /:id - Update vehicle',
            'DELETE /:id - Delete vehicle',
            'GET /search - Search vehicles',
            'PUT /:id/status - Update vehicle status',
            'POST /:id/images - Upload vehicle images',
            'GET /stats - Get vehicle statistics',
          ],
        },
        clients: {
          base: '/api/clients',
          endpoints: [
            'GET / - Get all clients',
            'POST / - Add new client',
            'GET /:id - Get client by ID',
            'PUT /:id - Update client',
            'DELETE /:id - Delete client',
            'GET /search - Search clients',
            'GET /:id/vehicles - Get client vehicles',
            'GET /:id/billing - Get client billing',
          ],
        },
        billing: {
          base: '/api/billing',
          endpoints: [
            'GET / - Get all billing records',
            'POST / - Create billing record',
            'GET /:id - Get billing by ID',
            'PUT /:id - Update billing record',
            'GET /client/:clientId - Get client billing',
            'GET /vehicle/:vehicleId - Get vehicle billing',
            'POST /:id/payment - Record payment',
            'GET /outstanding - Get outstanding balances',
          ],
        },
        dashboard: {
          base: '/api/dashboard',
          endpoints: [
            'GET /stats - Get dashboard statistics',
            'GET /recent-activity - Get recent activity',
            'GET /chart-data - Get chart data',
          ],
        },
      },
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: `Welcome to ${APP_CONSTANTS.NAME}`,
    data: {
      service: APP_CONSTANTS.NAME,
      version: APP_CONSTANTS.VERSION,
      description: APP_CONSTANTS.DESCRIPTION,
      documentation: `${req.protocol}://${req.get('host')}/api/docs`,
      health: `${req.protocol}://${req.get('host')}/health`,
    },
  });
});

// Handle 404 - Route not found
app.all('*', (req, res) => {
  return responseHelpers.error(
    res,
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND
  );
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global Error Handler:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
    }));
    
    return responseHelpers.error(
      res,
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      errors
    );
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    
    return responseHelpers.error(
      res,
      `${field} '${value}' already exists`,
      HTTP_STATUS.CONFLICT
    );
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    return responseHelpers.error(
      res,
      'Invalid ID format',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return responseHelpers.error(
      res,
      'Invalid token',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (error.name === 'TokenExpiredError') {
    return responseHelpers.error(
      res,
      'Token expired',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return responseHelpers.error(
      res,
      'File too large',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return responseHelpers.error(
      res,
      'Too many files',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // CORS errors
  if (error.message === 'Not allowed by CORS') {
    return responseHelpers.error(
      res,
      'CORS policy violation',
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Rate limiting errors
  if (error.message === 'Too many requests') {
    return responseHelpers.error(
      res,
      'Rate limit exceeded',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  }

  // Default error
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = process.env.NODE_ENV === 'production' 
    ? ERROR_MESSAGES.INTERNAL_SERVER_ERROR 
    : error.message;

  return responseHelpers.error(res, message, statusCode);
});

module.exports = app;
