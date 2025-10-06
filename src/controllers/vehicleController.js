const Vehicle = require('../models/Vehicle');
const Client = require('../models/Client');
const { responseHelpers, numberHelpers } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

class VehicleController {
  // Get all vehicles with pagination, search, and filtering
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        q,
        brand,
        status,
        owner,
        isActive,
        showInMarketplace,
        sort = '-createdAt',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query object
      const query = {};

      // Search functionality - search in chassis number, brand, color
      const searchTerm = search || q;
      if (searchTerm && searchTerm.trim()) {
        const trimmedTerm = searchTerm.trim();
        console.log('=== VEHICLE SEARCH DEBUG ===');
        console.log('Search term:', trimmedTerm);
        
        // Build search conditions
        const searchConditions = [
          { chassisNumber: { $regex: trimmedTerm, $options: 'i' } },
          { brand: { $regex: trimmedTerm, $options: 'i' } },
          { color: { $regex: trimmedTerm, $options: 'i' } }
        ];
        
        query.$or = searchConditions;
        console.log('Search conditions count:', searchConditions.length);
      }

      // Filter by brand
      if (brand && brand.trim()) {
        query.brand = { $regex: brand.trim(), $options: 'i' };
      }

      // Filter by status
      if (status && status.trim()) {
        query.status = status.trim();
      }

      // Filter by owner
      if (owner) {
        query.owner = owner;
      }

      // Filter by active status
      if (typeof isActive !== 'undefined') {
        query.isActive = isActive === 'true' || isActive === true;
      }

      // Filter by marketplace visibility
      if (typeof showInMarketplace !== 'undefined') {
        query.showInMarketplace = showInMarketplace === 'true' || showInMarketplace === true;
      }

      // Build sort object
      let sortObj = {};
      if (sort && sort !== '') {
        if (sort.startsWith('-')) {
          sortObj[sort.substring(1)] = -1;
        } else {
          sortObj[sort] = 1;
        }
      } else if (sortBy) {
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sortObj = { createdAt: -1 };
      }

      // Calculate pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Execute query with pagination
      console.log('Final MongoDB query:', JSON.stringify(query, null, 2));
      
      const vehicles = await Vehicle.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('owner', 'name phone type')
        .populate('createdBy', 'ownerManagerName')
        .populate('updatedBy', 'ownerManagerName')
        .lean();
      
      console.log('Found vehicles:', vehicles.length);

      // Get total count for pagination
      const total = await Vehicle.countDocuments(query);
      const totalPages = Math.ceil(total / limitNum);

      // Add computed fields for better frontend display
      const vehiclesWithComputedFields = vehicles.map(vehicle => ({
        ...vehicle,
        formattedMarketValue: numberHelpers.formatCurrency(vehicle.marketValue || 0),
        formattedMonthlyFee: numberHelpers.formatCurrency(vehicle.monthlyFee || 0),
        formattedPurchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : null,
        formattedBondExpiryDate: vehicle.bondExpiryDate ? new Date(vehicle.bondExpiryDate).toLocaleDateString() : null,
        ownerName: vehicle.owner ? vehicle.owner.name : null,
        statusText: vehicle.status || 'Available',
        activeText: vehicle.isActive ? 'Active' : 'Inactive',
        primaryImage: vehicle.images && vehicle.images.length > 0 
          ? vehicle.images.find(img => img.isPrimary)?.url || vehicle.images[0].url
          : null
      }));

      return responseHelpers.success(res, {
        data: vehiclesWithComputedFields,
        pagination: {
          page: pageNum,
          limit: limitNum,
        total,
        pages: totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          nextPage: pageNum < totalPages ? pageNum + 1 : null,
          prevPage: pageNum > 1 ? pageNum - 1 : null,
        },
      }, 'Vehicles retrieved successfully');
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get single vehicle by ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findById(id)
        .populate('owner', 'name phone type email')
        .populate('createdBy', 'ownerManagerName')
        .populate('updatedBy', 'ownerManagerName');

      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Add computed fields
      const vehicleData = {
        ...vehicle.toObject(),
        formattedMarketValue: numberHelpers.formatCurrency(vehicle.marketValue || 0),
        formattedMonthlyFee: numberHelpers.formatCurrency(vehicle.monthlyFee || 0),
        formattedPurchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : null,
        formattedBondExpiryDate: vehicle.bondExpiryDate ? new Date(vehicle.bondExpiryDate).toLocaleDateString() : null,
      };

      return responseHelpers.success(res, vehicleData, 'Vehicle retrieved successfully');
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Create new vehicle
  async create(req, res) {
    try {
      const {
        chassisNumber,
        owner,
        marketValue,
        showInMarketplace,
        brand,
        year,
        color,
        purchaseDate,
        bondExpiryDate,
        mileage,
        status,
        isActive,
        monthlyFee,
        tags,
        images
      } = req.body;

      // Check if chassis number already exists
      const existingVehicle = await Vehicle.findOne({ chassisNumber: chassisNumber.toUpperCase() });
      if (existingVehicle) {
        return responseHelpers.error(res, 'Vehicle with this chassis number already exists', HTTP_STATUS.BAD_REQUEST);
      }

      // Verify owner exists
      const clientExists = await Client.findById(owner);
      if (!clientExists) {
        return responseHelpers.error(res, 'Client not found', HTTP_STATUS.BAD_REQUEST);
      }

      // Create vehicle
      const vehicle = new Vehicle({
        chassisNumber: chassisNumber.toUpperCase(),
        engineNumber: chassisNumber.toUpperCase(), // Using chassis as engine for now
        owner,
        marketValue: marketValue || 0,
        showInMarketplace: showInMarketplace || false,
        brand,
        year,
        color,
        purchaseDate: purchaseDate || new Date(),
        bondExpiryDate,
        mileage: mileage || 0,
        status: status || 'Available',
        isActive: typeof isActive !== 'undefined' ? isActive : true,
        monthlyFee: monthlyFee || 0,
        tags: tags || [],
        images: images || [],
        createdBy: req.user?.userId || req.user?._id,
      });

      await vehicle.save();

      // Populate owner details
      await vehicle.populate('owner', 'name phone type');

      return responseHelpers.success(res, vehicle, 'Vehicle created successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      if (error.name === 'ValidationError') {
        return responseHelpers.error(res, error.message, HTTP_STATUS.BAD_REQUEST);
      }
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Update vehicle
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (process.env.NODE_ENV !== 'production') {
        console.log('\n[VEHICLE UPDATE] ID:', id);
        console.log('[VEHICLE UPDATE] Incoming updates:', updates);
      }

      // Remove fields that shouldn't be updated
      delete updates.createdBy;
      delete updates.createdAt;

      // If chassis number is being updated, check for duplicates
      if (updates.chassisNumber) {
        updates.chassisNumber = updates.chassisNumber.toUpperCase();
        const existing = await Vehicle.findOne({ 
          chassisNumber: updates.chassisNumber,
          _id: { $ne: id }
        });
        if (existing) {
          return responseHelpers.error(res, 'Vehicle with this chassis number already exists', HTTP_STATUS.BAD_REQUEST);
        }
      }

      // If owner is being updated, verify they exist
      if (updates.owner) {
        const clientExists = await Client.findById(updates.owner);
        if (!clientExists) {
          return responseHelpers.error(res, 'Client not found', HTTP_STATUS.BAD_REQUEST);
        }
      }

      updates.updatedBy = req.user.userId;

      const before = await Vehicle.findById(id).lean();

      const vehicle = await Vehicle.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('owner', 'name phone type');

      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      if (process.env.NODE_ENV !== 'production') {
        const after = vehicle.toObject ? vehicle.toObject() : vehicle;
        console.log('[VEHICLE UPDATE] Before:', before);
        console.log('[VEHICLE UPDATE] After :', after);
      }

      return responseHelpers.success(res, vehicle, 'Vehicle updated successfully');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      if (error.name === 'ValidationError') {
        return responseHelpers.error(res, error.message, HTTP_STATUS.BAD_REQUEST);
      }
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete vehicle
  async remove(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findByIdAndDelete(id);

      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      return responseHelpers.success(res, { id }, 'Vehicle deleted successfully');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Search vehicles (dedicated search endpoint)
  async search(req, res) {
    try {
      const {
        q, 
        page = 1,
        limit = 10,
        brand,
        status,
        sort = '-createdAt'
      } = req.query;

      if (!q || q.trim().length < 2) {
        return responseHelpers.error(res, 'Search query must be at least 2 characters long', HTTP_STATUS.BAD_REQUEST);
      }

      // Build search query
      const trimmedTerm = q.trim();
      const searchConditions = [
        { chassisNumber: { $regex: trimmedTerm, $options: 'i' } },
        { brand: { $regex: trimmedTerm, $options: 'i' } },
        { color: { $regex: trimmedTerm, $options: 'i' } }
      ];
      
      const searchQuery = {
        $or: searchConditions
      };

      // Add additional filters
      if (brand && brand.trim()) {
        searchQuery.brand = { $regex: brand.trim(), $options: 'i' };
      }
      if (status && status.trim()) {
        searchQuery.status = status.trim();
      }

      // Build sort object
      let sortObj = {};
      if (sort && sort !== '') {
        if (sort.startsWith('-')) {
          sortObj[sort.substring(1)] = -1;
        } else {
          sortObj[sort] = 1;
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const vehicles = await Vehicle.find(searchQuery)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('owner', 'name phone type')
        .lean();

      const total = await Vehicle.countDocuments(searchQuery);
      const totalPages = Math.ceil(total / limit);

      return responseHelpers.success(res, {
        data: vehicles,
        pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
      }, 'Search results retrieved successfully');
    } catch (error) {
      console.error('Error searching vehicles:', error);
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get vehicle statistics
  async getStats(req, res) {
    try {
      const [statusStats, brandStats, totalStats] = await Promise.all([
        Vehicle.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
              totalValue: { $sum: '$marketValue' },
            }
          }
        ]),
        Vehicle.aggregate([
        {
          $group: {
            _id: '$brand',
            count: { $sum: 1 },
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
        ]),
        Vehicle.aggregate([
        {
          $group: {
            _id: null,
              total: { $sum: 1 },
              totalValue: { $sum: '$marketValue' },
              avgValue: { $avg: '$marketValue' },
            }
          }
        ])
      ]);

      return responseHelpers.success(res, {
        byStatus: statusStats,
        byBrand: brandStats,
        overall: totalStats[0] || { total: 0, totalValue: 0, avgValue: 0 },
      }, 'Vehicle statistics retrieved successfully');
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Upload vehicle images
  async uploadImages(req, res) {
    try {
      const { id } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return responseHelpers.error(res, 'No images provided', HTTP_STATUS.BAD_REQUEST);
      }

      // Check if vehicle exists
      const vehicle = await Vehicle.findById(id);
      if (!vehicle) {
        return responseHelpers.error(res, 'Vehicle not found', HTTP_STATUS.NOT_FOUND);
      }

      // Process uploaded images
      const uploadService = require('../services/uploadService');
      const processedImages = await uploadService.processVehicleImages(files, id);

      // Update vehicle with image information
      const imageData = processedImages.map(img => ({
        url: `/uploads/vehicles/images/${id}/${img.filename}`,
        thumbnail: `/uploads/vehicles/images/${id}/thumb_${img.filename}`,
        originalName: img.originalName,
        size: img.size,
        uploadedAt: new Date()
      }));

      vehicle.images = [...(vehicle.images || []), ...imageData];
      await vehicle.save();

      return responseHelpers.success(res, {
        vehicle: vehicle,
        uploadedImages: imageData
      }, 'Images uploaded successfully');
    } catch (error) {
      console.error('Error uploading vehicle images:', error);
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new VehicleController();
