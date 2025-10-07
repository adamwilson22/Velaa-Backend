const Vehicle = require('../models/Vehicle');
const { responseHelpers } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

class DashboardController {
  async getOverview(req, res) {
    try {
      // Parallelize queries for performance
      const [
        totalVehicles,
        totalInStock,
        availableForSale,
        byBrand,
        byStatus,
        recentVehicles
      ] = await Promise.all([
        Vehicle.countDocuments({}),
        Vehicle.countDocuments({ isActive: true, status: { $ne: 'Sold' } }),
        Vehicle.countDocuments({ isActive: true, status: 'Available' }),
        Vehicle.aggregate([
          { $match: {} },
          { $group: { _id: '$brand', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Vehicle.aggregate([
          { $match: {} },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Vehicle.find({})
          .sort({ createdAt: -1 })
          .limit(3)
          .select('brand chassisNumber year createdAt images status isActive')
          .lean(),
      ]);

      const data = {
        stats: {
          totalVehiclesInStock: totalInStock,
          vehiclesAvailableForSale: availableForSale,
          totalVehicles,
        },
        stockChart: {
          byBrand: byBrand.map(b => ({ brand: b._id || 'Unknown', count: b.count })),
          byStatus: byStatus.map(s => ({ status: s._id || 'Unknown', count: s.count })),
        },
        vehicles: {
          recentAdded: recentVehicles.map(v => ({
            _id: v._id,
            brand: v.brand,
            chassisNumber: v.chassisNumber,
            year: v.year,
            status: v.status,
            isActive: v.isActive,
            createdAt: v.createdAt,
            image: Array.isArray(v.images) && v.images.length > 0 ? v.images[0].url : null,
          })),
        },
      };

      if (process.env.NODE_ENV !== 'production') {
        console.log('[DASHBOARD] Overview payload:', JSON.stringify(data, null, 2));
      }

      return responseHelpers.success(res, data, 'Dashboard overview retrieved successfully', HTTP_STATUS.OK);
    } catch (error) {
      console.error('Error building dashboard overview:', error);
      return responseHelpers.error(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new DashboardController();


