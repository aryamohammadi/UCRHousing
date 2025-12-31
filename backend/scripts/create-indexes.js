#!/usr/bin/env node

/**
 * Create Compound Indexes Script
 * 
 * Manually creates the compound indexes defined in the Listing model.
 * 
 * Usage:
 *   node scripts/create-indexes.js
 * 
 * This script creates the compound indexes that optimize query performance.
 * Indexes are defined in models/Listing.js but need to be created in the database.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const MONGODB_URI = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Set MONGODB_URI environment variable first');
  process.exit(1);
}

// Add database name if needed
let finalURI = MONGODB_URI;
if (MONGODB_URI.includes('mongodb+srv://') && !MONGODB_URI.includes('/ucrhousing') && !MONGODB_URI.includes('?')) {
  finalURI = MONGODB_URI + '/ucrhousing';
}

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(finalURI, { 
      serverSelectionTimeoutMS: 30000
    });
    console.log('Connected to MongoDB\n');
    
    console.log('Creating compound indexes...');
    console.log('This may take a few minutes if you have many listings.\n');
    
    const indexes = [
      { status: 1, price: 1, bedrooms: 1 },
      { status: 1, price: 1, bathrooms: 1 },
      { status: 1, bedrooms: 1, bathrooms: 1 },
      { status: 1, price: 1, bedrooms: 1, bathrooms: 1 }
    ];
    
    const results = [];
    
    for (const indexSpec of indexes) {
      const indexName = Object.keys(indexSpec).join('_') + '_' + Object.values(indexSpec).join('_');
      console.log(`Creating index: ${JSON.stringify(indexSpec)}...`);
      
      const startTime = Date.now();
      try {
        await Listing.collection.createIndex(indexSpec, { background: true });
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`  ✓ Created in ${duration}s`);
        results.push({ index: indexSpec, status: 'created', duration });
      } catch (error) {
        if (error.code === 85) {
          // Index already exists
          console.log(`  ⊘ Already exists`);
          results.push({ index: indexSpec, status: 'exists' });
        } else {
          console.log(`  ✗ Error: ${error.message}`);
          results.push({ index: indexSpec, status: 'error', error: error.message });
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('INDEX CREATION SUMMARY');
    console.log('='.repeat(70));
    
    const created = results.filter(r => r.status === 'created').length;
    const exists = results.filter(r => r.status === 'exists').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`Created: ${created}`);
    console.log(`Already exists: ${exists}`);
    console.log(`Errors: ${errors}`);
    
    if (created > 0) {
      console.log('\n✓ Indexes created successfully!');
      console.log('These indexes will improve query performance for filtered searches.');
    } else if (exists === indexes.length) {
      console.log('\n✓ All indexes already exist.');
    }
    
    console.log('='.repeat(70));
    
    // List all indexes
    console.log('\nCurrent indexes on listings collection:');
    const allIndexes = await Listing.collection.getIndexes();
    Object.keys(allIndexes).forEach(name => {
      const index = allIndexes[name];
      console.log(`  - ${name}: ${JSON.stringify(index.key)}`);
    });
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\nError creating indexes:', error);
    console.error('Error stack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run
createIndexes();

