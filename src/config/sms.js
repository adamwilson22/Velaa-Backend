const twilio = require('twilio');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let client = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
} else {
  console.warn('Twilio credentials not found. SMS functionality will be disabled.');
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

// Generate OTP (default 1234 for development)
const generateOTP = (length = smsConfig.otpLength) => {
  // For development, always return 1234
  if (process.env.NODE_ENV === 'development' || process.env.MOCK_SMS === 'true') {
    return '1234';
  }
  
  // For production, generate random OTP
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Send SMS using Twilio (or mock for development)
const sendSMS = async (to, message) => {
  // For development or when SMS is mocked
  if (process.env.NODE_ENV === 'development' || process.env.MOCK_SMS === 'true' || !client) {
    console.log(`📱 Mock SMS sent to ${to}: ${message}`);
    return {
      success: true,
      messageId: 'mock_' + Date.now(),
      status: 'delivered',
    };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
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
