const Vehicle = require('../models/Vehicle');
const Client = require('../models/Client');
const uploadService = require('../services/uploadService');
const { responseHelpers, dateHelpers, numberHelpers, arrayHelpers } = require('../utils/helpers');
const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES, VEHICLE_CONSTANTS } = require('../utils/constants');
const Validators = require('../utils/validators');

class VehicleController {
  constructor() {
    // Bind methods that rely on `this` so Express doesn't lose context
    this.searchVehicles = this.searchVehicles.bind(this);
    this.updateVehicleStatus = this.updateVehicleStatus.bind(this);
    this.parseSortString = this.parseSortString.bind(this);
    this.getValidStatusTransitions = this.getValidStatusTransitions.bind(this);
  }
  // Get all vehicles with pagination and filtering
  async getAllVehicles(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = '-createdAt',
        search,
        brand,
        model,
        status,
        condition,
        fuelType,
        transmission,
        yearFrom,
        yearTo,
        priceFrom,
        priceTo,
        owner,
        warehouse
      } = req.query;

      // Build query
      const query = {};

      // Text search across multiple fields
      if (search) {
        query.$or = [
          { chassisNumber: { $regex: search, $options: 'i' } },
          { engineNumber: { $regex: search, $options: 'i' } },
          { registrationNumber: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
          { variant: { $regex: search, $options: 'i' } },
          { color: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by specific fields
      if (brand) query.brand = { $regex: brand, $options: 'i' };
      if (model) query.model = { $regex: model, $options: 'i' };
      if (status) query.status = status;
      if (condition) query.condition = condition;
      if (fuelType) query.fuelType = fuelType;
      if (transmission) query.transmission = transmission;
      if (owner) query.owner = owner;
      if (warehouse) query['location.warehouse'] = { $regex: warehouse, $options: 'i' };

      // Year range filter
      if (yearFrom || yearTo) {
        query.year = {};
        if (yearFrom) query.year.$gte = parseInt(yearFrom);
        if (yearTo) query.year.$lte = parseInt(yearTo);
      }

      // Price range filter
      if (priceFrom || priceTo) {
        query.purchasePrice = {};
        if (priceFrom) query.purchasePrice.$gte = parseFloat(priceFrom);
        if (priceTo) query.purchasePrice.$lte = parseFloat(priceTo);
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const vehicles = await Vehicle.find(query)
        .populate('owner', 'firstName lastName companyName phone email type')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Vehicle.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      // Add computed fields
      const vehiclesWithComputedFields = vehicles.map(vehicle => ({
        ...vehicle.toObject(),
        age: vehicle.age,
        primaryImage: vehicle.primaryImage,
        daysInInventory: vehicle.daysInInventory,
        profitLoss: vehicle.profitLoss,
        formattedPurchasePrice: numberHelpers.formatCurrency(vehicle.purchasePrice),
        formattedSellingPrice: vehicle.sellingPrice ? numberHelpers.formatCurrency(vehicle.sellingPrice) : null,
        formattedPurchaseDate: dateHelpers.formatDateIndian(vehicle.purchaseDate),
        formattedSaleDate: vehicle.saleDate ? dateHelpers.formatDateIndian(vehicle.saleDate) : null
      }));

      return responseHelpers.paginated(res, vehiclesWithComputedFields, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }, 'Vehicles retrieved successfully');

    } catch (error) {
      console.error('Get all vehicles error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Create new vehicle
  async createVehicle(req, res) {
    try {
      const vehicleData = req.body;
      const userId = req.user._id;

      // Validate vehicle data
      const validation = Validators.validateVehicleData(vehicleData);
      if (!validation.isValid) {
        return responseHelpers.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      // Check if chassis number already exists
      const existingVehicle = await Vehicle.findOne({ chassisNumber: vehicleData.chassisNumber });
      if (existingVehicle) {
        return responseHelpers.error(res, 'Vehicle with this chassis number already exists', HTTP_STATUS.CONFLICT);
      }

      // Check if registration number already exists (if provided)
      if (vehicleData.registrationNumber) {
        const existingRegVehicle = await Vehicle.findOne({ registrationNumber: vehicleData.registrationNumber });
        if (existingRegVehicle) {
          return responseHelpers.error(res, 'Vehicle with this registration number already exists', HTTP_STATUS.CONFLICT);
        }
      }

      // Verify owner exists
      const owner = await Client.findById(vehicleData.owner);
      if (!owner) {
        return responseHelpers.error(res, 'Client (owner) not found', HTTP_STATUS.NOT_FOUND);
      }

      // Create vehicle
      const vehicle = new Vehicle({
        ...vehicleData,
        createdBy: userId
      });

      await vehicle.save();

      // Populate references
      await vehicle.populate('owner', 'firstName lastName companyName phone email type');
      await vehicle.populate('createdBy', 'firstName lastName');

      return responseHelpers.success(res, {
        vehicle: {
          ...vehicle.toObject(),
          age: vehicle.age,
          primaryImage: vehicle.primaryImage,
          daysInInventory: vehicle.daysInInventory,
          formattedPurchasePrice: numberHelpers.formatCurrency(vehicle.purchasePrice),
          formattedPurchaseDate: dateHelpers.formatDateIndian(vehicle.purchaseDate)
        }
      }, SUCCESS_MESSAGES.CREATED_SUCCESS, HTTP_STATUS.CREATED);

    } catch (error) {
      console.error('Create vehicle error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get vehicle by ID
  async getVehicleById(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findById(id)
        .populate('owner', 'firstName lastName companyName phone email type address businessDetails')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      return responseHelpers.success(res, {
        vehicle: {
          ...vehicle.toObject(),
          age: vehicle.age,
          primaryImage: vehicle.primaryImage,
          daysInInventory: vehicle.daysInInventory,
          profitLoss: vehicle.profitLoss,
          formattedPurchasePrice: numberHelpers.formatCurrency(vehicle.purchasePrice),
          formattedSellingPrice: vehicle.sellingPrice ? numberHelpers.formatCurrency(vehicle.sellingPrice) : null,
          formattedMarketValue: vehicle.marketValue ? numberHelpers.formatCurrency(vehicle.marketValue) : null,
          formattedPurchaseDate: dateHelpers.formatDateIndian(vehicle.purchaseDate),
          formattedSaleDate: vehicle.saleDate ? dateHelpers.formatDateIndian(vehicle.saleDate) : null,
          formattedRegistrationDate: vehicle.registrationDate ? dateHelpers.formatDateIndian(vehicle.registrationDate) : null,
          formattedInsuranceExpiryDate: vehicle.insuranceExpiryDate ? dateHelpers.formatDateIndian(vehicle.insuranceExpiryDate) : null,
          formattedPucExpiryDate: vehicle.pucExpiryDate ? dateHelpers.formatDateIndian(vehicle.pucExpiryDate) : null,
          insuranceExpired: vehicle.insuranceExpiryDate ? dateHelpers.isExpired(vehicle.insuranceExpiryDate) : null,
          pucExpired: vehicle.pucExpiryDate ? dateHelpers.isExpired(vehicle.pucExpiryDate) : null,
          insuranceDaysLeft: vehicle.insuranceExpiryDate ? dateHelpers.getDaysUntilExpiry(vehicle.insuranceExpiryDate) : null,
          pucDaysLeft: vehicle.pucExpiryDate ? dateHelpers.getDaysUntilExpiry(vehicle.pucExpiryDate) : null
        }
      }, 'Vehicle retrieved successfully');

    } catch (error) {
      console.error('Get vehicle by ID error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Update vehicle
  async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      // Find vehicle
      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Validate update data
      const validation = Validators.validateVehicleData(updateData);
      if (!validation.isValid) {
        return responseHelpers.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validation.errors);
      }

      // Check if chassis number is being changed and already exists
      if (updateData.chassisNumber && updateData.chassisNumber !== vehicle.chassisNumber) {
        const existingVehicle = await Vehicle.findOne({ 
          chassisNumber: updateData.chassisNumber,
          _id: { $ne: id }
        });
        if (existingVehicle) {
          return responseHelpers.error(res, 'Vehicle with this chassis number already exists', HTTP_STATUS.CONFLICT);
        }
      }

      // Check if registration number is being changed and already exists
      if (updateData.registrationNumber && updateData.registrationNumber !== vehicle.registrationNumber) {
        const existingRegVehicle = await Vehicle.findOne({ 
          registrationNumber: updateData.registrationNumber,
          _id: { $ne: id }
        });
        if (existingRegVehicle) {
          return responseHelpers.error(res, 'Vehicle with this registration number already exists', HTTP_STATUS.CONFLICT);
        }
      }

      // Verify owner exists if being changed
      if (updateData.owner && updateData.owner !== vehicle.owner.toString()) {
        const owner = await Client.findById(updateData.owner);
        if (!owner) {
          return responseHelpers.error(res, 'Client (owner) not found', HTTP_STATUS.NOT_FOUND);
        }
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.createdBy;
      delete updateData.createdAt;

      // Update vehicle
      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        id,
        { ...updateData, updatedBy: userId },
        { new: true, runValidators: true }
      )
        .populate('owner', 'firstName lastName companyName phone email type')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

      return responseHelpers.success(res, {
        vehicle: {
          ...updatedVehicle.toObject(),
          age: updatedVehicle.age,
          primaryImage: updatedVehicle.primaryImage,
          daysInInventory: updatedVehicle.daysInInventory,
          profitLoss: updatedVehicle.profitLoss,
          formattedPurchasePrice: numberHelpers.formatCurrency(updatedVehicle.purchasePrice),
          formattedSellingPrice: updatedVehicle.sellingPrice ? numberHelpers.formatCurrency(updatedVehicle.sellingPrice) : null,
          formattedPurchaseDate: dateHelpers.formatDateIndian(updatedVehicle.purchaseDate),
          formattedSaleDate: updatedVehicle.saleDate ? dateHelpers.formatDateIndian(updatedVehicle.saleDate) : null
        }
      }, SUCCESS_MESSAGES.UPDATED_SUCCESS);

    } catch (error) {
      console.error('Update vehicle error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete vehicle
  async deleteVehicle(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check if vehicle can be deleted (not sold, no pending billing, etc.)
      if (vehicle.status === 'Sold') {
        return responseHelpers.error(res, 'Cannot delete sold vehicles', HTTP_STATUS.BAD_REQUEST);
      }

      // TODO: Check for associated billing records
      // const billingRecords = await Billing.find({ vehicle: id });
      // if (billingRecords.length > 0) {
      //   return responseHelpers.error(res, 'Cannot delete vehicle with associated billing records', HTTP_STATUS.BAD_REQUEST);
      // }

      // Clean up uploaded files
      try {
        await uploadService.cleanupVehicleFiles(id);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
        // Continue with deletion even if file cleanup fails
      }

      // Delete vehicle
      await Vehicle.findByIdAndDelete(id);

      return responseHelpers.success(res, {
        message: 'Vehicle deleted successfully',
        vehicleId: id
      }, SUCCESS_MESSAGES.DELETED_SUCCESS);

    } catch (error) {
      console.error('Delete vehicle error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Search vehicles with advanced filtering
  async searchVehicles(req, res) {
    try {
      const {
        q, // General search query
        page = 1,
        limit = 10,
        sort = '-createdAt',
        brand,
        model,
        status,
        condition,
        fuelType,
        transmission,
        yearFrom,
        yearTo,
        priceFrom,
        priceTo,
        owner,
        warehouse,
        tags,
        features
      } = req.query;

      // Build search query
      const query = {};

      // General text search
      if (q) {
        query.$text = { $search: q };
      }

      // Specific filters
      if (brand) query.brand = { $regex: brand, $options: 'i' };
      if (model) query.model = { $regex: model, $options: 'i' };
      if (status) {
        query.status = Array.isArray(status) ? { $in: status } : status;
      }
      if (condition) {
        query.condition = Array.isArray(condition) ? { $in: condition } : condition;
      }
      if (fuelType) {
        query.fuelType = Array.isArray(fuelType) ? { $in: fuelType } : fuelType;
      }
      if (transmission) {
        query.transmission = Array.isArray(transmission) ? { $in: transmission } : transmission;
      }
      if (owner) query.owner = owner;
      if (warehouse) query['location.warehouse'] = { $regex: warehouse, $options: 'i' };

      // Range filters
      if (yearFrom || yearTo) {
        query.year = {};
        if (yearFrom) query.year.$gte = parseInt(yearFrom);
        if (yearTo) query.year.$lte = parseInt(yearTo);
      }

      if (priceFrom || priceTo) {
        query.purchasePrice = {};
        if (priceFrom) query.purchasePrice.$gte = parseFloat(priceFrom);
        if (priceTo) query.purchasePrice.$lte = parseFloat(priceTo);
      }

      // Array filters
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        query.tags = { $in: tagArray };
      }

      if (features) {
        const featureArray = Array.isArray(features) ? features : [features];
        query.features = { $in: featureArray };
      }

      // Execute search
      const skip = (page - 1) * limit;
      let vehicleQuery = Vehicle.find(query)
        .populate('owner', 'firstName lastName companyName phone email type')
        .populate('createdBy', 'firstName lastName')
        .skip(skip)
        .limit(parseInt(limit));

      // Apply sorting
      if (q && !sort.startsWith('score')) {
        // If text search, sort by relevance score first
        vehicleQuery = vehicleQuery.sort({ score: { $meta: 'textScore' }, ...this.parseSortString(sort) });
      } else {
        vehicleQuery = vehicleQuery.sort(this.parseSortString(sort));
      }

      const vehicles = await vehicleQuery;
      const total = await Vehicle.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      // Add computed fields and search score
      const vehiclesWithComputedFields = vehicles.map(vehicle => {
        const vehicleObj = vehicle.toObject();
        return {
          ...vehicleObj,
          age: vehicle.age,
          primaryImage: vehicle.primaryImage,
          daysInInventory: vehicle.daysInInventory,
          profitLoss: vehicle.profitLoss,
          formattedPurchasePrice: numberHelpers.formatCurrency(vehicle.purchasePrice),
          formattedSellingPrice: vehicle.sellingPrice ? numberHelpers.formatCurrency(vehicle.sellingPrice) : null,
          searchScore: q ? vehicleObj.score : undefined
        };
      });

      return responseHelpers.paginated(res, vehiclesWithComputedFields, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        searchQuery: q,
        filters: { brand, model, status, condition, fuelType, transmission, yearFrom, yearTo, priceFrom, priceTo }
      }, 'Vehicle search completed successfully');

    } catch (error) {
      console.error('Search vehicles error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Update vehicle status
  async updateVehicleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = req.user._id;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Validate status transition
      const validTransitions = this.getValidStatusTransitions(vehicle.status);
      if (!validTransitions.includes(status)) {
        return responseHelpers.error(res, `Cannot change status from ${vehicle.status} to ${status}`, HTTP_STATUS.BAD_REQUEST);
      }

      // Update status
      const oldStatus = vehicle.status;
      vehicle.status = status;
      vehicle.updatedBy = userId;

      // Add status change to notes if provided
      if (notes) {
        vehicle.notes = vehicle.notes ? `${vehicle.notes}\n\nStatus changed from ${oldStatus} to ${status}: ${notes}` : `Status changed from ${oldStatus} to ${status}: ${notes}`;
      }

      // Set sale date if status is changed to Sold
      if (status === 'Sold' && oldStatus !== 'Sold') {
        vehicle.saleDate = new Date();
      }

      await vehicle.save();

      await vehicle.populate('owner', 'firstName lastName companyName phone email type');

      return responseHelpers.success(res, {
        vehicle: {
          id: vehicle._id,
          chassisNumber: vehicle.chassisNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          status: vehicle.status,
          previousStatus: oldStatus,
          saleDate: vehicle.saleDate,
          formattedSaleDate: vehicle.saleDate ? dateHelpers.formatDateIndian(vehicle.saleDate) : null,
          owner: vehicle.owner,
          updatedAt: vehicle.updatedAt
        }
      }, 'Vehicle status updated successfully');

    } catch (error) {
      console.error('Update vehicle status error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Upload vehicle images
  async uploadVehicleImages(req, res) {
    try {
      const { id } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return responseHelpers.error(res, 'No images uploaded', HTTP_STATUS.BAD_REQUEST);
      }

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Process uploaded images
      const processedImages = await uploadService.processVehicleImages(files, id);

      // Add images to vehicle
      const newImages = processedImages.map((img, index) => ({
        url: img.processed.url || img.original.url,
        caption: req.body.captions ? req.body.captions[index] : '',
        isPrimary: vehicle.images.length === 0 && index === 0, // First image of first upload is primary
        uploadedAt: new Date()
      }));

      vehicle.images.push(...newImages);
      await vehicle.save();

      return responseHelpers.success(res, {
        message: `${newImages.length} images uploaded successfully`,
        images: newImages,
        totalImages: vehicle.images.length
      }, 'Images uploaded successfully');

    } catch (error) {
      console.error('Upload vehicle images error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Upload vehicle documents
  async uploadVehicleDocuments(req, res) {
    try {
      const { id } = req.params;
      const files = req.files;
      const { documentTypes, expiryDates } = req.body;

      if (!files || files.length === 0) {
        return responseHelpers.error(res, 'No documents uploaded', HTTP_STATUS.BAD_REQUEST);
      }

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Process uploaded documents
      const processedDocuments = await uploadService.processVehicleDocuments(files, id);

      // Add documents to vehicle
      const newDocuments = processedDocuments.map((doc, index) => ({
        type: documentTypes ? documentTypes[index] : 'Other',
        url: doc.url,
        expiryDate: expiryDates ? new Date(expiryDates[index]) : null,
        uploadedAt: new Date()
      }));

      vehicle.documents.push(...newDocuments);
      await vehicle.save();

      return responseHelpers.success(res, {
        message: `${newDocuments.length} documents uploaded successfully`,
        documents: newDocuments.map(doc => ({
          ...doc,
          formattedExpiryDate: doc.expiryDate ? dateHelpers.formatDateIndian(doc.expiryDate) : null,
          isExpired: doc.expiryDate ? dateHelpers.isExpired(doc.expiryDate) : false,
          daysUntilExpiry: doc.expiryDate ? dateHelpers.getDaysUntilExpiry(doc.expiryDate) : null
        })),
        totalDocuments: vehicle.documents.length
      }, 'Documents uploaded successfully');

    } catch (error) {
      console.error('Upload vehicle documents error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete vehicle image
  async deleteVehicleImage(req, res) {
    try {
      const { id, imageId } = req.params;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      const imageIndex = vehicle.images.findIndex(img => img._id.toString() === imageId);
      if (imageIndex === -1) {
        return responseHelpers.error(res, 'Image not found', HTTP_STATUS.NOT_FOUND);
      }

      const image = vehicle.images[imageIndex];

      // Delete file from storage
      try {
        await uploadService.deleteFile(image.url);
      } catch (deleteError) {
        console.error('File deletion error:', deleteError);
        // Continue with database deletion even if file deletion fails
      }

      // Remove image from vehicle
      vehicle.images.splice(imageIndex, 1);

      // If deleted image was primary and there are other images, make the first one primary
      if (image.isPrimary && vehicle.images.length > 0) {
        vehicle.images[0].isPrimary = true;
      }

      await vehicle.save();

      return responseHelpers.success(res, {
        message: 'Image deleted successfully',
        imageId,
        remainingImages: vehicle.images.length
      }, 'Image deleted successfully');

    } catch (error) {
      console.error('Delete vehicle image error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete vehicle document
  async deleteVehicleDocument(req, res) {
    try {
      const { id, documentId } = req.params;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      const documentIndex = vehicle.documents.findIndex(doc => doc._id.toString() === documentId);
      if (documentIndex === -1) {
        return responseHelpers.error(res, 'Document not found', HTTP_STATUS.NOT_FOUND);
      }

      const document = vehicle.documents[documentIndex];

      // Delete file from storage
      try {
        await uploadService.deleteFile(document.url);
      } catch (deleteError) {
        console.error('File deletion error:', deleteError);
        // Continue with database deletion even if file deletion fails
      }

      // Remove document from vehicle
      vehicle.documents.splice(documentIndex, 1);
      await vehicle.save();

      return responseHelpers.success(res, {
        message: 'Document deleted successfully',
        documentId,
        remainingDocuments: vehicle.documents.length
      }, 'Document deleted successfully');

    } catch (error) {
      console.error('Delete vehicle document error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get maintenance history
  async getMaintenanceHistory(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Paginate maintenance history
      const skip = (page - 1) * limit;
      const maintenanceHistory = vehicle.maintenanceHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(skip, skip + parseInt(limit));

      const total = vehicle.maintenanceHistory.length;
      const totalPages = Math.ceil(total / limit);

      // Format maintenance history
      const formattedHistory = maintenanceHistory.map(record => ({
        ...record.toObject(),
        formattedDate: dateHelpers.formatDateIndian(record.date),
        formattedCost: record.cost ? numberHelpers.formatCurrency(record.cost) : null,
        formattedNextServiceDue: record.nextServiceDue ? dateHelpers.formatDateIndian(record.nextServiceDue) : null,
        isServiceDue: record.nextServiceDue ? dateHelpers.isExpired(record.nextServiceDue) : false
      }));

      return responseHelpers.paginated(res, formattedHistory, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }, 'Maintenance history retrieved successfully');

    } catch (error) {
      console.error('Get maintenance history error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Add maintenance record
  async addMaintenanceRecord(req, res) {
    try {
      const { id } = req.params;
      const maintenanceData = req.body;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Add maintenance record
      const maintenanceRecord = {
        date: maintenanceData.date || new Date(),
        type: maintenanceData.type,
        description: maintenanceData.description,
        cost: maintenanceData.cost || 0,
        performedBy: maintenanceData.performedBy || '',
        nextServiceDue: maintenanceData.nextServiceDue || null
      };

      vehicle.maintenanceHistory.push(maintenanceRecord);
      await vehicle.save();

      const addedRecord = vehicle.maintenanceHistory[vehicle.maintenanceHistory.length - 1];

      return responseHelpers.success(res, {
        maintenanceRecord: {
          ...addedRecord.toObject(),
          formattedDate: dateHelpers.formatDateIndian(addedRecord.date),
          formattedCost: addedRecord.cost ? numberHelpers.formatCurrency(addedRecord.cost) : null,
          formattedNextServiceDue: addedRecord.nextServiceDue ? dateHelpers.formatDateIndian(addedRecord.nextServiceDue) : null
        },
        totalRecords: vehicle.maintenanceHistory.length
      }, 'Maintenance record added successfully', HTTP_STATUS.CREATED);

    } catch (error) {
      console.error('Add maintenance record error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get vehicle defects
  async getVehicleDefects(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Format defects
      const formattedDefects = vehicle.defects.map(defect => ({
        ...defect.toObject(),
        formattedEstimatedCost: defect.estimatedCost ? numberHelpers.formatCurrency(defect.estimatedCost) : null,
        formattedReportedAt: dateHelpers.formatDateIndian(defect.reportedAt)
      }));

      return responseHelpers.success(res, {
        defects: formattedDefects,
        totalDefects: vehicle.defects.length,
        criticalDefects: vehicle.defects.filter(d => d.severity === 'Critical').length,
        majorDefects: vehicle.defects.filter(d => d.severity === 'Major').length,
        minorDefects: vehicle.defects.filter(d => d.severity === 'Minor').length,
        totalEstimatedCost: vehicle.defects.reduce((sum, d) => sum + (d.estimatedCost || 0), 0)
      }, 'Vehicle defects retrieved successfully');

    } catch (error) {
      console.error('Get vehicle defects error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Add vehicle defect
  async addVehicleDefect(req, res) {
    try {
      const { id } = req.params;
      const defectData = req.body;

      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Add defect
      const defect = {
        description: defectData.description,
        severity: defectData.severity || 'Minor',
        estimatedCost: defectData.estimatedCost || 0,
        reportedAt: new Date()
      };

      vehicle.defects.push(defect);
      await vehicle.save();

      const addedDefect = vehicle.defects[vehicle.defects.length - 1];

      return responseHelpers.success(res, {
        defect: {
          ...addedDefect.toObject(),
          formattedEstimatedCost: addedDefect.estimatedCost ? numberHelpers.formatCurrency(addedDefect.estimatedCost) : null,
          formattedReportedAt: dateHelpers.formatDateIndian(addedDefect.reportedAt)
        },
        totalDefects: vehicle.defects.length
      }, 'Vehicle defect added successfully', HTTP_STATUS.CREATED);

    } catch (error) {
      console.error('Add vehicle defect error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get vehicle statistics
  async getVehicleStats(req, res) {
    try {
      // Overall statistics
      const totalVehicles = await Vehicle.countDocuments();
      const availableVehicles = await Vehicle.countDocuments({ status: 'Available' });
      const soldVehicles = await Vehicle.countDocuments({ status: 'Sold' });
      const reservedVehicles = await Vehicle.countDocuments({ status: 'Reserved' });

      // Status distribution
      const statusStats = await Vehicle.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$purchasePrice' },
            avgValue: { $avg: '$purchasePrice' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Brand distribution
      const brandStats = await Vehicle.aggregate([
        {
          $group: {
            _id: '$brand',
            count: { $sum: 1 },
            totalValue: { $sum: '$purchasePrice' },
            avgValue: { $avg: '$purchasePrice' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Condition distribution
      const conditionStats = await Vehicle.aggregate([
        {
          $group: {
            _id: '$condition',
            count: { $sum: 1 }
          }
        }
      ]);

      // Fuel type distribution
      const fuelTypeStats = await Vehicle.aggregate([
        {
          $group: {
            _id: '$fuelType',
            count: { $sum: 1 }
          }
        }
      ]);

      // Year distribution
      const yearStats = await Vehicle.aggregate([
        {
          $group: {
            _id: '$year',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 10 }
      ]);

      // Financial statistics
      const financialStats = await Vehicle.aggregate([
        {
          $group: {
            _id: null,
            totalPurchaseValue: { $sum: '$purchasePrice' },
            totalSellingValue: { $sum: { $ifNull: ['$sellingPrice', 0] } },
            avgPurchasePrice: { $avg: '$purchasePrice' },
            avgSellingPrice: { $avg: { $ifNull: ['$sellingPrice', 0] } },
            minPrice: { $min: '$purchasePrice' },
            maxPrice: { $max: '$purchasePrice' }
          }
        }
      ]);

      // Recent vehicles
      const recentVehicles = await Vehicle.find()
        .populate('owner', 'firstName lastName companyName')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('chassisNumber brand model year status purchasePrice createdAt owner');

      // Vehicles needing attention (expired documents, maintenance due, etc.)
      const currentDate = new Date();
      const vehiclesNeedingAttention = await Vehicle.find({
        $or: [
          { insuranceExpiryDate: { $lt: currentDate } },
          { pucExpiryDate: { $lt: currentDate } },
          { 'maintenanceHistory.nextServiceDue': { $lt: currentDate } }
        ]
      }).select('chassisNumber brand model insuranceExpiryDate pucExpiryDate maintenanceHistory');

      return responseHelpers.success(res, {
        overview: {
          totalVehicles,
          availableVehicles,
          soldVehicles,
          reservedVehicles,
          utilizationRate: totalVehicles > 0 ? ((soldVehicles + reservedVehicles) / totalVehicles * 100).toFixed(2) : 0
        },
        distributions: {
          status: statusStats.map(stat => ({
            ...stat,
            formattedTotalValue: numberHelpers.formatCurrency(stat.totalValue),
            formattedAvgValue: numberHelpers.formatCurrency(stat.avgValue)
          })),
          brands: brandStats.map(stat => ({
            ...stat,
            formattedTotalValue: numberHelpers.formatCurrency(stat.totalValue),
            formattedAvgValue: numberHelpers.formatCurrency(stat.avgValue)
          })),
          conditions: conditionStats,
          fuelTypes: fuelTypeStats,
          years: yearStats
        },
        financial: financialStats[0] ? {
          ...financialStats[0],
          formattedTotalPurchaseValue: numberHelpers.formatCurrency(financialStats[0].totalPurchaseValue),
          formattedTotalSellingValue: numberHelpers.formatCurrency(financialStats[0].totalSellingValue),
          formattedAvgPurchasePrice: numberHelpers.formatCurrency(financialStats[0].avgPurchasePrice),
          formattedAvgSellingPrice: numberHelpers.formatCurrency(financialStats[0].avgSellingPrice),
          formattedMinPrice: numberHelpers.formatCurrency(financialStats[0].minPrice),
          formattedMaxPrice: numberHelpers.formatCurrency(financialStats[0].maxPrice)
        } : null,
        recentVehicles: recentVehicles.map(vehicle => ({
          ...vehicle.toObject(),
          formattedPurchasePrice: numberHelpers.formatCurrency(vehicle.purchasePrice),
          formattedCreatedAt: dateHelpers.formatDateIndian(vehicle.createdAt)
        })),
        attention: {
          count: vehiclesNeedingAttention.length,
          vehicles: vehiclesNeedingAttention.map(vehicle => ({
            id: vehicle._id,
            chassisNumber: vehicle.chassisNumber,
            brand: vehicle.brand,
            model: vehicle.model,
            issues: [
              ...(vehicle.insuranceExpiryDate && vehicle.insuranceExpiryDate < currentDate ? ['Insurance Expired'] : []),
              ...(vehicle.pucExpiryDate && vehicle.pucExpiryDate < currentDate ? ['PUC Expired'] : []),
              ...(vehicle.maintenanceHistory.some(m => m.nextServiceDue && m.nextServiceDue < currentDate) ? ['Service Due'] : [])
            ]
          }))
        }
      }, 'Vehicle statistics retrieved successfully');

    } catch (error) {
      console.error('Get vehicle stats error:', error);
      return responseHelpers.error(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Helper methods
  parseSortString(sortString) {
    const sortObj = {};
    const parts = sortString.split(',');
    
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.startsWith('-')) {
        sortObj[trimmed.substring(1)] = -1;
      } else {
        sortObj[trimmed] = 1;
      }
    });
    
    return sortObj;
  }

  getValidStatusTransitions(currentStatus) {
    const transitions = {
      'Available': ['Reserved', 'Under Maintenance', 'Damaged', 'Sold'],
      'Reserved': ['Available', 'Sold', 'Under Maintenance'],
      'Under Maintenance': ['Available', 'Damaged'],
      'Damaged': ['Available', 'Under Maintenance', 'Scrapped'],
      'Sold': ['Available'], // Only allow if sale is cancelled
      'Scrapped': [] // No transitions from scrapped
    };

    return transitions[currentStatus] || [];
  }
}

module.exports = new VehicleController();
