require('dotenv').config();
require('express-async-errors');

const app = require('./src/app');
const connectDB = require('./src/config/database');
const { APP_CONSTANTS } = require('./src/utils/constants');

// Set port
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════════════════════════╗
  ║                                                                              ║
  ║  🚗 ${APP_CONSTANTS.NAME.padEnd(64)} ║
  ║                                                                              ║
  ║  📍 Server running on port: ${PORT.toString().padEnd(49)} ║
  ║  🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(57)} ║
  ║  📅 Started at: ${new Date().toLocaleString().padEnd(58)} ║
  ║  🔗 API Base URL: http://localhost:${PORT}/api${' '.repeat(37)} ║
  ║                                                                              ║
  ║  📚 API Documentation: http://localhost:${PORT}/api/docs${' '.repeat(32)} ║
  ║  ⚡ Health Check: http://localhost:${PORT}/api/health${' '.repeat(34)} ║
  ║                                                                              ║
  ╚══════════════════════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  
  // Close server & exit process
  server.close(() => {
    console.log('Server closed due to unhandled promise rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  
  // Close server & exit process
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      // Close database connection
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('Database connection closed');
      
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force close server after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export server for testing
module.exports = server;
