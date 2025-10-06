const Client = require('../models/Client');
const { responseHelpers } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

class ClientController {
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        q, // Support both 'search' and 'q' for backward compatibility
        type, 
        isActive,
        sort = '-createdAt',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query object
      const query = {};
      
      // Search functionality - search in name and phone
      const searchTerm = search || q;
      if (searchTerm && searchTerm.trim()) {
        const trimmedTerm = searchTerm.trim();
        console.log('=== SEARCH DEBUG ===');
        console.log('Search term:', trimmedTerm);
        
        // Build search conditions
        const searchConditions = [];
        
        // Always search in name field
        searchConditions.push({ name: { $regex: trimmedTerm, $options: 'i' } });
        console.log('Added name search');
        
        // For phone number search, be more specific
        // Only search if search term looks like a phone number
        const isPhoneNumber = /^[\d\s\-\+\(\)]+$/.test(trimmedTerm) && trimmedTerm.length >= 6;
        console.log('Is phone number:', isPhoneNumber);
        
        if (isPhoneNumber) {
          searchConditions.push({ phone: { $regex: trimmedTerm, $options: 'i' } });
          console.log('Added phone search');
        }
        
        query.$or = searchConditions;
        console.log('Search conditions count:', searchConditions.length);
        console.log('Query:', JSON.stringify(query, null, 2));
      } else {
        console.log('No search term provided');
      }

      // Filter by client type
      if (type && type.trim()) {
        query.type = { $regex: type.trim(), $options: 'i' };
      }

      // Filter by active status
      if (typeof isActive !== 'undefined') {
        query.isActive = isActive === 'true' || isActive === true;
      }

      // Build sort object
      let sortObj = {};
      if (sort && sort !== '') {
        // Handle sort parameter like "-createdAt" or "name"
        if (sort.startsWith('-')) {
          sortObj[sort.substring(1)] = -1;
        } else {
          sortObj[sort] = 1;
        }
      } else if (sortBy) {
        // Handle separate sortBy and sortOrder parameters
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        // Default sort
        sortObj = { createdAt: -1 };
      }

      // Calculate pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
      const skip = (pageNum - 1) * limitNum;

      // Execute query with pagination
      console.log('Final MongoDB query:', JSON.stringify(query, null, 2));
      console.log('Sort:', sortObj);
      console.log('Skip:', skip, 'Limit:', limitNum);
      
      const clients = await Client.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .lean(); // Use lean() for better performance
      
      console.log('Found clients:', clients.length);

      // Get total count for pagination
      const total = await Client.countDocuments(query);
      const totalPages = Math.ceil(total / limitNum);

      // Add computed fields for better frontend display
      const clientsWithComputedFields = clients.map(client => ({
        ...client,
        formattedCreatedAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '',
        formattedUpdatedAt: client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : '',
        displayName: client.name || client.companyName || 'Unnamed Client',
        statusText: client.isActive ? 'Active' : 'Inactive',
        outstandingBalance: client.outstandingBalance || 0
      }));

      return responseHelpers.paginated(res, clientsWithComputedFields, {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        nextPage: pageNum < totalPages ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
      }, 'Clients retrieved successfully');

    } catch (error) {
      console.error('Get all clients error:', error);
      return responseHelpers.error(res, 'Internal Server Error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async create(req, res) {
    try {
      const data = req.body;
      const userId = req.user._id;
      const exists = await Client.findOne({ phone: data.phone });
      if (exists) {
        return responseHelpers.error(res, 'Client with this phone already exists', HTTP_STATUS.CONFLICT);
      }
      const client = await Client.create({ ...data, createdBy: userId });
      return responseHelpers.success(res, client, 'Client created', HTTP_STATUS.CREATED);
    } catch (error) {
      return responseHelpers.error(res, 'Internal Server Error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async getById(req, res) {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) return responseHelpers.error(res, 'Client not found', HTTP_STATUS.NOT_FOUND);
      return responseHelpers.success(res, client, 'Client retrieved');
    } catch (error) {
      return responseHelpers.error(res, 'Internal Server Error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async update(req, res) {
    try {
      const userId = req.user._id;
      const updated = await Client.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: userId },
        { new: true, runValidators: true }
      );
      if (!updated) return responseHelpers.error(res, 'Client not found', HTTP_STATUS.NOT_FOUND);
      return responseHelpers.success(res, updated, 'Client updated');
    } catch (error) {
      return responseHelpers.error(res, 'Internal Server Error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(req, res) {
    try {
      const client = await Client.findById(req.params.id);
      if (!client) {
        return responseHelpers.error(res, 'Client not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check if user can delete this client (created by them or admin/manager)
      const userId = req.user._id;
      const userRole = req.user.role;
      
      if (userRole !== 'admin' && userRole !== 'manager' && client.createdBy.toString() !== userId.toString()) {
        return responseHelpers.error(res, 'Access denied. You can only delete clients you created.', HTTP_STATUS.FORBIDDEN);
      }

      const deleted = await Client.findByIdAndDelete(req.params.id);
      return responseHelpers.success(res, { id: req.params.id }, 'Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      return responseHelpers.error(res, 'Internal Server Error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Search clients with advanced filtering
  async search(req, res) {
    try {
      const { 
        q, 
        page = 1, 
        limit = 10, 
        type, 
        isActive,
        sort = '-createdAt'
      } = req.query;

      if (!q || q.trim().length < 2) {
        return responseHelpers.error(res, 'Search query must be at least 2 characters long', HTTP_STATUS.BAD_REQUEST);
      }

      // Build search query with improved phone number matching
      const trimmedTerm = q.trim();
      const searchConditions = [
        { name: { $regex: trimmedTerm, $options: 'i' } }
      ];
      
      // For phone number search, be more specific
      if (/^[\d\s\-\+\(\)]+$/.test(trimmedTerm) && trimmedTerm.length >= 6) {
        // If search term contains only digits, spaces, dashes, plus, parentheses and is 6+ chars
        searchConditions.push({ phone: { $regex: trimmedTerm, $options: 'i' } });
      } else if (/^\d{10,}$/.test(trimmedTerm)) {
        // If search term is 10+ digits (full phone number)
        searchConditions.push({ phone: { $regex: trimmedTerm, $options: 'i' } });
      }
      
      const searchQuery = {
        $or: searchConditions
      };

      // Add additional filters
      if (type && type.trim()) {
        searchQuery.type = { $regex: type.trim(), $options: 'i' };
      }
      if (typeof isActive !== 'undefined') {
        searchQuery.isActive = isActive === 'true' || isActive === true;
      }

      // Build sort object
      let sortObj = {};
      if (sort && sort !== '') {
        if (sort.startsWith('-')) {
          sortObj[sort.substring(1)] = -1;
        } else {
          sortObj[sort] = 1;
        }
      } else {
        sortObj = { createdAt: -1 };
      }

      // Calculate pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Execute search
      const clients = await Client.find(searchQuery)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .lean();

      const total = await Client.countDocuments(searchQuery);
      const totalPages = Math.ceil(total / limitNum);

      // Add computed fields
      const clientsWithComputedFields = clients.map(client => ({
        ...client,
        formattedCreatedAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '',
        displayName: client.name || client.companyName || 'Unnamed Client',
        statusText: client.isActive ? 'Active' : 'Inactive',
        outstandingBalance: client.outstandingBalance || 0
      }));

      return responseHelpers.paginated(res, clientsWithComputedFields, {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        searchQuery: q.trim()
      }, 'Search completed successfully');

    } catch (error) {
      console.error('Search clients error:', error);
      return responseHelpers.error(res, 'Internal Server Error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get client statistics
  async getStats(req, res) {
    try {
      const stats = await Client.aggregate([
        {
          $group: {
            _id: null,
            totalClients: { $sum: 1 },
            activeClients: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactiveClients: { $sum: { $cond: ['$isActive', 0, 1] } },
            totalOutstandingBalance: { $sum: { $ifNull: ['$outstandingBalance', 0] } }
          }
        }
      ]);

      const typeStats = await Client.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            activeCount: { $sum: { $cond: ['$isActive', 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const recentClients = await Client.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name companyName phone type isActive createdAt')
        .lean();

      return responseHelpers.success(res, {
        overview: stats[0] || {
          totalClients: 0,
          activeClients: 0,
          inactiveClients: 0,
          totalOutstandingBalance: 0
        },
        typeDistribution: typeStats,
        recentClients: recentClients.map(client => ({
          ...client,
          displayName: client.name || client.companyName || 'Unnamed Client',
          statusText: client.isActive ? 'Active' : 'Inactive'
        }))
      }, 'Client statistics retrieved successfully');

    } catch (error) {
      console.error('Get client stats error:', error);
      return responseHelpers.error(res, 'Internal Server Error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new ClientController();


