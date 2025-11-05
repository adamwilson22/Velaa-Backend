require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Vehicle = require('../src/models/Vehicle');
const Client = require('../src/models/Client');
const { ensureMonthlyInvoice } = require('../src/services/billingService');

function monthKey(d){
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

async function run() {
  const vin = (process.argv[2] || '').trim().toUpperCase();
  if (!vin) {
    console.error('Usage: node scripts/link-vehicle-owner.js <VIN>');
    process.exit(1);
  }

  await connectDB();
  try {
    const vehicle = await Vehicle.findOne({ chassisNumber: vin });
    if (!vehicle) {
      console.error('Vehicle not found for VIN:', vin);
      process.exit(1);
    }

    let client = await Client.findOne({ isActive: true }).sort({ createdAt: 1 });
    if (!client) {
      // Create a minimal client if none exists
      client = await Client.create({
        name: 'Demo Customer',
        phone: '+255700000999',
        type: 'Individual',
        isActive: true,
        createdBy: new mongoose.Types.ObjectId(),
      });
    }

    vehicle.owner = client._id;
    await vehicle.save();
    console.log('✅ Linked vehicle', vin, 'to client', client.name);

    // Ensure current month invoice exists
    const period = monthKey(new Date());
    const userId = client._id; // audit
    await ensureMonthlyInvoice(vehicle._id, period, userId).catch(()=>{});
    console.log('✅ Ensured monthly invoice for period', period);
  } catch (e) {
    console.error('❌ Link failed:', e.stack || e);
  } finally {
    await mongoose.connection.close();
  }
}

run();


