#!/usr/bin/env node

/**
 * Script to drop the email index from MongoDB
 * This fixes the E11000 duplicate key error on email field
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function dropEmailIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List current indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (${index.name})`);
    });

    // Check if email index exists
    const emailIndexExists = indexes.some(index => index.key.email === 1);
    
    if (emailIndexExists) {
      console.log('\n🗑️  Dropping email index...');
      await collection.dropIndex('email_1');
      console.log('✅ Email index dropped successfully');
    } else {
      console.log('\n✅ Email index does not exist - nothing to drop');
    }

    // List indexes after deletion
    console.log('\n📋 Indexes after cleanup:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (${index.name})`);
    });

    console.log('\n🎉 Email index cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
dropEmailIndex();
