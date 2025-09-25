const { validationHelpers } = require('./helpers');

// Custom validation functions for business logic
class Validators {
  // Vehicle validations
  static validateVehicleData(vehicleData) {
    const errors = [];

    // Chassis number validation
    if (!validationHelpers.isValidChassisNumber(vehicleData.chassisNumber)) {
      errors.push({
        field: 'chassisNumber',
        message: 'Invalid chassis number format. Must be 17 characters (A-Z, 0-9, excluding I, O, Q)',
      });
    }

    // Registration number validation (if provided)
    if (vehicleData.registrationNumber && 
        !validationHelpers.isValidRegistrationNumber(vehicleData.registrationNumber)) {
      errors.push({
        field: 'registrationNumber',
        message: 'Invalid registration number format',
      });
    }

    // Year validation
    const currentYear = new Date().getFullYear();
    if (vehicleData.year < 1900 || vehicleData.year > currentYear + 1) {
      errors.push({
        field: 'year',
        message: `Year must be between 1900 and ${currentYear + 1}`,
      });
    }

    // Price validations
    if (vehicleData.purchasePrice < 0) {
      errors.push({
        field: 'purchasePrice',
        message: 'Purchase price cannot be negative',
      });
    }

    if (vehicleData.sellingPrice && vehicleData.sellingPrice < 0) {
      errors.push({
        field: 'sellingPrice',
        message: 'Selling price cannot be negative',
      });
    }

    // Date validations
    if (vehicleData.purchaseDate && new Date(vehicleData.purchaseDate) > new Date()) {
      errors.push({
        field: 'purchaseDate',
        message: 'Purchase date cannot be in the future',
      });
    }

    if (vehicleData.saleDate && vehicleData.purchaseDate && 
        new Date(vehicleData.saleDate) < new Date(vehicleData.purchaseDate)) {
      errors.push({
        field: 'saleDate',
        message: 'Sale date cannot be before purchase date',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Client validations
  static validateClientData(clientData) {
    const errors = [];

    // Email validation (if provided)
    if (clientData.email && !validationHelpers.isValidEmail(clientData.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
      });
    }

    // Phone validation
    if (!validationHelpers.isValidPhone(clientData.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    }

    // Alternate phone validation (if provided)
    if (clientData.alternatePhone && 
        !validationHelpers.isValidPhone(clientData.alternatePhone)) {
      errors.push({
        field: 'alternatePhone',
        message: 'Invalid alternate phone number format',
      });
    }

    // Business details validation for company type
    if (clientData.type === 'Company' && clientData.businessDetails) {
      const { gstNumber, panNumber } = clientData.businessDetails;

      if (gstNumber && !validationHelpers.isValidGST(gstNumber)) {
        errors.push({
          field: 'businessDetails.gstNumber',
          message: 'Invalid GST number format',
        });
      }

      if (panNumber && !validationHelpers.isValidPAN(panNumber)) {
        errors.push({
          field: 'businessDetails.panNumber',
          message: 'Invalid PAN number format',
        });
      }
    }

    // Credit limit validation
    if (clientData.creditLimit < 0) {
      errors.push({
        field: 'creditLimit',
        message: 'Credit limit cannot be negative',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // User validations
  static validateUserData(userData) {
    const errors = [];

    // Owner/Manager name validation
    if (!userData.ownerManagerName || userData.ownerManagerName.trim().length < 2) {
      errors.push({
        field: 'ownerManagerName',
        message: 'Owner/Manager name is required and must be at least 2 characters',
      });
    }

    // Warehouse name validation
    if (!userData.warehouseName || userData.warehouseName.trim().length < 2) {
      errors.push({
        field: 'warehouseName',
        message: 'Warehouse name is required and must be at least 2 characters',
      });
    }

    // Phone validation
    if (!validationHelpers.isValidPhone(userData.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    }

    // Email validation (optional)
    if (userData.email && !validationHelpers.isValidEmail(userData.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
      });
    }

    // Password validation (only if provided)
    if (userData.password) {
      const passwordValidation = validationHelpers.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        errors.push({
          field: 'password',
          message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
          details: passwordValidation.requirements,
        });
      }
    }

    // Warehouse capacity validation (optional)
    if (userData.warehouseCapacity && userData.warehouseCapacity < 1) {
      errors.push({
        field: 'warehouseCapacity',
        message: 'Warehouse capacity must be at least 1',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate registration step 1 data
  static validateRegistrationData(userData) {
    const errors = [];

    // Owner/Manager name validation
    if (!userData.ownerManagerName || userData.ownerManagerName.trim().length < 2) {
      errors.push({
        field: 'ownerManagerName',
        message: 'Owner/Manager name is required and must be at least 2 characters',
      });
    }

    // Warehouse name validation
    if (!userData.warehouseName || userData.warehouseName.trim().length < 2) {
      errors.push({
        field: 'warehouseName',
        message: 'Warehouse name is required and must be at least 2 characters',
      });
    }

    // Phone validation
    if (!validationHelpers.isValidPhone(userData.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate complete registration data (Step 3: Password creation only)
  static validateCompleteRegistrationData(userData) {
    const errors = [];

    // Phone validation
    if (!validationHelpers.isValidPhone(userData.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    }

    // Password validation (required for complete registration)
    if (!userData.password) {
      errors.push({
        field: 'password',
        message: 'Password is required',
      });
    } else {
      const passwordValidation = validationHelpers.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        errors.push({
          field: 'password',
          message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
          details: passwordValidation.requirements,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate OTP verification data (Step 2: OTP verification only)
  static validateOtpVerificationData(userData) {
    const errors = [];

    // Phone validation
    if (!validationHelpers.isValidPhone(userData.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    }

    // OTP validation (4 digits for dummy OTP)
    if (!userData.otp || !/^\d{4}$/.test(userData.otp)) {
      errors.push({
        field: 'otp',
        message: 'OTP must be a 4-digit number',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Billing validations
  static validateBillingData(billingData) {
    const errors = [];

    // Amount validations
    if (billingData.baseAmount < 0) {
      errors.push({
        field: 'baseAmount',
        message: 'Base amount cannot be negative',
      });
    }

    if (billingData.totalAmount < 0) {
      errors.push({
        field: 'totalAmount',
        message: 'Total amount cannot be negative',
      });
    }

    // Date validations
    if (billingData.dueDate && new Date(billingData.dueDate) < new Date(billingData.invoiceDate)) {
      errors.push({
        field: 'dueDate',
        message: 'Due date cannot be before invoice date',
      });
    }

    // Tax validations
    if (billingData.taxes && Array.isArray(billingData.taxes)) {
      billingData.taxes.forEach((tax, index) => {
        if (tax.rate < 0 || tax.rate > 100) {
          errors.push({
            field: `taxes[${index}].rate`,
            message: 'Tax rate must be between 0 and 100',
          });
        }

        if (tax.amount < 0) {
          errors.push({
            field: `taxes[${index}].amount`,
            message: 'Tax amount cannot be negative',
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Payment validations
  static validatePaymentData(paymentData) {
    const errors = [];

    // Amount validation
    if (paymentData.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Payment amount must be greater than 0',
      });
    }

    // Payment method validation
    const validPaymentMethods = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card', 'Other'];
    if (!validPaymentMethods.includes(paymentData.paymentMethod)) {
      errors.push({
        field: 'paymentMethod',
        message: 'Invalid payment method',
      });
    }

    // Reference number validation for non-cash payments
    if (paymentData.paymentMethod !== 'Cash' && !paymentData.referenceNumber) {
      errors.push({
        field: 'referenceNumber',
        message: 'Reference number is required for non-cash payments',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // File upload validations
  static validateFileUpload(file, options = {}) {
    const errors = [];
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = [],
      allowedExtensions = [],
    } = options;

    // File size validation
    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
      });
    }

    // File type validation
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push({
        field: 'file',
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    // File extension validation
    if (allowedExtensions.length > 0) {
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push({
          field: 'file',
          message: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Search query validations
  static validateSearchQuery(query) {
    const errors = [];

    // Page validation
    if (query.page && (isNaN(query.page) || query.page < 1)) {
      errors.push({
        field: 'page',
        message: 'Page must be a positive number',
      });
    }

    // Limit validation
    if (query.limit && (isNaN(query.limit) || query.limit < 1 || query.limit > 100)) {
      errors.push({
        field: 'limit',
        message: 'Limit must be between 1 and 100',
      });
    }

    // Date range validations
    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);

      if (isNaN(start.getTime())) {
        errors.push({
          field: 'startDate',
          message: 'Invalid start date format',
        });
      }

      if (isNaN(end.getTime())) {
        errors.push({
          field: 'endDate',
          message: 'Invalid end date format',
        });
      }

      if (start > end) {
        errors.push({
          field: 'dateRange',
          message: 'Start date cannot be after end date',
        });
      }
    }

    // Price range validations
    if (query.minPrice && (isNaN(query.minPrice) || query.minPrice < 0)) {
      errors.push({
        field: 'minPrice',
        message: 'Minimum price must be a non-negative number',
      });
    }

    if (query.maxPrice && (isNaN(query.maxPrice) || query.maxPrice < 0)) {
      errors.push({
        field: 'maxPrice',
        message: 'Maximum price must be a non-negative number',
      });
    }

    if (query.minPrice && query.maxPrice && parseFloat(query.minPrice) > parseFloat(query.maxPrice)) {
      errors.push({
        field: 'priceRange',
        message: 'Minimum price cannot be greater than maximum price',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // OTP validations
  static validateOTP(otp) {
    const errors = [];

    if (!otp) {
      errors.push({
        field: 'otp',
        message: 'OTP is required',
      });
    } else if (!/^\d{6}$/.test(otp)) {
      errors.push({
        field: 'otp',
        message: 'OTP must be exactly 6 digits',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Business rule validations
  static validateBusinessRules(data, rules) {
    const errors = [];

    // Vehicle business rules
    if (rules.vehicle) {
      // Check if vehicle is already sold
      if (data.status === 'Sold' && data.newStatus && data.newStatus !== 'Available') {
        errors.push({
          field: 'status',
          message: 'Sold vehicles can only be marked as Available',
        });
      }

      // Check selling price vs purchase price
      if (data.sellingPrice && data.purchasePrice && data.sellingPrice < data.purchasePrice * 0.5) {
        errors.push({
          field: 'sellingPrice',
          message: 'Selling price seems too low compared to purchase price',
          type: 'warning',
        });
      }
    }

    // Client business rules
    if (rules.client) {
      // Check credit limit vs outstanding balance
      if (data.creditLimit && data.outstandingBalance && data.outstandingBalance > data.creditLimit) {
        errors.push({
          field: 'creditLimit',
          message: 'Outstanding balance exceeds credit limit',
          type: 'warning',
        });
      }
    }

    // Billing business rules
    if (rules.billing) {
      // Check payment amount vs outstanding balance
      if (data.paymentAmount && data.outstandingBalance && 
          data.paymentAmount > data.outstandingBalance) {
        errors.push({
          field: 'paymentAmount',
          message: 'Payment amount cannot exceed outstanding balance',
        });
      }
    }

    return {
      isValid: errors.filter(e => e.type !== 'warning').length === 0,
      errors,
      warnings: errors.filter(e => e.type === 'warning'),
    };
  }

  // Batch validation for multiple records
  static validateBatch(records, validationFunction) {
    const results = [];

    records.forEach((record, index) => {
      const validation = validationFunction(record);
      results.push({
        index,
        record,
        ...validation,
      });
    });

    const validRecords = results.filter(r => r.isValid);
    const invalidRecords = results.filter(r => !r.isValid);

    return {
      isValid: invalidRecords.length === 0,
      validCount: validRecords.length,
      invalidCount: invalidRecords.length,
      results,
      validRecords: validRecords.map(r => r.record),
      invalidRecords,
    };
  }

  // Cross-field validations
  static validateCrossFields(data, rules) {
    const errors = [];

    rules.forEach(rule => {
      const { fields, validator, message } = rule;
      const fieldValues = fields.map(field => data[field]);

      if (!validator(...fieldValues)) {
        errors.push({
          fields,
          message,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Conditional validations
  static validateConditional(data, conditions) {
    const errors = [];

    conditions.forEach(condition => {
      const { when, field, value, validator, message } = condition;

      // Check if condition is met
      const conditionMet = typeof when === 'function' ? when(data) : data[when] === value;

      if (conditionMet) {
        const fieldValue = data[field];
        if (!validator(fieldValue)) {
          errors.push({
            field,
            message,
            condition: when,
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = Validators;
