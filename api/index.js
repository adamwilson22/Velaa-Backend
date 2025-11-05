// Vercel Serverless Function Entry Point
require('dotenv').config();
require('express-async-errors');

const app = require('../src/app');

// Export the Express app as a serverless function
module.exports = app;

