const Joi = require('joi');

// Helper function to validate request data
const validate = (schema) => {
  return (req, res, next) => {
    const rawBody = req.body; // capture before Joi strips unknowns
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;

    // DEV LOG: show sanitized vs raw for debugging update issues
    if (process.env.NODE_ENV !== 'production') {
      try {
        const limitedRaw = JSON.parse(JSON.stringify(rawBody || {}));
        const limitedSanitized = JSON.parse(JSON.stringify(value || {}));
        console.log('\n[VALIDATION] %s %s', req.method, req.originalUrl);
        console.log('[VALIDATION] Raw body   :', limitedRaw);
        console.log('[VALIDATION] Sanitized  :', limitedSanitized);
      } catch (_) {}
    }
    next();
  };
};

// Helper function to validate query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors,
      });
    }

    req.query = value;
    next();
  };
};

// Helper function to validate URL parameters
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors,
      });
    }

    req.params = value;
    next();
  };
};

// Common validation schemas
const commonSchemas = {
  // MongoDB ObjectId validation
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format'),
  
  // Phone number validation
  phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).min(10).max(15),
  
  // Email validation
  email: Joi.string().email().lowercase(),
  
  // Password validation
  password: Joi.string().min(6).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  // Date validation
  date: Joi.date().iso(),
  
  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default('-createdAt'),
    search: Joi.string().trim().allow(''),
    q: Joi.string().trim().allow(''),
    type: Joi.string().trim().allow(''),
    isActive: Joi.string().allow(''),
    sortBy: Joi.string().allow(''),
    sortOrder: Joi.string().valid('asc', 'desc').allow(''),
  },
};

// User validation schemas
const userSchemas = {
  // Step 1: Initial registration (basic info only)
  register: Joi.object({
    ownerManagerName: Joi.string().trim().min(2).max(100).required(),
    warehouseName: Joi.string().trim().min(2).max(100).required(),
    phone: commonSchemas.phone.required(),
  }),

  // Step 2: Verify OTP only
  verifyOtp: Joi.object({
    phone: commonSchemas.phone.required(),
    otp: Joi.string().length(4).pattern(/^\d+$/).required(), // Changed to 4 digits for dummy OTP
  }),

  // Step 3: Complete registration (password creation only)
  completeRegistration: Joi.object({
    phone: commonSchemas.phone.required(),
    password: commonSchemas.password.required(),
  }),

  login: Joi.object({
    phone: commonSchemas.phone.required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    phone: commonSchemas.phone.required(),
  }),

  resetPassword: Joi.object({
    phone: commonSchemas.phone.required(),
    // Using 4-digit OTP in development (dummy OTP: 1234)
    otp: Joi.string().length(4).pattern(/^\d+$/).required(),
    newPassword: commonSchemas.password.required(),
  }),

  updateProfile: Joi.object({
    ownerManagerName: Joi.string().trim().min(2).max(100),
    email: commonSchemas.email,
    warehouseName: Joi.string().trim().min(2).max(100),
    warehouseAddress: Joi.object({
      street: Joi.string().trim(),
      city: Joi.string().trim(),
      state: Joi.string().trim(),
      zipCode: Joi.string().trim().pattern(/^\d{5,6}$/),
      country: Joi.string().trim(),
    }),
    warehouseCapacity: Joi.number().integer().min(1),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean(),
        sms: Joi.boolean(),
        push: Joi.boolean(),
      }),
      language: Joi.string(),
      timezone: Joi.string(),
    }),
  }),
};

// Vehicle validation schemas
const vehicleSchemas = {
  create: Joi.object({
    // Required fields
    chassisNumber: Joi.string().trim().uppercase().min(8).max(17)
      .pattern(/^[A-HJ-NPR-Z0-9]+$/)
      .message('chassisNumber must contain only valid VIN characters (no I/O/Q)')
      .required(),
    owner: commonSchemas.objectId.required(),
    brand: Joi.string().trim().min(1).max(50).required(),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    color: Joi.string().trim().min(1).max(30).required(),
    
    // Optional fields
    marketValue: Joi.number().min(0).default(0),
    showInMarketplace: Joi.boolean().default(false),
    mileage: Joi.number().min(0).default(0),
    status: Joi.string().valid('Available', 'Reserved', 'Sold').default('Available'),
    isActive: Joi.boolean().default(true),
    monthlyFee: Joi.number().min(0).default(0),
    purchaseDate: commonSchemas.date.default(() => new Date()),
    bondExpiryDate: commonSchemas.date.allow(null),
    tags: Joi.array().items(Joi.string().trim().lowercase()),
    images: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      caption: Joi.string().trim().allow(''),
      isPrimary: Joi.boolean().default(false)
    }))
  }),

  update: Joi.object({
    chassisNumber: Joi.string().trim().uppercase().min(8).max(17)
      .pattern(/^[A-HJ-NPR-Z0-9]+$/),
    owner: commonSchemas.objectId,
    brand: Joi.string().trim().min(1).max(50),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1),
    color: Joi.string().trim().min(1).max(30),
    marketValue: Joi.number().min(0),
    showInMarketplace: Joi.boolean(),
    mileage: Joi.number().min(0),
    status: Joi.string().valid('Available', 'Reserved', 'Sold'),
    isActive: Joi.boolean(),
    monthlyFee: Joi.number().min(0),
    purchaseDate: commonSchemas.date,
    bondExpiryDate: commonSchemas.date.allow(null),
    tags: Joi.array().items(Joi.string().trim().lowercase()),
  }),

  search: Joi.object({
    q: Joi.string().trim().min(1),
    brand: Joi.string().trim(),
    status: Joi.string().valid('Available', 'Reserved', 'Sold'),
    owner: commonSchemas.objectId,
    ...commonSchemas.pagination,
  }),
};

// Client validation schemas (minimal)
const clientSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    phone: commonSchemas.phone.required(),
    type: Joi.string().valid('Individual', 'Dealer', 'Company').required(),
    isActive: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    phone: commonSchemas.phone,
    type: Joi.string().valid('Individual', 'Dealer', 'Company'),
    isActive: Joi.boolean(),
  }),

  search: Joi.object({
    q: Joi.string().trim().min(1),
    type: Joi.string().valid('Individual', 'Dealer', 'Company'),
    isActive: Joi.boolean(),
    ...commonSchemas.pagination,
  }),
};

// Billing validation schemas
const billingSchemas = {
  create: Joi.object({
    client: commonSchemas.objectId.required(),
    vehicle: commonSchemas.objectId.required(),
    transactionType: Joi.string().valid('Sale', 'Purchase', 'Service', 'Rental', 'Insurance', 'Other').default('Sale'),
    baseAmount: Joi.number().min(0).required(),
    dueDate: commonSchemas.date.required(),
    taxes: Joi.array().items(Joi.object({
      name: Joi.string().trim().required(),
      rate: Joi.number().min(0).max(100).required(),
      amount: Joi.number().min(0).required(),
    })),
    additionalCharges: Joi.array().items(Joi.object({
      description: Joi.string().trim().required(),
      amount: Joi.number().required(),
      type: Joi.string().valid('Charge', 'Discount').default('Charge'),
    })),
    terms: Joi.string().trim().max(1000).allow(''),
    notes: Joi.string().trim().max(1000).allow(''),
  }),

  addPayment: Joi.object({
    amount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card', 'Other').required(),
    referenceNumber: Joi.string().trim().allow(''),
    notes: Joi.string().trim().max(500).allow(''),
  }),
};

// Parameter validation schemas
const paramSchemas = {
  id: Joi.object({
    id: commonSchemas.objectId.required(),
  }),
};

// Query validation schemas
const querySchemas = {
  pagination: Joi.object(commonSchemas.pagination),
  
  vehicleSearch: vehicleSchemas.search,
  
  clientSearch: clientSchemas.search,
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  commonSchemas,
  userSchemas,
  vehicleSchemas,
  clientSchemas,
  billingSchemas,
  paramSchemas,
  querySchemas,
};
