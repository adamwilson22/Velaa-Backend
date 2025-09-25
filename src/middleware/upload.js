const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage for different file types
const createStorage = (uploadPath, filePrefix = '') => {
  ensureDirectoryExists(uploadPath);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      
      // Sanitize filename
      const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${filePrefix}${sanitizedBaseName}_${uniqueSuffix}${extension}`;
      
      cb(null, filename);
    },
  });
};

// File filter functions
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'), false);
  }
};

const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|rtf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/(plain|rtf)/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files (PDF, DOC, DOCX, TXT, RTF) are allowed!'), false);
  }
};

const generalFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|rtf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed!'), false);
  }
};

// Upload configurations
const uploadConfigs = {
  // Vehicle images upload
  vehicleImages: multer({
    storage: createStorage(path.join(__dirname, '../../uploads/vehicles/images'), 'vehicle_img_'),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 10, // Maximum 10 files
    },
    fileFilter: imageFilter,
  }),

  // Vehicle documents upload
  vehicleDocuments: multer({
    storage: createStorage(path.join(__dirname, '../../uploads/vehicles/documents'), 'vehicle_doc_'),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5, // Maximum 5 files
    },
    fileFilter: documentFilter,
  }),

  // Client documents upload
  clientDocuments: multer({
    storage: createStorage(path.join(__dirname, '../../uploads/clients/documents'), 'client_doc_'),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5, // Maximum 5 files
    },
    fileFilter: documentFilter,
  }),

  // Profile images upload
  profileImages: multer({
    storage: createStorage(path.join(__dirname, '../../uploads/profiles'), 'profile_'),
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit
      files: 1, // Single file only
    },
    fileFilter: imageFilter,
  }),

  // General file upload
  general: multer({
    storage: createStorage(path.join(__dirname, '../../uploads/general'), 'file_'),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 5, // Maximum 5 files
    },
    fileFilter: generalFilter,
  }),
};

// Middleware functions
const uploadVehicleImages = uploadConfigs.vehicleImages.array('images', 10);
const uploadVehicleDocuments = uploadConfigs.vehicleDocuments.array('documents', 5);
const uploadClientDocuments = uploadConfigs.clientDocuments.array('documents', 5);
const uploadProfileImage = uploadConfigs.profileImages.single('profileImage');
const uploadGeneral = uploadConfigs.general.array('files', 5);

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Please upload a smaller file.',
          error: 'FILE_TOO_LARGE',
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Please reduce the number of files.',
          error: 'TOO_MANY_FILES',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE',
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.',
          error: error.code,
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'UPLOAD_ERROR',
    });
  }
  next();
};

// Helper function to delete uploaded files
const deleteUploadedFiles = (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error('Error deleting file:', file.path, err);
        }
      });
    }
  });
};

// Helper function to get file URL
const getFileUrl = (req, filename, category = 'general') => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${category}/${filename}`;
};

// Middleware to process uploaded files and add URLs
const processUploadedFiles = (category = 'general') => {
  return (req, res, next) => {
    if (req.files && req.files.length > 0) {
      req.uploadedFiles = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        url: getFileUrl(req, file.filename, category),
      }));
    } else if (req.file) {
      req.uploadedFile = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: getFileUrl(req, req.file.filename, category),
      };
    }
    next();
  };
};

// Middleware to validate file requirements
const requireFiles = (minFiles = 1, maxFiles = 10) => {
  return (req, res, next) => {
    const fileCount = req.files ? req.files.length : (req.file ? 1 : 0);
    
    if (fileCount < minFiles) {
      // Clean up any uploaded files
      deleteUploadedFiles(req.files || req.file);
      
      return res.status(400).json({
        success: false,
        message: `At least ${minFiles} file(s) required.`,
        error: 'INSUFFICIENT_FILES',
      });
    }
    
    if (fileCount > maxFiles) {
      // Clean up any uploaded files
      deleteUploadedFiles(req.files || req.file);
      
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} file(s) allowed.`,
        error: 'TOO_MANY_FILES',
      });
    }
    
    next();
  };
};

// Cleanup middleware for failed requests
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If response is an error (status >= 400), cleanup uploaded files
    if (res.statusCode >= 400) {
      deleteUploadedFiles(req.files || req.file);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  uploadVehicleImages,
  uploadVehicleDocuments,
  uploadClientDocuments,
  uploadProfileImage,
  uploadGeneral,
  handleUploadError,
  deleteUploadedFiles,
  getFileUrl,
  processUploadedFiles,
  requireFiles,
  cleanupOnError,
  uploadConfigs,
};
