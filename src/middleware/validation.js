const Joi = require('joi');

// Helper function to validate request data
const validate = (schema) => {
  return (req, res, next) => {
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
  },
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: commonSchemas.email.required(),
    phone: commonSchemas.phone.required(),
    password: commonSchemas.password.required(),
    warehouseName: Joi.string().trim().min(2).max(100).required(),
    warehouseAddress: Joi.object({
      street: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      zipCode: Joi.string().trim().pattern(/^\d{5,6}$/).required(),
      country: Joi.string().trim().default('India'),
    }).required(),
    warehouseCapacity: Joi.number().integer().min(1).required(),
  }),

  login: Joi.object({
    phone: commonSchemas.phone.required(),
    password: Joi.string().required(),
  }),

  verifyOtp: Joi.object({
    phone: commonSchemas.phone.required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  forgotPassword: Joi.object({
    phone: commonSchemas.phone.required(),
  }),

  resetPassword: Joi.object({
    phone: commonSchemas.phone.required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
    newPassword: commonSchemas.password.required(),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(2).max(50),
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
    chassisNumber: Joi.string().trim().uppercase().length(17).pattern(/^[A-HJ-NPR-Z0-9]{17}$/).required(),
    engineNumber: Joi.string().trim().uppercase().required(),
    registrationNumber: Joi.string().trim().uppercase().allow(''),
    brand: Joi.string().trim().min(1).max(50).required(),
    model: Joi.string().trim().min(1).max(50).required(),
    variant: Joi.string().trim().max(50).allow(''),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    color: Joi.string().trim().min(1).max(30).required(),
    fuelType: Joi.string().valid('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG').required(),
    transmission: Joi.string().valid('Manual', 'Automatic', 'CVT', 'AMT').required(),
    engineCapacity: Joi.number().min(0),
    mileage: Joi.number().min(0),
    seatingCapacity: Joi.number().integer().min(1).max(50),
    owner: commonSchemas.objectId.required(),
    ownershipType: Joi.string().valid('Individual', 'Company', 'Partnership', 'Trust').default('Individual'),
    condition: Joi.string().valid('Excellent', 'Good', 'Fair', 'Poor', 'Damaged').required(),
    purchasePrice: Joi.number().min(0).required(),
    sellingPrice: Joi.number().min(0),
    marketValue: Joi.number().min(0),
    purchaseDate: commonSchemas.date.required(),
    saleDate: commonSchemas.date,
    registrationDate: commonSchemas.date,
    insuranceExpiryDate: commonSchemas.date,
    pucExpiryDate: commonSchemas.date,
    location: Joi.object({
      warehouse: Joi.string().trim().required(),
      section: Joi.string().trim().allow(''),
      row: Joi.string().trim().allow(''),
      position: Joi.string().trim().allow(''),
    }).required(),
    features: Joi.array().items(Joi.string().trim()),
    notes: Joi.string().trim().max(1000).allow(''),
    tags: Joi.array().items(Joi.string().trim().lowercase()),
  }),

  update: Joi.object({
    registrationNumber: Joi.string().trim().uppercase().allow(''),
    variant: Joi.string().trim().max(50).allow(''),
    color: Joi.string().trim().min(1).max(30),
    engineCapacity: Joi.number().min(0),
    mileage: Joi.number().min(0),
    seatingCapacity: Joi.number().integer().min(1).max(50),
    condition: Joi.string().valid('Excellent', 'Good', 'Fair', 'Poor', 'Damaged'),
    sellingPrice: Joi.number().min(0),
    marketValue: Joi.number().min(0),
    saleDate: commonSchemas.date,
    registrationDate: commonSchemas.date,
    insuranceExpiryDate: commonSchemas.date,
    pucExpiryDate: commonSchemas.date,
    location: Joi.object({
      warehouse: Joi.string().trim(),
      section: Joi.string().trim().allow(''),
      row: Joi.string().trim().allow(''),
      position: Joi.string().trim().allow(''),
    }),
    features: Joi.array().items(Joi.string().trim()),
    notes: Joi.string().trim().max(1000).allow(''),
    tags: Joi.array().items(Joi.string().trim().lowercase()),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('Available', 'Sold', 'Reserved', 'Under Maintenance', 'Damaged', 'Scrapped').required(),
  }),

  search: Joi.object({
    q: Joi.string().trim().min(1),
    brand: Joi.string().trim(),
    model: Joi.string().trim(),
    status: Joi.string().valid('Available', 'Sold', 'Reserved', 'Under Maintenance', 'Damaged', 'Scrapped'),
    condition: Joi.string().valid('Excellent', 'Good', 'Fair', 'Poor', 'Damaged'),
    fuelType: Joi.string().valid('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'),
    yearFrom: Joi.number().integer().min(1900),
    yearTo: Joi.number().integer().max(new Date().getFullYear() + 1),
    priceFrom: Joi.number().min(0),
    priceTo: Joi.number().min(0),
    ...commonSchemas.pagination,
  }),
};

// Client validation schemas
const clientSchemas = {
  create: Joi.object({
    type: Joi.string().valid('Individual', 'Company').default('Individual'),
    firstName: Joi.when('type', {
      is: 'Individual',
      then: Joi.string().trim().min(2).max(50).required(),
      otherwise: Joi.forbidden(),
    }),
    lastName: Joi.when('type', {
      is: 'Individual',
      then: Joi.string().trim().min(2).max(50).required(),
      otherwise: Joi.forbidden(),
    }),
    companyName: Joi.when('type', {
      is: 'Company',
      then: Joi.string().trim().min(2).max(100).required(),
      otherwise: Joi.forbidden(),
    }),
    contactPerson: Joi.when('type', {
      is: 'Company',
      then: Joi.string().trim().min(2).max(100).required(),
      otherwise: Joi.forbidden(),
    }),
    email: commonSchemas.email,
    phone: commonSchemas.phone.required(),
    alternatePhone: commonSchemas.phone,
    address: Joi.object({
      street: Joi.string().trim().max(200).required(),
      city: Joi.string().trim().max(50).required(),
      state: Joi.string().trim().max(50).required(),
      zipCode: Joi.string().trim().pattern(/^\d{5,6}$/).required(),
      country: Joi.string().trim().default('India'),
    }).required(),
    creditLimit: Joi.number().min(0).default(0),
    businessDetails: Joi.when('type', {
      is: 'Company',
      then: Joi.object({
        gstNumber: Joi.string().trim().uppercase().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
        panNumber: Joi.string().trim().uppercase().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
        businessType: Joi.string().valid('Sole Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'),
        establishedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()),
      }),
      otherwise: Joi.forbidden(),
    }),
    notes: Joi.string().trim().max(1000).allow(''),
    tags: Joi.array().items(Joi.string().trim().lowercase()),
  }),

  update: Joi.object({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(2).max(50),
    companyName: Joi.string().trim().min(2).max(100),
    contactPerson: Joi.string().trim().min(2).max(100),
    email: commonSchemas.email,
    alternatePhone: commonSchemas.phone,
    address: Joi.object({
      street: Joi.string().trim().max(200),
      city: Joi.string().trim().max(50),
      state: Joi.string().trim().max(50),
      zipCode: Joi.string().trim().pattern(/^\d{5,6}$/),
      country: Joi.string().trim(),
    }),
    creditLimit: Joi.number().min(0),
    businessDetails: Joi.object({
      gstNumber: Joi.string().trim().uppercase().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
      panNumber: Joi.string().trim().uppercase().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
      businessType: Joi.string().valid('Sole Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Other'),
      establishedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()),
    }),
    preferences: Joi.object({
      preferredPaymentMethod: Joi.string().valid('Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card'),
      communicationPreference: Joi.string().valid('Phone', 'Email', 'SMS', 'WhatsApp'),
      language: Joi.string(),
    }),
    notes: Joi.string().trim().max(1000).allow(''),
    tags: Joi.array().items(Joi.string().trim().lowercase()),
  }),

  search: Joi.object({
    q: Joi.string().trim().min(1),
    type: Joi.string().valid('Individual', 'Company'),
    status: Joi.string().valid('Active', 'Inactive', 'Blocked', 'Pending Verification'),
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
