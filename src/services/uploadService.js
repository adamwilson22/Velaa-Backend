const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class UploadService {
  constructor() {
    this.uploadBasePath = path.join(__dirname, '../../uploads');
    this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf'
    ];
  }

  // Ensure directory exists
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Get file info
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const extension = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath);
      
      return {
        filename,
        size: stats.size,
        extension,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isImage: this.allowedImageTypes.some(type => 
          type.includes(extension.replace('.', ''))
        ),
        isDocument: this.allowedDocumentTypes.some(type => 
          type.includes(extension.replace('.', ''))
        ),
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  // Process uploaded image
  async processImage(inputPath, options = {}) {
    try {
      const {
        resize = null,
        quality = 85,
        format = 'jpeg',
        createThumbnail = true,
        thumbnailSize = { width: 300, height: 300 },
        watermark = null,
      } = options;

      const fileInfo = await this.getFileInfo(inputPath);
      const outputDir = path.dirname(inputPath);
      const baseName = path.basename(inputPath, fileInfo.extension);
      
      let sharpInstance = sharp(inputPath);
      
      // Get image metadata
      const metadata = await sharpInstance.metadata();
      
      // Resize if requested
      if (resize) {
        sharpInstance = sharpInstance.resize(resize.width, resize.height, {
          fit: resize.fit || 'cover',
          position: resize.position || 'center',
        });
      }

      // Add watermark if provided
      if (watermark && watermark.path) {
        const watermarkBuffer = await fs.readFile(watermark.path);
        sharpInstance = sharpInstance.composite([{
          input: watermarkBuffer,
          gravity: watermark.position || 'southeast',
          blend: watermark.blend || 'over',
        }]);
      }

      // Set format and quality
      if (format === 'jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality });
      } else if (format === 'png') {
        sharpInstance = sharpInstance.png({ quality });
      } else if (format === 'webp') {
        sharpInstance = sharpInstance.webp({ quality });
      }

      // Save processed image
      const processedPath = path.join(outputDir, `${baseName}_processed.${format}`);
      await sharpInstance.toFile(processedPath);

      const result = {
        original: {
          path: inputPath,
          ...fileInfo,
          dimensions: { width: metadata.width, height: metadata.height },
        },
        processed: {
          path: processedPath,
          ...await this.getFileInfo(processedPath),
        },
      };

      // Create thumbnail if requested
      if (createThumbnail) {
        const thumbnailPath = path.join(outputDir, `${baseName}_thumb.${format}`);
        await sharp(inputPath)
          .resize(thumbnailSize.width, thumbnailSize.height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        result.thumbnail = {
          path: thumbnailPath,
          ...await this.getFileInfo(thumbnailPath),
        };
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // Process vehicle images
  async processVehicleImages(files, vehicleId) {
    try {
      const vehicleDir = path.join(this.uploadBasePath, 'vehicles', 'images', vehicleId);
      await this.ensureDirectoryExists(vehicleDir);

      const processedImages = [];

      for (const file of files) {
        // Move file to vehicle-specific directory
        const newPath = path.join(vehicleDir, file.filename);
        await fs.rename(file.path, newPath);

        // Process image
        const processed = await this.processImage(newPath, {
          resize: { width: 1200, height: 800, fit: 'inside' },
          quality: 85,
          format: 'jpeg',
          createThumbnail: true,
          thumbnailSize: { width: 400, height: 300 },
        });

        processedImages.push({
          originalName: file.originalname,
          filename: file.filename,
          vehicleId,
          ...processed,
        });
      }

      return processedImages;
    } catch (error) {
      throw new Error(`Failed to process vehicle images: ${error.message}`);
    }
  }

  // Process vehicle documents
  async processVehicleDocuments(files, vehicleId) {
    try {
      const vehicleDir = path.join(this.uploadBasePath, 'vehicles', 'documents', vehicleId);
      await this.ensureDirectoryExists(vehicleDir);

      const processedDocuments = [];

      for (const file of files) {
        // Move file to vehicle-specific directory
        const newPath = path.join(vehicleDir, file.filename);
        await fs.rename(file.path, newPath);

        const fileInfo = await this.getFileInfo(newPath);

        processedDocuments.push({
          originalName: file.originalname,
          filename: file.filename,
          vehicleId,
          path: newPath,
          ...fileInfo,
        });
      }

      return processedDocuments;
    } catch (error) {
      throw new Error(`Failed to process vehicle documents: ${error.message}`);
    }
  }

  // Process client documents
  async processClientDocuments(files, clientId) {
    try {
      const clientDir = path.join(this.uploadBasePath, 'clients', 'documents', clientId);
      await this.ensureDirectoryExists(clientDir);

      const processedDocuments = [];

      for (const file of files) {
        // Move file to client-specific directory
        const newPath = path.join(clientDir, file.filename);
        await fs.rename(file.path, newPath);

        const fileInfo = await this.getFileInfo(newPath);

        processedDocuments.push({
          originalName: file.originalname,
          filename: file.filename,
          clientId,
          path: newPath,
          ...fileInfo,
        });
      }

      return processedDocuments;
    } catch (error) {
      throw new Error(`Failed to process client documents: ${error.message}`);
    }
  }

  // Process profile image
  async processProfileImage(file, userId) {
    try {
      const profileDir = path.join(this.uploadBasePath, 'profiles', userId);
      await this.ensureDirectoryExists(profileDir);

      // Move file to user-specific directory
      const newPath = path.join(profileDir, file.filename);
      await fs.rename(file.path, newPath);

      // Process image
      const processed = await this.processImage(newPath, {
        resize: { width: 400, height: 400, fit: 'cover' },
        quality: 90,
        format: 'jpeg',
        createThumbnail: true,
        thumbnailSize: { width: 150, height: 150 },
      });

      return {
        originalName: file.originalname,
        filename: file.filename,
        userId,
        ...processed,
      };
    } catch (error) {
      throw new Error(`Failed to process profile image: ${error.message}`);
    }
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, message: 'File not found (already deleted)' };
      }
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Delete multiple files
  async deleteFiles(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.deleteFile(filePath);
        results.push({ filePath, ...result });
      } catch (error) {
        results.push({ 
          filePath, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Clean up vehicle files
  async cleanupVehicleFiles(vehicleId) {
    try {
      const vehicleImagesDir = path.join(this.uploadBasePath, 'vehicles', 'images', vehicleId);
      const vehicleDocsDir = path.join(this.uploadBasePath, 'vehicles', 'documents', vehicleId);

      const results = [];

      // Delete images directory
      try {
        await fs.rmdir(vehicleImagesDir, { recursive: true });
        results.push({ type: 'images', success: true });
      } catch (error) {
        results.push({ type: 'images', success: false, error: error.message });
      }

      // Delete documents directory
      try {
        await fs.rmdir(vehicleDocsDir, { recursive: true });
        results.push({ type: 'documents', success: true });
      } catch (error) {
        results.push({ type: 'documents', success: false, error: error.message });
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to cleanup vehicle files: ${error.message}`);
    }
  }

  // Clean up client files
  async cleanupClientFiles(clientId) {
    try {
      const clientDocsDir = path.join(this.uploadBasePath, 'clients', 'documents', clientId);

      await fs.rmdir(clientDocsDir, { recursive: true });
      
      return { success: true, message: 'Client files cleaned up successfully' };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, message: 'No files to cleanup' };
      }
      throw new Error(`Failed to cleanup client files: ${error.message}`);
    }
  }

  // Get file URL
  getFileUrl(req, filename, category, entityId = null) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    if (entityId) {
      return `${baseUrl}/uploads/${category}/${entityId}/${filename}`;
    } else {
      return `${baseUrl}/uploads/${category}/${filename}`;
    }
  }

  // Generate unique filename
  generateUniqueFilename(originalName, prefix = '') {
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueId = uuidv4().split('-')[0];
    
    return `${prefix}${sanitizedBaseName}_${uniqueId}${extension}`;
  }

  // Validate file type
  validateFileType(file, allowedTypes) {
    return allowedTypes.includes(file.mimetype);
  }

  // Validate file size
  validateFileSize(file, maxSize) {
    return file.size <= maxSize;
  }

  // Get storage usage statistics
  async getStorageStats() {
    try {
      const stats = {
        totalSize: 0,
        categories: {},
      };

      const categories = ['vehicles', 'clients', 'profiles', 'general'];

      for (const category of categories) {
        const categoryPath = path.join(this.uploadBasePath, category);
        const categoryStats = await this.getDirectoryStats(categoryPath);
        
        stats.categories[category] = categoryStats;
        stats.totalSize += categoryStats.totalSize;
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  // Get directory statistics
  async getDirectoryStats(dirPath) {
    try {
      const stats = {
        totalSize: 0,
        fileCount: 0,
        subdirectories: 0,
      };

      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);

          if (item.isDirectory()) {
            stats.subdirectories++;
            const subStats = await this.getDirectoryStats(itemPath);
            stats.totalSize += subStats.totalSize;
            stats.fileCount += subStats.fileCount;
          } else {
            const fileStats = await fs.stat(itemPath);
            stats.totalSize += fileStats.size;
            stats.fileCount++;
          }
        }
      } catch (error) {
        // Directory doesn't exist or is empty
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get directory stats: ${error.message}`);
    }
  }

  // Clean up old files (older than specified days)
  async cleanupOldFiles(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const results = {
        deletedFiles: 0,
        freedSpace: 0,
        errors: [],
      };

      await this.cleanupDirectoryOldFiles(this.uploadBasePath, cutoffDate, results);

      return results;
    } catch (error) {
      throw new Error(`Failed to cleanup old files: ${error.message}`);
    }
  }

  // Recursively clean up old files in directory
  async cleanupDirectoryOldFiles(dirPath, cutoffDate, results) {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          await this.cleanupDirectoryOldFiles(itemPath, cutoffDate, results);
        } else {
          try {
            const stats = await fs.stat(itemPath);
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(itemPath);
              results.deletedFiles++;
              results.freedSpace += stats.size;
            }
          } catch (error) {
            results.errors.push({
              file: itemPath,
              error: error.message,
            });
          }
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        results.errors.push({
          directory: dirPath,
          error: error.message,
        });
      }
    }
  }
}

// Create and export singleton instance
const uploadService = new UploadService();

module.exports = uploadService;
