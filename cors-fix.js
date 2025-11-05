// CORS Fix for Production Deployment
// Add this to your app.js or create a separate middleware file

const cors = require('cors');

// Production CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`CORS check for origin: ${origin}`);
    
    // Allow requests with no origin (mobile apps, Postman, file:// protocol, etc.)
    if (!origin || origin === 'null') {
      console.log('Allowing request with no origin or null origin');
      return callback(null, true);
    }
    
    // Production domains
    const allowedOrigins = [
      'https://velaa.the4loop.com',
      'https://www.velaa.the4loop.com',
      'http://velaa.the4loop.com',
      'http://www.velaa.the4loop.com'
    ];
    
    // Development origins
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8000',
      'http://localhost:8080',
      'http://127.0.0.1:5500',
      'http://localhost:5500'
    ];
    
    // Combine allowed origins
    const allAllowedOrigins = [...allowedOrigins, ...devOrigins];
    
    if (allAllowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      // For debugging, temporarily allow all origins
      console.log('Temporarily allowing origin for debugging:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

module.exports = corsOptions;

