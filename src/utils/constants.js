// Application constants
const APP_CONSTANTS = {
  NAME: 'Velaa Vehicle Management System',
  VERSION: '1.0.0',
  DESCRIPTION: 'Complete vehicle inventory management solution',
  AUTHOR: 'Velaa Team',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// User Roles and Permissions
const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
};

const PERMISSIONS = {
  // Vehicle permissions
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_READ: 'vehicle:read',
  VEHICLE_UPDATE: 'vehicle:update',
  VEHICLE_DELETE: 'vehicle:delete',
  VEHICLE_MANAGE_ALL: 'vehicle:manage_all',
  
  // Client permissions
  CLIENT_CREATE: 'client:create',
  CLIENT_READ: 'client:read',
  CLIENT_UPDATE: 'client:update',
  CLIENT_DELETE: 'client:delete',
  CLIENT_MANAGE_ALL: 'client:manage_all',
  
  // Billing permissions
  BILLING_CREATE: 'billing:create',
  BILLING_READ: 'billing:read',
  BILLING_UPDATE: 'billing:update',
  BILLING_DELETE: 'billing:delete',
  BILLING_MANAGE_ALL: 'billing:manage_all',
  
  // User management permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ALL: 'user:manage_all',
  
  // System permissions
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_REPORTS: 'system:reports',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_LOGS: 'system:logs',
};

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.VEHICLE_CREATE,
    PERMISSIONS.VEHICLE_READ,
    PERMISSIONS.VEHICLE_UPDATE,
    PERMISSIONS.VEHICLE_MANAGE_ALL,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.CLIENT_MANAGE_ALL,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.BILLING_MANAGE_ALL,
    PERMISSIONS.SYSTEM_REPORTS,
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.VEHICLE_CREATE,
    PERMISSIONS.VEHICLE_READ,
    PERMISSIONS.VEHICLE_UPDATE,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_READ,
    PERMISSIONS.CLIENT_UPDATE,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_UPDATE,
  ],
};

// Vehicle related constants
const VEHICLE_CONSTANTS = {
  STATUSES: {
    AVAILABLE: 'Available',
    SOLD: 'Sold',
    RESERVED: 'Reserved',
    UNDER_MAINTENANCE: 'Under Maintenance',
    DAMAGED: 'Damaged',
    SCRAPPED: 'Scrapped',
  },
  
  CONDITIONS: {
    EXCELLENT: 'Excellent',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
    DAMAGED: 'Damaged',
  },
  
  FUEL_TYPES: {
    PETROL: 'Petrol',
    DIESEL: 'Diesel',
    CNG: 'CNG',
    ELECTRIC: 'Electric',
    HYBRID: 'Hybrid',
    LPG: 'LPG',
  },
  
  TRANSMISSION_TYPES: {
    MANUAL: 'Manual',
    AUTOMATIC: 'Automatic',
    CVT: 'CVT',
    AMT: 'AMT',
  },
  
  OWNERSHIP_TYPES: {
    INDIVIDUAL: 'Individual',
    COMPANY: 'Company',
    PARTNERSHIP: 'Partnership',
    TRUST: 'Trust',
  },
  
  DOCUMENT_TYPES: {
    RC: 'RC',
    INSURANCE: 'Insurance',
    PUC: 'PUC',
    INVOICE: 'Invoice',
    NOC: 'NOC',
    OTHER: 'Other',
  },
  
  MAINTENANCE_TYPES: {
    SERVICE: 'Service',
    REPAIR: 'Repair',
    INSPECTION: 'Inspection',
    CLEANING: 'Cleaning',
  },
  
  DEFECT_SEVERITIES: {
    MINOR: 'Minor',
    MAJOR: 'Major',
    CRITICAL: 'Critical',
  },
};

// Client related constants
const CLIENT_CONSTANTS = {
  TYPES: {
    INDIVIDUAL: 'Individual',
    COMPANY: 'Company',
  },
  
  STATUSES: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    BLOCKED: 'Blocked',
    PENDING_VERIFICATION: 'Pending Verification',
  },
  
  BUSINESS_TYPES: {
    SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
    PARTNERSHIP: 'Partnership',
    PRIVATE_LIMITED: 'Private Limited',
    PUBLIC_LIMITED: 'Public Limited',
    LLP: 'LLP',
    OTHER: 'Other',
  },
  
  PAYMENT_METHODS: {
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    CHEQUE: 'Cheque',
    UPI: 'UPI',
    CREDIT_CARD: 'Credit Card',
    DEBIT_CARD: 'Debit Card',
  },
  
  COMMUNICATION_PREFERENCES: {
    PHONE: 'Phone',
    EMAIL: 'Email',
    SMS: 'SMS',
    WHATSAPP: 'WhatsApp',
  },
  
  DOCUMENT_TYPES: {
    AADHAAR: 'Aadhaar',
    PAN: 'PAN',
    DRIVING_LICENSE: 'Driving License',
    PASSPORT: 'Passport',
    VOTER_ID: 'Voter ID',
    GST_CERTIFICATE: 'GST Certificate',
    OTHER: 'Other',
  },
};

// Billing related constants
const BILLING_CONSTANTS = {
  TRANSACTION_TYPES: {
    SALE: 'Sale',
    PURCHASE: 'Purchase',
    SERVICE: 'Service',
    RENTAL: 'Rental',
    INSURANCE: 'Insurance',
    OTHER: 'Other',
  },
  
  STATUSES: {
    DRAFT: 'Draft',
    SENT: 'Sent',
    PAID: 'Paid',
    PARTIALLY_PAID: 'Partially Paid',
    OVERDUE: 'Overdue',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  },
  
  PAYMENT_STATUSES: {
    PENDING: 'Pending',
    PARTIAL: 'Partial',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
  },
  
  PAYMENT_METHODS: {
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    CHEQUE: 'Cheque',
    UPI: 'UPI',
    CREDIT_CARD: 'Credit Card',
    DEBIT_CARD: 'Debit Card',
    OTHER: 'Other',
  },
  
  PAYMENT_STATUSES_DETAIL: {
    PENDING: 'Pending',
    CLEARED: 'Cleared',
    BOUNCED: 'Bounced',
    CANCELLED: 'Cancelled',
  },
  
  DOCUMENT_TYPES: {
    INVOICE: 'Invoice',
    RECEIPT: 'Receipt',
    AGREEMENT: 'Agreement',
    OTHER: 'Other',
  },
  
  REMINDER_TYPES: {
    EMAIL: 'Email',
    SMS: 'SMS',
    PHONE: 'Phone',
    WHATSAPP: 'WhatsApp',
  },
  
  TAX_TYPES: {
    GST: 'GST',
    CGST: 'CGST',
    SGST: 'SGST',
    IGST: 'IGST',
    CESS: 'CESS',
    OTHER: 'Other',
  },
};

// Notification related constants
const NOTIFICATION_CONSTANTS = {
  TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    REMINDER: 'reminder',
    ALERT: 'alert',
  },
  
  CATEGORIES: {
    SYSTEM: 'system',
    VEHICLE: 'vehicle',
    CLIENT: 'client',
    BILLING: 'billing',
    PAYMENT: 'payment',
    MAINTENANCE: 'maintenance',
    SECURITY: 'security',
    USER: 'user',
    GENERAL: 'general',
  },
  
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },
  
  STATUSES: {
    UNREAD: 'unread',
    READ: 'read',
    ARCHIVED: 'archived',
  },
  
  DELIVERY_CHANNELS: {
    IN_APP: 'in-app',
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
  },
  
  ACTION_TYPES: {
    NONE: 'none',
    REDIRECT: 'redirect',
    MODAL: 'modal',
    EXTERNAL_LINK: 'external_link',
  },
};

// File upload constants
const FILE_CONSTANTS = {
  MAX_FILE_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    PROFILE: 2 * 1024 * 1024, // 2MB
  },
  
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf',
  ],
  
  ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_DOCUMENT_EXTENSIONS: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  
  UPLOAD_PATHS: {
    VEHICLES: 'vehicles',
    CLIENTS: 'clients',
    PROFILES: 'profiles',
    GENERAL: 'general',
  },
};

// API related constants
const API_CONSTANTS = {
  RATE_LIMITS: {
    GENERAL: 1000, // requests per 15 minutes
    AUTH: 10, // requests per 15 minutes
    OTP: 5, // requests per hour
    PASSWORD_RESET: 3, // requests per hour
    API: 500, // requests per 15 minutes
    UPLOAD: 50, // requests per 15 minutes
    SEARCH: 60, // requests per minute
    REPORTS: 10, // requests per 15 minutes
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  
  SORT_ORDERS: {
    ASC: 'asc',
    DESC: 'desc',
  },
  
  DEFAULT_SORT: '-createdAt',
};

// SMS and Email constants
const COMMUNICATION_CONSTANTS = {
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 3,
    MAX_PER_HOUR: 5,
    MAX_PER_DAY: 20,
  },
  
  SMS_TEMPLATES: {
    REGISTRATION: 'registration',
    LOGIN: 'login',
    PASSWORD_RESET: 'passwordReset',
    VERIFICATION: 'verification',
    PAYMENT_REMINDER: 'payment_reminder',
    DOCUMENT_EXPIRY: 'document_expiry',
    MAINTENANCE_DUE: 'maintenance_due',
  },
  
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    OTP: 'otp',
    PASSWORD_RESET: 'password-reset',
    INVOICE: 'invoice',
    NOTIFICATION: 'notification',
    REMINDER: 'reminder',
  },
};

// Database constants
const DATABASE_CONSTANTS = {
  COLLECTIONS: {
    USERS: 'users',
    VEHICLES: 'vehicles',
    CLIENTS: 'clients',
    BILLING: 'billings',
    NOTIFICATIONS: 'notifications',
    RATE_LIMITS: 'rate_limits',
  },
  
  INDEXES: {
    TEXT_SEARCH_FIELDS: {
      VEHICLES: ['chassisNumber', 'engineNumber', 'registrationNumber', 'brand', 'model', 'variant', 'color', 'notes'],
      CLIENTS: ['firstName', 'lastName', 'companyName', 'contactPerson', 'phone', 'email', 'notes'],
      USERS: ['firstName', 'lastName', 'email', 'phone', 'warehouseName'],
    },
  },
};

// Error messages
const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid credentials provided',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token provided',
  ACCESS_DENIED: 'Access denied',
  ACCOUNT_LOCKED: 'Account is temporarily locked',
  ACCOUNT_INACTIVE: 'Account is inactive',
  
  // Validation errors
  VALIDATION_FAILED: 'Validation failed',
  REQUIRED_FIELD_MISSING: 'Required field is missing',
  INVALID_FORMAT: 'Invalid format provided',
  INVALID_VALUE: 'Invalid value provided',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'Resource not found',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists',
  RESOURCE_IN_USE: 'Resource is currently in use',
  
  // File upload errors
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
  
  // Database errors
  DATABASE_ERROR: 'Database operation failed',
  DUPLICATE_ENTRY: 'Duplicate entry found',
  FOREIGN_KEY_CONSTRAINT: 'Foreign key constraint violation',
  
  // General errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
};

// Success messages
const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
  
  // CRUD operations
  CREATED_SUCCESS: 'Created successfully',
  UPDATED_SUCCESS: 'Updated successfully',
  DELETED_SUCCESS: 'Deleted successfully',
  RETRIEVED_SUCCESS: 'Retrieved successfully',
  
  // File operations
  UPLOAD_SUCCESS: 'File uploaded successfully',
  DELETE_FILE_SUCCESS: 'File deleted successfully',
  
  // Communication
  EMAIL_SENT: 'Email sent successfully',
  SMS_SENT: 'SMS sent successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
};

// Regular expressions
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_INDIAN: /^[+]?[6-9]\d{9}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  AADHAAR: /^\d{12}$/,
  CHASSIS_NUMBER: /^[A-HJ-NPR-Z0-9]{17}$/,
  REGISTRATION_NUMBER: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  OTP: /^\d{6}$/,
  ZIP_CODE: /^\d{5,6}$/,
};

module.exports = {
  APP_CONSTANTS,
  HTTP_STATUS,
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  VEHICLE_CONSTANTS,
  CLIENT_CONSTANTS,
  BILLING_CONSTANTS,
  NOTIFICATION_CONSTANTS,
  FILE_CONSTANTS,
  API_CONSTANTS,
  COMMUNICATION_CONSTANTS,
  DATABASE_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX_PATTERNS,
};
