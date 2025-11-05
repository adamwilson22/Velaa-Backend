const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE,
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔒 Token verification failed:', error.name, '-', error.message);
    }
    
    // Provide more specific error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error('Invalid or expired token');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid or expired token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Invalid or expired token');
    } else {
      throw new Error('Invalid or expired token');
    }
  }
};

// Decode token without verification (for expired token info)
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  JWT_SECRET,
  JWT_EXPIRE,
  JWT_REFRESH_EXPIRE,
};
