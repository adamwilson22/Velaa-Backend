require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Client = require('../src/models/Client');
const Vehicle = require('../src/models/Vehicle');
const Billing = require('../src/models/Billing');
const { ensureMonthlyInvoice, monthKey } = require('../src/services/billingService');

async function up() {
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Create sample clients
    // For audit fields that are required
    const dummyUserId = new mongoose.Types.ObjectId();
    const clients = await Client.create([
      { name: 'Ryan Dynamite', phone: '+255700000001', type: 'Individual', isActive: true, createdBy: dummyUserId },
      { name: 'Elite Motors Group', phone: '+255700000002', type: 'Company', isActive: true, createdBy: dummyUserId },
    ]);

    // Helpers to create unique 17-char VIN (A-HJ-NPR-Z0-9)
    const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    async function genUniqueVin() {
      while(true){
        let vin = '';
        for (let i=0;i<17;i++) vin += VIN_CHARS[Math.floor(Math.random()*VIN_CHARS.length)];
        const exists = await Vehicle.exists({ chassisNumber: vin });
        if (!exists) return vin;
      }
    }

    async function createVehicle(owner, brand, year, color, monthlyFee, status='Available'){
      const vin = await genUniqueVin();
      return Vehicle.create({
        chassisNumber: vin,
        engineNumber: vin,
        owner,
        brand,
        year,
        color,
        purchaseDate: new Date(),
        status,
        isActive: true,
        marketValue: 40000,
        monthlyFee,
        mileage: Math.floor(Math.random()*50000),
        showInMarketplace: Math.random() > 0.5,
      });
    }

    const vehicles = [];
    vehicles.push(await createVehicle(clients[0]._id, 'Audi', 2024, 'Black', 10000, 'Available'));
    vehicles.push(await createVehicle(clients[1]._id, 'Mercedes-Benz', 2023, 'Silver', 15000, 'Available'));
    vehicles.push(await createVehicle(clients[0]._id, 'Honda', 2022, 'White', 7000, 'Reserved'));

    const period = monthKey(new Date());
    const userId = dummyUserId; // use dummy for createdBy/updatedBy

    // Ensure monthly invoices
    for (const v of vehicles) {
      await ensureMonthlyInvoice(v._id, period, userId);
    }

    await session.commitTransaction();
    console.log('✅ Seeded clients, vehicles, and monthly invoices for', period);
  } catch (e) {
    await session.abortTransaction();
    console.error('❌ Seed failed:', e.message);
  } finally {
    session.endSession();
    await mongoose.connection.close();
  }
}

up();


