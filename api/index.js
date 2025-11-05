// Vercel Serverless Function Entry Point
require('dotenv').config();
require('express-async-errors');

// Verify critical environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('NODE')));
}

const app = require('../src/app');
const connectDB = require('../src/config/database');

// Connect to database (non-blocking for serverless)
// Connection will be cached and reused across function invocations
connectDB().catch(err => {
  console.error('⚠️ Database connection failed:', err.message);
  console.error('This will be retried on the first database operation.');
});

// Export the Express app as a serverless function
module.exports = app;

