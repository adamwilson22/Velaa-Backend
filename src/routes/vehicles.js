const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate, requireManager } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { apiLimiter, uploadLimiter, searchLimiter } = require('../middleware/rateLimiter');
const { vehicleSchemas, paramSchemas, querySchemas } = require('../middleware/validation');
const { uploadVehicleImages, handleUploadError } = require('../middleware/upload');

// Import controllers
const vehicleController = require('../controllers/vehicleController');

// All routes require authentication
router.use(authenticate);

// Vehicle CRUD routes
router.get('/',
  apiLimiter,
  validateQuery(querySchemas.pagination),
  vehicleController.getAll
);

router.post('/',
  apiLimiter,
  validate(vehicleSchemas.create),
  vehicleController.create
);

router.get('/search',
  searchLimiter,
  validateQuery(querySchemas.pagination),
  vehicleController.search
);

router.get('/stats',
  apiLimiter,
  vehicleController.getStats
);

router.get('/:id',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.getById
);

router.put('/:id',
  apiLimiter,
  validateParams(paramSchemas.id),
  validate(vehicleSchemas.update),
  (req, res, next) => { if (process.env.NODE_ENV !== 'production') console.log('[ROUTE] PUT /vehicles/:id body (sanitized):', req.body); next(); },
  vehicleController.update
);

router.delete('/:id',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.remove
);

// Image upload route
router.post('/:id/images',
  uploadLimiter,
  validateParams(paramSchemas.id),
  uploadVehicleImages,
  handleUploadError,
  vehicleController.uploadImages
);

module.exports = router;
