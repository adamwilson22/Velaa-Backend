const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Date and time utilities
const dateHelpers = {
  // Format date to Indian format
  formatDateIndian: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },

  // Format date and time
  formatDateTime: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  },

  // Get date range for queries
  getDateRange: (period) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          start: startOfDay,
          end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case 'yesterday':
        const yesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case 'this_week':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return {
          start: startOfWeek,
          end: now,
        };
      case 'this_month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return {
          start: lastMonth,
          end: endOfLastMonth,
        };
      case 'this_year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: now,
        };
      default:
        return { start: null, end: null };
    }
  },

  // Calculate age from date
  calculateAge: (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  // Add days to date
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Check if date is expired
  isExpired: (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  },

  // Get days until expiry
  getDaysUntilExpiry: (date) => {
    if (!date) return null;
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
};

// String utilities
const stringHelpers = {
  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Convert to title case
  toTitleCase: (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Generate slug from string
  generateSlug: (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  },

  // Truncate string
  truncate: (str, length = 100, suffix = '...') => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  // Remove special characters
  sanitize: (str) => {
    if (!str) return '';
    return str.replace(/[^\w\s-]/gi, '');
  },

  // Generate random string
  generateRandomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Mask sensitive data
  maskString: (str, visibleChars = 4, maskChar = '*') => {
    if (!str || str.length <= visibleChars) return str;
    const visible = str.slice(-visibleChars);
    const masked = maskChar.repeat(str.length - visibleChars);
    return masked + visible;
  },
};

// Number utilities
const numberHelpers = {
  // Format currency (Indian Rupees)
  formatCurrency: (amount, currency = '₹') => {
    if (amount === null || amount === undefined) return `${currency}0`;
    return `${currency}${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },

  // Format number with Indian numbering system
  formatNumber: (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-IN');
  },

  // Calculate percentage
  calculatePercentage: (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  // Generate random number in range
  randomInRange: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Round to decimal places
  roundToDecimal: (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  // Convert bytes to human readable format
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },
};

// Array utilities
const arrayHelpers = {
  // Remove duplicates from array
  removeDuplicates: (arr, key = null) => {
    if (!Array.isArray(arr)) return [];
    
    if (key) {
      const seen = new Set();
      return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(arr)];
  },

  // Group array by key
  groupBy: (arr, key) => {
    if (!Array.isArray(arr)) return {};
    
    return arr.reduce((groups, item) => {
      const value = item[key];
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
      return groups;
    }, {});
  },

  // Sort array by multiple keys
  sortByKeys: (arr, keys) => {
    if (!Array.isArray(arr) || !Array.isArray(keys)) return arr;
    
    return arr.sort((a, b) => {
      for (const key of keys) {
        const { field, direction = 'asc' } = typeof key === 'string' ? { field: key } : key;
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  },

  // Paginate array
  paginate: (arr, page = 1, limit = 10) => {
    if (!Array.isArray(arr)) return { data: [], pagination: {} };
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = arr.slice(startIndex, endIndex);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total: arr.length,
        pages: Math.ceil(arr.length / limit),
        hasNext: endIndex < arr.length,
        hasPrev: startIndex > 0,
      },
    };
  },

  // Chunk array into smaller arrays
  chunk: (arr, size) => {
    if (!Array.isArray(arr) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },
};

// Object utilities
const objectHelpers = {
  // Deep clone object
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => objectHelpers.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = objectHelpers.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  // Pick specific keys from object
  pick: (obj, keys) => {
    if (!obj || typeof obj !== 'object') return {};
    
    const result = {};
    keys.forEach(key => {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  // Omit specific keys from object
  omit: (obj, keys) => {
    if (!obj || typeof obj !== 'object') return {};
    
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  // Check if object is empty
  isEmpty: (obj) => {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  },

  // Flatten nested object
  flatten: (obj, prefix = '') => {
    const flattened = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          Object.assign(flattened, objectHelpers.flatten(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  },
};

// Validation utilities
const validationHelpers = {
  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number (International format)
  isValidPhone: (phone) => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[\s-()]/g, '');
    
    // International format: +1234567890 (10-15 digits with optional + prefix)
    const phoneRegex = /^[+]?\d{10,15}$/;
    return phoneRegex.test(cleanPhone);
  },

  // Validate Tanzania phone number specifically
  isValidTanzaniaPhone: (phone) => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[\s-()]/g, '');
    
    // Tanzania country code is +255
    // Mobile numbers: +255 6XX XXX XXX, +255 7XX XXX XXX, +255 8XX XXX XXX
    // Landline numbers: +255 22 XXX XXXX (Dar es Salaam), +255 27 XXX XXXX (Mwanza), etc.
    
    // Pattern 1: +255 followed by 9 digits (mobile)
    // Pattern 2: 255 followed by 9 digits (mobile without +)
    // Pattern 3: 0 followed by 9 digits (local format)
    // Pattern 4: 9 digits starting with 6, 7, or 8 (mobile without country code)
    
    const patterns = [
      /^\+255[678]\d{8}$/,           // +255 6/7/8XX XXX XXX (international mobile)
      /^255[678]\d{8}$/,             // 255 6/7/8XX XXX XXX (without + prefix)
      /^0[678]\d{8}$/,               // 0 6/7/8XX XXX XXX (local mobile format)
      /^[678]\d{8}$/,                // 6/7/8XX XXX XXX (mobile without country code)
      /^\+25522\d{7}$/,              // +255 22 XXX XXXX (Dar es Salaam landline)
      /^25522\d{7}$/,                // 255 22 XXX XXXX (landline without +)
      /^022\d{7}$/,                  // 022 XXX XXXX (local landline format)
    ];
    
    return patterns.some(pattern => pattern.test(cleanPhone));
  },

  // Normalize Tanzania phone number to international format
  normalizeTanzaniaPhone: (phone) => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[\s-()]/g, '');
    
    // Convert to international format (+255XXXXXXXXX)
    if (cleanPhone.startsWith('+255')) {
      return cleanPhone; // Already in international format
    } else if (cleanPhone.startsWith('255')) {
      return '+' + cleanPhone; // Add + prefix
    } else if (cleanPhone.startsWith('0')) {
      return '+255' + cleanPhone.substring(1); // Replace 0 with +255
    } else if (/^[678]\d{8}$/.test(cleanPhone)) {
      return '+255' + cleanPhone; // Mobile number without country code
    } else if (cleanPhone.startsWith('22') && cleanPhone.length === 9) {
      return '+255' + cleanPhone; // Landline without country code
    }
    
    return phone; // Return original if no pattern matches
  },

  // Validate PAN number
  isValidPAN: (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  },

  // Validate GST number
  isValidGST: (gst) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  },

  // Validate Aadhaar number
  isValidAadhaar: (aadhaar) => {
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
  },

  // Validate vehicle registration number
  isValidRegistrationNumber: (regNo) => {
    const regNoRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
    return regNoRegex.test(regNo.replace(/\s/g, ''));
  },

  // Validate chassis number (VIN)
  isValidChassisNumber: (chassis) => {
    const chassisRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return chassisRegex.test(chassis);
  },

  // Validate password strength
  validatePasswordStrength: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;
    
    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';
    
    return {
      isValid: score >= 3,
      strength,
      score,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
      },
    };
  },
};

// Crypto utilities
const cryptoHelpers = {
  // Generate hash
  generateHash: (data, algorithm = 'sha256') => {
    return crypto.createHash(algorithm).update(data).digest('hex');
  },

  // Generate random token
  generateToken: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },

  // Encrypt data
  encrypt: (text, key) => {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  },

  // Decrypt data
  decrypt: (encryptedData, key) => {
    const algorithm = 'aes-256-cbc';
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  // Hash password
  hashPassword: async (password, saltRounds = 12) => {
    return await bcrypt.hash(password, saltRounds);
  },

  // Compare password
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },
};

// Response utilities
const responseHelpers = {
  // Success response
  success: (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  // Error response
  error: (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  },

  // Paginated response
  paginated: (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  },
};

// Export all helpers
module.exports = {
  dateHelpers,
  stringHelpers,
  numberHelpers,
  arrayHelpers,
  objectHelpers,
  validationHelpers,
  cryptoHelpers,
  responseHelpers,
};
