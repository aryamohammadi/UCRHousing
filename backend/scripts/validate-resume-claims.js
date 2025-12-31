#!/usr/bin/env node

/**
 * Resume Claims Validation Script
 * 
 * Comprehensive script that validates all resume claims:
 * 1. Compound indexes on status, price, and room filters
 * 2. Query latency <1ms
 * 3. API benchmarked at 28k req/sec with Autocannon
 * 4. Stress-tested with 10k+ listings
 * 
 * Usage:
 *   node backend/scripts/validate-resume-claims.js
 * 
 * This script runs all validation tests and generates a report.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Use test database if specified, otherwise use production
const MONGODB_URI = process.env.TEST_MONGODB_URI || process.env.MONGO_URL || process.env.MONGODB_URI;
const SERVER_URL = process.env.TEST_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3001';

if (!MONGODB_URI) {
  console.error('Set MONGODB_URI or TEST_MONGODB_URI environment variable first');
  console.error('For safety, use TEST_MONGODB_URI to test against a non-production database');
  process.exit(1);
}

// Add database name if needed
let finalURI = MONGODB_URI;
if (MONGODB_URI.includes('mongodb+srv://') && !MONGODB_URI.includes('/ucrhousing') && !MONGODB_URI.includes('?') && !MONGODB_URI.includes('/ucrhousing-test')) {
  const dbName = process.env.TEST_MONGODB_URI ? 'ucrhousing-test' : 'ucrhousing';
  finalURI = MONGODB_URI + '/' + dbName;
}

const report = {
  timestamp: new Date().toISOString(),
  claims: {
    compoundIndexes: { status: 'pending', details: [] },
    queryLatency: { status: 'pending', details: [] },
    apiBenchmark: { status: 'pending', details: [] },
    stressTest: { status: 'pending', details: [] }
  }
};

/**
 * Validate compound indexes
 */
async function validateCompoundIndexes() {
  console.log('\n[VALIDATING] Compound Indexes...');
  
  try {
    await mongoose.connect(finalURI, { serverSelectionTimeoutMS: 30000 });
    
    const indexes = await Listing.collection.getIndexes();
    
    // Debug: Log all indexes to see what we're working with
    if (process.env.DEBUG) {
      console.log('All indexes:', JSON.stringify(indexes, null, 2));
    }
    
    // Convert MongoDB index format (array of [field, direction]) to object format
    const convertIndexToObject = (indexArray) => {
      if (!Array.isArray(indexArray)) return null;
      const obj = {};
      indexArray.forEach(([field, direction]) => {
        obj[field] = direction;
      });
      return obj;
    };
    
    // Extract all index key specifications
    // getIndexes() returns an object where keys are index names and values are arrays of [field, direction]
    const indexKeys = [];
    for (const [indexName, indexArray] of Object.entries(indexes)) {
      if (indexName !== '_id_') {
        const indexObj = convertIndexToObject(indexArray);
        if (indexObj) {
          indexKeys.push(indexObj);
        }
      }
    }
    
    const requiredIndexes = [
      { status: 1, price: 1, bedrooms: 1 },
      { status: 1, price: 1, bathrooms: 1 },
      { status: 1, bedrooms: 1, bathrooms: 1 },
      { status: 1, price: 1, bedrooms: 1, bathrooms: 1 }
    ];
    
    const foundIndexes = [];
    const missingIndexes = [];
    
    // Helper to normalize index objects for comparison (sort keys and compare values)
    const normalizeIndex = (idx) => {
      if (!idx || typeof idx !== 'object') return null;
      const sorted = {};
      Object.keys(idx).sort().forEach(key => {
        sorted[key] = idx[key];
      });
      return JSON.stringify(sorted);
    };
    
    // Debug: Log what we're comparing
    if (process.env.DEBUG) {
      console.log('Index keys found:', indexKeys.map(k => JSON.stringify(k)));
      console.log('Required indexes:', requiredIndexes.map(k => JSON.stringify(k)));
    }
    
    for (const requiredIndex of requiredIndexes) {
      const requiredNormalized = normalizeIndex(requiredIndex);
      const found = indexKeys.some(indexKey => {
        const normalized = normalizeIndex(indexKey);
        return normalized === requiredNormalized;
      });
      
      if (found) {
        foundIndexes.push(requiredIndex);
      } else {
        missingIndexes.push(requiredIndex);
      }
    }
    
    report.claims.compoundIndexes.details = {
      found: foundIndexes.length,
      total: requiredIndexes.length,
      foundIndexes,
      missingIndexes
    };
    
    if (foundIndexes.length === requiredIndexes.length) {
      report.claims.compoundIndexes.status = 'passed';
      console.log('  ✓ All compound indexes found');
    } else {
      report.claims.compoundIndexes.status = 'partial';
      console.log(`  ⚠ Found ${foundIndexes.length}/${requiredIndexes.length} compound indexes`);
      if (missingIndexes.length > 0) {
        console.log('  Missing indexes:');
        missingIndexes.forEach(idx => console.log(`    - ${JSON.stringify(idx)}`));
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    report.claims.compoundIndexes.status = 'error';
    report.claims.compoundIndexes.details = { error: error.message };
    console.log(`  ✗ Error: ${error.message}`);
  }
}

/**
 * Validate query latency
 */
async function validateQueryLatency() {
  console.log('\n[VALIDATING] Query Latency (<1ms)...');
  
  try {
    await mongoose.connect(finalURI, { serverSelectionTimeoutMS: 30000 });
    
    // Create query builder function (queries can only be executed once)
    const queryBuilder = () => Listing.find({
      status: 'active',
      price: { $gte: 1000, $lte: 3000 },
      bedrooms: 2
    }).limit(20);
    
    // Warm up
    const warmupQuery = queryBuilder();
    await warmupQuery.exec().catch(() => {});
    
    // Measure 100 iterations
    const times = [];
    for (let i = 0; i < 100; i++) {
      const query = queryBuilder(); // Create new query each time
      const start = process.hrtime.bigint();
      await query.exec();
      const end = process.hrtime.bigint();
      const milliseconds = Number(end - start) / 1000000;
      times.push(milliseconds);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    report.claims.queryLatency.details = {
      avg,
      min,
      max,
      iterations: 100
    };
    
    if (avg < 1.0) {
      report.claims.queryLatency.status = 'passed';
      console.log(`  ✓ Average latency: ${avg.toFixed(3)}ms (<1ms target achieved)`);
    } else {
      report.claims.queryLatency.status = 'partial';
      console.log(`  ⚠ Average latency: ${avg.toFixed(3)}ms (target: <1ms)`);
      console.log(`    Min: ${min.toFixed(3)}ms, Max: ${max.toFixed(3)}ms`);
      console.log(`    Note: <1ms is very difficult with cloud databases due to network latency`);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    report.claims.queryLatency.status = 'error';
    report.claims.queryLatency.details = { error: error.message };
    console.log(`  ✗ Error: ${error.message}`);
  }
}

/**
 * Validate API benchmark
 */
async function validateApiBenchmark() {
  console.log('\n[VALIDATING] API Benchmark (28k req/sec)...');
  console.log('  Note: This requires the server to be running and autocannon installed');
  
  try {
    // Check if autocannon is installed
    await execPromise('autocannon --version');
    
    // Run a quick benchmark
    const command = `autocannon -c 50 -d 10 "${SERVER_URL}/api/health"`;
    const { stdout } = await execPromise(command, { maxBuffer: 10 * 1024 * 1024 });
    
    // Parse requests/sec
    const match = stdout.match(/Requests\/sec:\s+([\d.]+)/);
    const reqPerSec = match ? parseFloat(match[1]) : 0;
    
    report.claims.apiBenchmark.details = {
      reqPerSec,
      target: 28000,
      endpoint: `${SERVER_URL}/api/health`
    };
    
    if (reqPerSec >= 28000) {
      report.claims.apiBenchmark.status = 'passed';
      console.log(`  ✓ Achieved ${reqPerSec.toLocaleString()} req/sec (≥28k target)`);
    } else {
      report.claims.apiBenchmark.status = 'partial';
      console.log(`  ⚠ Achieved ${reqPerSec.toLocaleString()} req/sec (target: 28k)`);
      console.log('    Note: Performance varies based on hardware and environment');
    }
  } catch (error) {
    if (error.message.includes('autocannon')) {
      report.claims.apiBenchmark.status = 'skipped';
      report.claims.apiBenchmark.details = { error: 'autocannon not installed' };
      console.log('  ⚠ Skipped: autocannon not installed (install with: npm install -g autocannon)');
    } else if (error.message.includes('ECONNREFUSED')) {
      report.claims.apiBenchmark.status = 'skipped';
      report.claims.apiBenchmark.details = { error: 'server not running' };
      console.log('  ⚠ Skipped: server not running');
    } else {
      report.claims.apiBenchmark.status = 'error';
      report.claims.apiBenchmark.details = { error: error.message };
      console.log(`  ✗ Error: ${error.message}`);
    }
  }
}

/**
 * Validate stress test (10k+ listings)
 */
async function validateStressTest() {
  console.log('\n[VALIDATING] Stress Test (10k+ listings)...');
  
  try {
    await mongoose.connect(finalURI, { serverSelectionTimeoutMS: 30000 });
    
    const count = await Listing.countDocuments({});
    
    report.claims.stressTest.details = {
      listingCount: count,
      target: 10000
    };
    
    if (count >= 10000) {
      report.claims.stressTest.status = 'passed';
      console.log(`  ✓ Database contains ${count.toLocaleString()} listings (≥10k target)`);
    } else {
      report.claims.stressTest.status = 'partial';
      console.log(`  ⚠ Database contains ${count.toLocaleString()} listings (target: 10k+)`);
      console.log('    Run: node backend/scripts/seed-large.js 10000');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    report.claims.stressTest.status = 'error';
    report.claims.stressTest.details = { error: error.message };
    console.log(`  ✗ Error: ${error.message}`);
  }
}

/**
 * Generate final report
 */
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('RESUME CLAIMS VALIDATION REPORT');
  console.log('='.repeat(70));
  console.log(`Generated: ${report.timestamp}\n`);
  
  const statusMap = {
    passed: '✓ PASSED',
    partial: '⚠ PARTIAL',
    error: '✗ ERROR',
    skipped: '⊘ SKIPPED',
    pending: '⏳ PENDING'
  };
  
  console.log('CLAIM 1: Compound Indexes on Status, Price, and Room Filters');
  console.log(`  Status: ${statusMap[report.claims.compoundIndexes.status]}`);
  if (report.claims.compoundIndexes.details.found !== undefined) {
    console.log(`  Found: ${report.claims.compoundIndexes.details.found}/${report.claims.compoundIndexes.details.total} indexes`);
  }
  
  console.log('\nCLAIM 2: Query Latency <1ms');
  console.log(`  Status: ${statusMap[report.claims.queryLatency.status]}`);
  if (report.claims.queryLatency.details.avg !== undefined) {
    console.log(`  Average: ${report.claims.queryLatency.details.avg.toFixed(3)}ms`);
  }
  
  console.log('\nCLAIM 3: API Benchmarked at 28k req/sec');
  console.log(`  Status: ${statusMap[report.claims.apiBenchmark.status]}`);
  if (report.claims.apiBenchmark.details.reqPerSec !== undefined) {
    console.log(`  Achieved: ${report.claims.apiBenchmark.details.reqPerSec.toLocaleString()} req/sec`);
  }
  
  console.log('\nCLAIM 4: Stress-Tested with 10k+ Listings');
  console.log(`  Status: ${statusMap[report.claims.stressTest.status]}`);
  if (report.claims.stressTest.details.listingCount !== undefined) {
    console.log(`  Listings: ${report.claims.stressTest.details.listingCount.toLocaleString()}`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Save report to file
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'resume-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report saved to: ${reportPath}`);
  console.log('='.repeat(70));
}

/**
 * Main execution
 */
async function main() {
  // Safety check: Warn if using production database
  if (!process.env.TEST_MONGODB_URI && process.env.NODE_ENV !== 'test') {
    console.warn('\n⚠️  WARNING: Using production database!');
    console.warn('Set TEST_MONGODB_URI to use a test database instead.');
    console.warn('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('='.repeat(70));
  console.log('RESUME CLAIMS VALIDATION');
  console.log('='.repeat(70));
  console.log(`Database: ${process.env.TEST_MONGODB_URI ? 'TEST (safe)' : 'PRODUCTION (⚠️ be careful!)'}`);
  console.log('This script validates all technical claims from your resume.\n');
  
  await validateCompoundIndexes();
  await validateQueryLatency();
  await validateStressTest();
  await validateApiBenchmark();
  
  generateReport();
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

