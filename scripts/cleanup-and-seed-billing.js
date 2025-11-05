require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Client = require('../src/models/Client');
const Vehicle = require('../src/models/Vehicle');
const Billing = require('../src/models/Billing');
const billingService = require('../src/services/billingService');

function monthKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function removeDuplicateClients() {
  const dups = await Client.aggregate([
    { $group: { _id: '$phone', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  let removed = 0;
  for (const g of dups) {
    const ids = g.ids.map(id => id.toString());
    const keep = ids[0];
    const del = ids.slice(1);
    if (del.length) {
      await Client.deleteMany({ _id: { $in: del } });
      removed += del.length;
    }
    console.log(`[CLEANUP][CLIENT] keep ${keep}, removed ${del.join(',')}`);
  }
  return removed;
}

async function removeDuplicateVehicles() {
  const dups = await Vehicle.aggregate([
    { $group: { _id: '$chassisNumber', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  let removed = 0;
  for (const g of dups) {
    const ids = g.ids.map(id => id.toString());
    const keep = ids[0];
    const del = ids.slice(1);
    if (del.length) {
      await Vehicle.deleteMany({ _id: { $in: del } });
      removed += del.length;
    }
    console.log(`[CLEANUP][VEHICLE] keep ${keep}, removed ${del.join(',')}`);
  }
  return removed;
}

async function ensureSampleVehicles() {
  const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  async function genVin() {
    while (true) {
      let vin = '';
      for (let i = 0; i < 17; i++) vin += VIN_CHARS[Math.floor(Math.random() * VIN_CHARS.length)];
      const exists = await Vehicle.exists({ chassisNumber: vin });
      if (!exists) return vin;
    }
  }
  const clients = await Client.find({}).limit(5);
  if (clients.length === 0) return 0;
  let created = 0;
  for (const c of clients) {
    const count = await Vehicle.countDocuments({ owner: c._id });
    const need = Math.max(0, 2 - count); // ensure at least 2 vehicles per client
    for (let i = 0; i < need; i++) {
      const vin = await genVin();
      await Vehicle.create({
        chassisNumber: vin,
        engineNumber: vin,
        owner: c._id,
        brand: ['Audi', 'Toyota', 'Mercedes-Benz', 'BMW', 'Honda'][Math.floor(Math.random()*5)],
        year: 2018 + Math.floor(Math.random()*7),
        color: ['Black','White','Silver','Grey','Blue'][Math.floor(Math.random()*5)],
        purchaseDate: new Date(),
        status: 'Available',
        isActive: true,
        monthlyFee: [6000, 7000, 8000, 10000, 15000][Math.floor(Math.random()*5)],
        mileage: Math.floor(Math.random()*60000),
      });
      created++;
    }
  }
  return created;
}

async function seedMonthlyBills(monthsBack = 2) {
  const vehicles = await Vehicle.find({ isActive: true, status: { $ne: 'Sold' }, monthlyFee: { $gt: 0 } }, '_id owner').lean();
  const now = new Date();
  let created = 0;
  const userId = (vehicles[0] && vehicles[0].owner) || new mongoose.Types.ObjectId();
  for (const v of vehicles) {
    for (let k = 0; k <= monthsBack; k++) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      const period = monthKey(d);
      try {
        const r = await billingService.ensureMonthlyInvoice(v._id, period, userId);
        if (r && r.created) created++;
      } catch (e) {
        console.log('[SEED][BILLING] ensure error:', e.message);
      }
    }
  }
  return created;
}

async function run() {
  await connectDB();
  try {
    console.log('--- CLEANUP START ---');
    const cr = await removeDuplicateClients();
    const vr = await removeDuplicateVehicles();
    console.log(`Removed duplicates -> clients: ${cr}, vehicles: ${vr}`);

    console.log('--- ENSURE SAMPLE VEHICLES ---');
    const vc = await ensureSampleVehicles();
    console.log(`Created sample vehicles: ${vc}`);

    console.log('--- SEED MONTHLY BILLS (this + last 2 months) ---');
    const bc = await seedMonthlyBills(2);
    console.log(`Monthly invoices created: ${bc}`);
  } catch (e) {
    console.error('❌ Cleanup/Seed failed:', e.stack || e);
  } finally {
    await mongoose.connection.close();
  }
}

run();


