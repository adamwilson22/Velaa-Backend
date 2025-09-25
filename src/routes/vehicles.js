const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate, requireManager } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { apiLimiter, uploadLimiter, searchLimiter } = require('../middleware/rateLimiter');
const { uploadVehicleImages, uploadVehicleDocuments, handleUploadError } = require('../middleware/upload');
const { vehicleSchemas, paramSchemas, querySchemas } = require('../middleware/validation');

// Import controllers
const vehicleController = require('../controllers/vehicleController');

// All routes require authentication
router.use(authenticate);

// Vehicle CRUD routes
router.get('/',
  apiLimiter,
  validateQuery(querySchemas.pagination),
  vehicleController.getAllVehicles
);

router.post('/',
  apiLimiter,
  validate(vehicleSchemas.create),
  vehicleController.createVehicle
);

router.get('/search',
  searchLimiter,
  validateQuery(vehicleSchemas.search),
  vehicleController.searchVehicles
);

router.get('/stats',
  apiLimiter,
  vehicleController.getVehicleStats
);

router.get('/:id',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.getVehicleById
);

router.put('/:id',
  apiLimiter,
  validateParams(paramSchemas.id),
  validate(vehicleSchemas.update),
  vehicleController.updateVehicle
);

router.delete('/:id',
  requireManager,
  validateParams(paramSchemas.id),
  vehicleController.deleteVehicle
);

router.put('/:id/status',
  apiLimiter,
  validateParams(paramSchemas.id),
  validate(vehicleSchemas.updateStatus),
  vehicleController.updateVehicleStatus
);

// File upload routes
router.post('/:id/images',
  uploadLimiter,
  validateParams(paramSchemas.id),
  uploadVehicleImages,
  handleUploadError,
  vehicleController.uploadVehicleImages
);

router.post('/:id/documents',
  uploadLimiter,
  validateParams(paramSchemas.id),
  uploadVehicleDocuments,
  handleUploadError,
  vehicleController.uploadVehicleDocuments
);

router.delete('/:id/images/:imageId',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.deleteVehicleImage
);

router.delete('/:id/documents/:documentId',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.deleteVehicleDocument
);

// Maintenance routes
router.get('/:id/maintenance',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.getMaintenanceHistory
);

router.post('/:id/maintenance',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.addMaintenanceRecord
);

// Defect routes
router.get('/:id/defects',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.getVehicleDefects
);

router.post('/:id/defects',
  apiLimiter,
  validateParams(paramSchemas.id),
  vehicleController.addVehicleDefect
);

module.exports = router;
