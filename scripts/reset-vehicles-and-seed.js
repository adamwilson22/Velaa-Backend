require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Client = require('../src/models/Client');
const Vehicle = require('../src/models/Vehicle');
const Billing = require('../src/models/Billing');
const { ensureMonthlyInvoice } = require('../src/services/billingService');

function monthKey(d){
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

async function resetVehicles() {
  await connectDB();
  try {
    console.log('--- WARNING: Deleting all vehicles and their billing documents ---');
    const allVehicleIds = await Vehicle.find({}, '_id');
    const ids = allVehicleIds.map(v => v._id);
    if (ids.length) {
      await Billing.deleteMany({ vehicle: { $in: ids } });
      await Vehicle.deleteMany({ _id: { $in: ids } });
    }
    console.log(`Deleted vehicles: ${ids.length} | Deleted billing rows for those vehicles.`);

    const clients = await Client.find({ isActive: true }).sort({ createdAt: 1 }).limit(8);
    if (!clients.length) {
      console.log('No clients found. Aborting.');
      return;
    }

    const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    async function genVin() {
      while (true) {
        let vin = '';
        for (let i = 0; i < 17; i++) vin += VIN_CHARS[Math.floor(Math.random() * VIN_CHARS.length)];
        const exists = await Vehicle.exists({ chassisNumber: vin });
        if (!exists) return vin;
      }
    }

    const nowPeriod = monthKey(new Date());
    let createdVehicles = 0;
    let createdInvoices = 0;

    for (const c of clients) {
      for (let i = 0; i < 2; i++) { // two vehicles per client
        const vin = await genVin();
        const vehicle = await Vehicle.create({
          chassisNumber: vin,
          engineNumber: vin,
          owner: c._id,
          brand: ['Audi','Toyota','Mercedes-Benz','BMW','Honda'][Math.floor(Math.random()*5)],
          year: 2019 + Math.floor(Math.random()*6),
          color: ['Black','White','Silver','Grey','Blue'][Math.floor(Math.random()*5)],
          purchaseDate: new Date(),
          status: 'Available',
          isActive: true,
          monthlyFee: [6000,7000,8000,10000,15000][Math.floor(Math.random()*5)],
          mileage: Math.floor(Math.random()*60000),
        });
        createdVehicles++;
        try {
          const r = await ensureMonthlyInvoice(vehicle._id, nowPeriod, c._id);
          if (r && r.created) createdInvoices++;
        } catch (e) {
          console.log('[AUTO-INVOICE] error:', e.message);
        }
      }
    }

    console.log(`Created vehicles: ${createdVehicles}`);
    console.log(`Ensured current-month invoices: ${createdInvoices}`);
  } catch (e) {
    console.error('❌ Reset failed:', e.stack || e);
  } finally {
    await mongoose.connection.close();
  }
}

resetVehicles();


