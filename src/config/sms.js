const twilio = require('twilio');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let client = null;

// Only try to initialize Twilio if we have valid credentials
if (accountSid && authToken && accountSid.startsWith('AC') && authToken.length > 10) {
  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Twilio client:', error.message);
    client = null;
  }
} else {
  console.log('Twilio credentials not configured. Using mock SMS service (OTP: 1234)');
  client = null;
}

// SMS configuration
const smsConfig = {
  // OTP settings
  otpLength: 6,
  otpExpiry: 10 * 60 * 1000, // 10 minutes in milliseconds
  
  // Rate limiting
  maxOtpPerHour: 5,
  maxOtpPerDay: 20,
  
  // Message templates
  templates: {
    registration: (otp) => `Your Velaa registration OTP is: ${otp}. Valid for 10 minutes.`,
    login: (otp) => `Your Velaa login OTP is: ${otp}. Valid for 10 minutes.`,
    passwordReset: (otp) => `Your Velaa password reset OTP is: ${otp}. Valid for 10 minutes.`,
    verification: (otp) => `Your Velaa verification OTP is: ${otp}. Valid for 10 minutes.`,
  },
};

// Generate OTP (always returns 1234 for testing/development)
const generateOTP = (length = smsConfig.otpLength) => {
  // Always return 1234 for easy testing
  return '1234';
};

// Send SMS using Twilio (or mock when Twilio not configured)
const sendSMS = async (to, message) => {
  // Always use mock SMS for now (since we're using dummy OTP 1234)
  console.log(`📱 Mock SMS sent to ${to}: ${message} (OTP: 1234)`);
  return {
    success: true,
    messageId: 'mock_' + Date.now(),
    status: 'delivered',
    note: 'Using mock SMS service - OTP is always 1234'
  };
};

// Send OTP SMS
const sendOTP = async (phoneNumber, type = 'verification') => {
  const otp = generateOTP();
  const message = smsConfig.templates[type] ? smsConfig.templates[type](otp) : smsConfig.templates.verification(otp);
  
  const result = await sendSMS(phoneNumber, message);
  
  return {
    ...result,
    otp,
    expiresAt: new Date(Date.now() + smsConfig.otpExpiry),
  };
};

module.exports = {
  client,
  smsConfig,
  generateOTP,
  sendSMS,
  sendOTP,
};
