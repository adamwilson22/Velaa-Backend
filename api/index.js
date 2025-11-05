// Vercel Serverless Function Entry Point
try {
  require('dotenv').config();
  require('express-async-errors');
  
  console.log('✅ Environment loaded');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Has MONGODB_URI:', !!process.env.MONGODB_URI);
  
  // Export the Express app as a serverless function
  // Database connection will be established lazily on first request that needs it
  const app = require('../src/app');
  console.log('✅ App loaded successfully');
  
  module.exports = app;
} catch (error) {
  console.error('❌ Fatal error during module initialization');
  console.error('Error message:', error.message);
  console.error('Error name:', error.name);
  console.error('Stack:', error.stack);
  
  // Return a minimal error handler app with CORS
  const express = require('express');
  const cors = require('cors');
  const errorApp = express();
  
  // Enable CORS on error handler too
  errorApp.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
  }));
  
  errorApp.all('*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: error.message,
      path: req.path,
      note: 'Check Vercel function logs for details'
    });
  });
  
  module.exports = errorApp;
}

