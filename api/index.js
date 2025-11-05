// Vercel Serverless Function Entry Point
try {
  require('dotenv').config();
  require('express-async-errors');
  
  // Export the Express app as a serverless function
  // Database connection will be established lazily on first request that needs it
  module.exports = require('../src/app');
} catch (error) {
  console.error('Fatal error during module initialization:', error.message);
  console.error('Stack:', error.stack);
  
  // Return a minimal error handler app
  const express = require('express');
  const errorApp = express();
  
  errorApp.all('*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Check server logs',
      path: req.path
    });
  });
  
  module.exports = errorApp;
}

