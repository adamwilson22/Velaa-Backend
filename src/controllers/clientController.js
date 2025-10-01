const Client = require('../models/Client');
const { responseHelpers } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

class ClientController {
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, q, type, isActive } = req.query;
      const query = {};
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
        ];
      }
      if (type) query.type = type;
      if (typeof isActive !== 'undefined') query.isActive = isActive === 'true' || isActive === true;

      const skip = (page - 1) * limit;
      const clients = await Client.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      const total = await Client.countDocuments(query);

      return responseHelpers.paginated(res, clients, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }, 'Clients retrieved successfully');
    } catch (error) {
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
      const deleted = await Client.findByIdAndDelete(req.params.id);
      if (!deleted) return responseHelpers.error(res, 'Client not found', HTTP_STATUS.NOT_FOUND);
      return responseHelpers.success(res, { id: req.params.id }, 'Client deleted');
    } catch (error) {
      return responseHelpers.error(res, 'Internal Server Error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new ClientController();


