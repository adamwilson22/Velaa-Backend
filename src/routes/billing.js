const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate, optionalAuth, requireManager } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { apiLimiter, reportLimiter } = require('../middleware/rateLimiter');
const { billingSchemas, paramSchemas, querySchemas } = require('../middleware/validation');

const billingService = require('../services/billingService');
const Vehicle = require('../models/Vehicle');
const { responseHelpers } = require('../utils/helpers');

// Placeholder route handlers
const placeholder = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Route placeholder - Controller not implemented yet',
    endpoint: req.originalUrl,
    method: req.method,
  });
};

// Make authentication optional for now (debug); token still honored if present
router.use(optionalAuth);

// Billing CRUD routes - list (simple fetch, no lazy creation)
router.get('/',
  apiLimiter,
  validateQuery(querySchemas.pagination),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        month, // optional billingPeriod 'YYYY-MM'
        transactionType = 'Rental',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const Billing = require('../models/Billing');
      const query = {};
      if (transactionType) query.transactionType = transactionType;
      if (month) query.billingPeriod = month;

      const [rows, total] = await Promise.all([
        Billing.find(query)
          .populate('client', 'name')
          .populate('vehicle', 'chassisNumber brand purchaseDate monthlyFee')
          .sort({ dueDate: 1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Billing.countDocuments(query)
      ]);

      const pages = Math.ceil(total / limitNum) || 1;
      return responseHelpers.success(res, {
        data: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1
        }
      }, 'Billing list');
    } catch (e) {
      return responseHelpers.error(res, e.message, 400);
    }
  }
);

router.post('/',
  apiLimiter,
  validate(billingSchemas.create),
  placeholder // billingController.createBilling
);

// List billing records (all by default, or filtered by month)
router.get('/list',
  apiLimiter,
  async (req, res) => {
    try {
      console.log('[BILLING][LIST] ENTER');
      const Billing = require('../models/Billing');
      
      // Build query - show all billing records by default
      const query = { transactionType: 'Rental' };
      
      // Filter by month if specified
      let period = null;
      if (req.query.month) {
        const d = new Date(`${req.query.month}-01T00:00:00.000Z`);
        period = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        query.billingPeriod = period;
        console.log('[BILLING][LIST] Filtering by period:', period);
      } else {
        console.log('[BILLING][LIST] Showing all billing records (no month filter)');
      }
      
      // Get all billing records (or filtered by period)
      const bills = await Billing
        .find(query)
        .populate({
          path: 'client',
          select: 'name',
          options: { strictPopulate: false } // Allow null/undefined client refs
        })
        .populate({
          path: 'vehicle',
          select: 'chassisNumber brand purchaseDate monthlyFee owner',
          populate: { 
            path: 'owner', 
            select: 'name',
            options: { strictPopulate: false }
          }
        })
        .sort({ billingPeriod: -1, dueDate: 1 }) // Sort by period (newest first) then by due date
        .lean();
      
      console.log('[BILLING][LIST] Total bills found:', bills.length);
      
      // If no bills found and lazy generation is enabled, generate them for current month
      if (bills.length === 0 && req.query.lazy === 'true') {
        console.log('[BILLING][LIST] Lazy generation enabled, creating bills for eligible vehicles');
        const Vehicle = require('../models/Vehicle');
        const d = new Date();
        const currentPeriod = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        
        const vehicles = await Vehicle.find({ 
          isActive: true, 
          status: { $ne: 'Sold' }, 
          monthlyFee: { $gt: 0 },
          owner: { $exists: true, $ne: null }
        }, '_id');
        
        console.log('[BILLING][LIST] Found', vehicles.length, 'eligible vehicles');
        const userId = req.user && (req.user.userId || req.user._id);
        
        if (vehicles.length > 0 && userId) {
          await Promise.all(
            vehicles.map(v => 
              billingService.ensureMonthlyInvoice(v._id, currentPeriod, userId).catch(err => {
                console.error('[BILLING][LIST] Failed to create invoice for vehicle', v._id, ':', err.message);
                return null;
              })
            )
          );
          
          // Fetch bills again after generation
          const newBills = await Billing
            .find(query)
            .populate({
              path: 'client',
              select: 'name',
              options: { strictPopulate: false }
            })
            .populate({
              path: 'vehicle',
              select: 'chassisNumber brand purchaseDate monthlyFee owner',
              populate: { 
                path: 'owner', 
                select: 'name',
                options: { strictPopulate: false }
              }
            })
            .sort({ billingPeriod: -1, dueDate: 1 })
            .lean();
          
          console.log('[BILLING][LIST] bills.count after lazy generation=', newBills.length);
          return responseHelpers.success(res, { period: period || 'all', bills: newBills }, 'Billing list');
        }
      }
      
      return responseHelpers.success(res, { period: period || 'all', bills }, 'Billing list');
    } catch (e) {
      console.error('[BILLING][LIST] error=', e && e.stack ? e.stack : e);
      return responseHelpers.error(res, e.message, 400);
    }
  }
);

router.get('/ensure/vehicle/:vehicleId',
  apiLimiter,
  validateParams(paramSchemas.id),
  async (req, res) => {
    try {
      const d = req.query.month ? new Date(`${req.query.month}-01T00:00:00.000Z`) : new Date();
      const period = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const result = await billingService.ensureMonthlyInvoice(req.params.vehicleId, period, req.user.userId);
      return responseHelpers.success(res, result.bill, result.created ? 'Created monthly invoice' : 'Existing monthly invoice');
    } catch (e) {
      return responseHelpers.error(res, e.message, 400);
    }
  }
);

router.get('/outstanding',
  apiLimiter,
  validateQuery(querySchemas.pagination),
  placeholder // billingController.getOutstandingBills
);

router.get('/overdue',
  apiLimiter,
  validateQuery(querySchemas.pagination),
  placeholder // billingController.getOverdueBills
);

router.get('/stats',
  apiLimiter,
  placeholder // billingController.getBillingStats
);

// From here down, ":id" routes
router.get('/:id',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.getBillingById
);

router.put('/:id',
  apiLimiter,
  validateParams(paramSchemas.id),
  validate(billingSchemas.create),
  placeholder // billingController.updateBilling
);
router.delete('/:id',
  requireManager,
  validateParams(paramSchemas.id),
  placeholder // billingController.deleteBilling
);

// Payment routes
router.post('/:id/payment',
  apiLimiter,
  validateParams(paramSchemas.id),
  validate(billingSchemas.addPayment),
  placeholder // billingController.addPayment
);

router.get('/:id/payments',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.getBillingPayments
);

router.put('/:id/payments/:paymentId',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.updatePayment
);

router.delete('/:id/payments/:paymentId',
  requireManager,
  validateParams(paramSchemas.id),
  placeholder // billingController.deletePayment
);

// Client-specific billing
router.get('/client/:clientId',
  apiLimiter,
  validateParams(paramSchemas.id),
  validateQuery(querySchemas.pagination),
  placeholder // billingController.getClientBilling
);

router.get('/client/:clientId/outstanding',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.getClientOutstanding
);

// Vehicle-specific billing
router.get('/ensure/vehicle/:vehicleId',
  apiLimiter,
  validateParams(paramSchemas.id),
  async (req, res) => {
    try {
      const d = req.query.month ? new Date(`${req.query.month}-01T00:00:00.000Z`) : new Date();
      const period = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const result = await billingService.ensureMonthlyInvoice(req.params.vehicleId, period, req.user.userId);
      return responseHelpers.success(res, result.bill, result.created ? 'Created monthly invoice' : 'Existing monthly invoice');
    } catch (e) {
      return responseHelpers.error(res, e.message, 400);
    }
  }
);

router.get('/list',
  apiLimiter,
  async (req, res) => {
    try {
      const d = req.query.month ? new Date(`${req.query.month}-01T00:00:00.000Z`) : new Date();
      const period = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (req.query.lazy === 'true') {
        // Ensure invoices exist for eligible vehicles
        const Vehicle = require('../models/Vehicle');
        const vehicles = await Vehicle.find({ isActive: true, status: { $ne: 'Sold' }, monthlyFee: { $gt: 0 } }, '_id');
        await Promise.all(vehicles.map(v => billingService.ensureMonthlyInvoice(v._id, period, req.user.userId).catch(()=>null)));
      }
      const bills = await billingService.listMonthly(period);
      return responseHelpers.success(res, { period, bills }, 'Monthly billing list');
    } catch (e) {
      return responseHelpers.error(res, e.message, 400);
    }
  }
);

// Invoice operations
router.post('/:id/send-invoice',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.sendInvoice
);

router.get('/:id/download-invoice',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.downloadInvoice
);

router.post('/:id/duplicate',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.duplicateBilling
);

// Reminder operations
router.post('/:id/send-reminder',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.sendPaymentReminder
);

router.get('/:id/reminders',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.getBillingReminders
);

// Status operations
router.put('/:id/mark-paid',
  apiLimiter,
  validateParams(paramSchemas.id),
  placeholder // billingController.markAsPaid
);

router.put('/:id/cancel',
  requireManager,
  validateParams(paramSchemas.id),
  placeholder // billingController.cancelBilling
);

router.put('/:id/refund',
  requireManager,
  validateParams(paramSchemas.id),
  placeholder // billingController.refundBilling
);

// Reports
router.get('/reports/revenue',
  reportLimiter,
  placeholder // billingController.getRevenueReport
);

router.get('/reports/outstanding',
  reportLimiter,
  placeholder // billingController.getOutstandingReport
);

router.get('/reports/payments',
  reportLimiter,
  placeholder // billingController.getPaymentReport
);

router.get('/reports/tax',
  reportLimiter,
  placeholder // billingController.getTaxReport
);

module.exports = router;
