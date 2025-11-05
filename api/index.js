// Vercel Serverless Function Entry Point
require('dotenv').config();
require('express-async-errors');

// Export the Express app as a serverless function
// Database connection will be established lazily on first request that needs it
module.exports = require('../src/app');

