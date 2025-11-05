const Vehicle = require('../models/Vehicle');
const Billing = require('../models/Billing');

function monthKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function computeAnchorDay(vehicle) {
  const pd = vehicle.purchaseDate ? new Date(vehicle.purchaseDate) : new Date();
  const day = pd.getDate() || 1;
  return Math.min(vehicle.billingAnchorDay || day || 1, 28);
}

function computeDueDate(vehicle, period) {
  const anchor = computeAnchorDay(vehicle);
  return new Date(`${period}-${String(anchor).padStart(2,'0')}T00:00:00.000Z`);
}

exports.ensureMonthlyInvoice = async (vehicleId, period, userId) => {
  console.log('[BILLING SERVICE] ensureMonthlyInvoice called with vehicleId:', vehicleId, 'period:', period, 'userId:', userId);
  
  const vehicle = await Vehicle.findById(vehicleId).populate('owner', 'name');
  if (!vehicle) throw new Error('Vehicle not found');

  console.log('[BILLING SERVICE] Vehicle found:', { 
    id: vehicle._id, 
    isActive: vehicle.isActive, 
    status: vehicle.status, 
    owner: vehicle.owner?._id, 
    monthlyFee: vehicle.monthlyFee 
  });

  if (!vehicle.isActive) throw new Error('Vehicle inactive');
  if (vehicle.status === 'Sold') throw new Error('Vehicle sold');
  if (!vehicle.owner) throw new Error('Vehicle has no owner');
  if (!vehicle.monthlyFee || vehicle.monthlyFee <= 0) throw new Error('No monthly fee set');

  console.log('[BILLING SERVICE] Eligibility passed, creating/finding bill...');
  const dueDate = computeDueDate(vehicle, period);

  try {
    // Check if bill already exists BEFORE upsert
    const existingBill = await Billing.findOne({ 
      vehicle: vehicle._id, 
      transactionType: 'Rental', 
      billingPeriod: period 
    });
    
    console.log('[BILLING SERVICE] Existing bill check:', existingBill ? 'FOUND' : 'NOT FOUND');

    // Generate invoice number for new bills (since pre-save hook doesn't run with findOneAndUpdate)
    let invoiceNumber = null;
    if (!existingBill) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Find the last invoice number for this year-month
      const lastInvoice = await Billing.findOne({
        invoiceNumber: new RegExp(`^INV-${year}${month}-`)
      }).sort({ invoiceNumber: -1 });
      
      let sequence = 1;
      if (lastInvoice) {
        const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
      console.log('[BILLING SERVICE] Generated invoice number:', invoiceNumber);
    }

    const doc = await Billing.findOneAndUpdate(
      { vehicle: vehicle._id, transactionType: 'Rental', billingPeriod: period },
      {
        $setOnInsert: {
          invoiceNumber: invoiceNumber, // Add generated invoice number
          invoiceDate: new Date(),
          dueDate,
          client: vehicle.owner._id,
          vehicle: vehicle._id,
          transactionType: 'Rental',
          baseAmount: vehicle.monthlyFee,
          totalAmount: vehicle.monthlyFee, // Required field
          taxes: [],
          additionalCharges: [],
          billingPeriod: period,
          cycleAnchorDay: computeAnchorDay(vehicle),
          createdBy: userId,
        },
        $set: { updatedBy: userId }
      },
      { new: true, upsert: true }
    ).populate('client vehicle');

    console.log('[BILLING SERVICE] Bill operation complete. Bill ID:', doc._id);
    console.log('[BILLING SERVICE] Bill timestamps - createdAt:', doc.createdAt, 'updatedAt:', doc.updatedAt);
    
    const wasCreated = !existingBill; // More reliable than timestamp comparison
    console.log('[BILLING SERVICE] Was bill created in this call?', wasCreated);

    return { created: wasCreated, bill: doc };
  } catch (err) {
    console.error('[BILLING SERVICE] Error in ensureMonthlyInvoice:', err.message, 'code:', err.code);
    if (err.code === 11000) {
      console.log('[BILLING SERVICE] Duplicate key error, fetching existing bill...');
      const existing = await Billing.findOne({ vehicle: vehicle._id, transactionType: 'Rental', billingPeriod: period }).populate('client vehicle');
      return { created: false, bill: existing };
    }
    throw err;
  }
}

exports.listMonthly = async (period) => {
  const bills = await Billing
    .find({ billingPeriod: period, transactionType: 'Rental' })
    .populate('client', 'name')
    .populate({
      path: 'vehicle',
      select: 'chassisNumber brand purchaseDate monthlyFee owner',
      populate: { path: 'owner', select: 'name' }
    })
    .sort({ dueDate: 1 });
  return bills;
}

exports.monthKey = monthKey;

