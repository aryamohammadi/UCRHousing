#!/usr/bin/env node

/**
 * Query Latency Measurement Script
 * 
 * Measures query execution time for filtered searches to validate <1ms claim.
 * 
 * Usage:
 *   node backend/scripts/measure-latency.js
 * 
 * This script runs multiple query patterns and measures their execution time,
 * reporting average, min, max, and whether queries achieve <1ms latency.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

// Use test database if specified, otherwise use production
const MONGODB_URI = process.env.TEST_MONGODB_URI || process.env.MONGO_URL || process.env.MONGODB_URI;

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

/**
 * Measure query execution time
 * Note: query should be a function that returns a new query object each time
 */
async function measureQuery(queryBuilder, iterations = 100) {
  const times = [];
  
  // Warm up (first query is usually slower)
  const warmupQuery = queryBuilder();
  await warmupQuery.exec().catch(() => {});
  
  for (let i = 0; i < iterations; i++) {
    // Create a new query for each iteration (queries can only be executed once)
    const query = queryBuilder();
    const start = process.hrtime.bigint();
    await query.exec();
    const end = process.hrtime.bigint();
    const nanoseconds = Number(end - start);
    const milliseconds = nanoseconds / 1000000;
    times.push(milliseconds);
  }
  
  return {
    times,
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    p50: times.sort((a, b) => a - b)[Math.floor(times.length * 0.5)],
    p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)],
    p99: times.sort((a, b) => a - b)[Math.floor(times.length * 0.99)]
  };
}

/**
 * Format latency results
 */
function formatLatency(stats, queryName) {
  const under1ms = stats.avg < 1.0;
  const status = under1ms ? '[✓]' : '[!]';
  
  console.log(`\n${status} ${queryName}`);
  console.log('─'.repeat(60));
  console.log(`  Average: ${stats.avg.toFixed(3)}ms`);
  console.log(`  Min:     ${stats.min.toFixed(3)}ms`);
  console.log(`  Max:     ${stats.max.toFixed(3)}ms`);
  console.log(`  P50:     ${stats.p50.toFixed(3)}ms`);
  console.log(`  P95:     ${stats.p95.toFixed(3)}ms`);
  console.log(`  P99:     ${stats.p99.toFixed(3)}ms`);
  
  if (under1ms) {
    console.log(`  Status:  ✓ Achieves <1ms average latency`);
  } else {
    console.log(`  Status:  Average latency is ${stats.avg.toFixed(3)}ms (target: <1ms)`);
  }
  
  return under1ms;
}

/**
 * Run all latency measurements
 */
async function runLatencyTests() {
  try {
    // Safety check: Warn if using production database
    if (!process.env.TEST_MONGODB_URI && process.env.NODE_ENV !== 'test') {
      console.warn('\n⚠️  WARNING: Using production database!');
      console.warn('Set TEST_MONGODB_URI to use a test database instead.');
      console.warn('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('Connecting to MongoDB...');
    console.log(`Database: ${process.env.TEST_MONGODB_URI ? 'TEST (safe)' : 'PRODUCTION (⚠️ be careful!)'}`);
    await mongoose.connect(finalURI, { 
      serverSelectionTimeoutMS: 30000
    });
    console.log('Connected to MongoDB\n');

    // Get total document count
    const totalDocs = await Listing.countDocuments({});
    console.log(`Total listings in database: ${totalDocs}`);
    console.log('='.repeat(70));
    console.log('Running latency measurements (100 iterations each)...\n');

    const results = [];

    // Test 1: Status + Price filter
    console.log('[TEST 1] Status + Price filter...');
    const queryBuilder1 = () => Listing.find({
      status: 'active',
      price: { $gte: 1000, $lte: 3000 }
    }).limit(20);
    const stats1 = await measureQuery(queryBuilder1, 100);
    const passed1 = formatLatency(stats1, 'Status + Price Filter');
    results.push({ name: 'Status + Price Filter', passed: passed1, avg: stats1.avg });

    // Test 2: Status + Price + Bedrooms filter
    console.log('[TEST 2] Status + Price + Bedrooms filter...');
    const queryBuilder2 = () => Listing.find({
      status: 'active',
      price: { $gte: 1000, $lte: 3000 },
      bedrooms: 2
    }).limit(20);
    const stats2 = await measureQuery(queryBuilder2, 100);
    const passed2 = formatLatency(stats2, 'Status + Price + Bedrooms Filter');
    results.push({ name: 'Status + Price + Bedrooms Filter', passed: passed2, avg: stats2.avg });

    // Test 3: Status + Price + Bedrooms + Bathrooms filter
    console.log('[TEST 3] Status + Price + Bedrooms + Bathrooms filter...');
    const queryBuilder3 = () => Listing.find({
      status: 'active',
      price: { $gte: 1000, $lte: 3000 },
      bedrooms: 2,
      bathrooms: { $gte: 1 }
    }).limit(20);
    const stats3 = await measureQuery(queryBuilder3, 100);
    const passed3 = formatLatency(stats3, 'Status + Price + Bedrooms + Bathrooms Filter');
    results.push({ name: 'Status + Price + Bedrooms + Bathrooms Filter', passed: passed3, avg: stats3.avg });

    // Test 4: Status + Bedrooms filter
    console.log('[TEST 4] Status + Bedrooms filter...');
    const queryBuilder4 = () => Listing.find({
      status: 'active',
      bedrooms: { $gte: 2 }
    }).limit(20);
    const stats4 = await measureQuery(queryBuilder4, 100);
    const passed4 = formatLatency(stats4, 'Status + Bedrooms Filter');
    results.push({ name: 'Status + Bedrooms Filter', passed: passed4, avg: stats4.avg });

    // Test 5: Status + Bathrooms filter
    console.log('[TEST 5] Status + Bathrooms filter...');
    const queryBuilder5 = () => Listing.find({
      status: 'active',
      bathrooms: { $gte: 1 }
    }).limit(20);
    const stats5 = await measureQuery(queryBuilder5, 100);
    const passed5 = formatLatency(stats5, 'Status + Bathrooms Filter');
    results.push({ name: 'Status + Bathrooms Filter', passed: passed5, avg: stats5.avg });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('LATENCY MEASUREMENT SUMMARY');
    console.log('='.repeat(70));
    
    const passedCount = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const avgLatency = results.reduce((sum, r) => sum + r.avg, 0) / results.length;
    
    console.log(`Tests Passed (<1ms): ${passedCount}/${totalTests}`);
    console.log(`Overall Average Latency: ${avgLatency.toFixed(3)}ms`);
    console.log('\nDetailed Results:');
    results.forEach(r => {
      const status = r.passed ? '✓' : '✗';
      console.log(`  ${status} ${r.name}: ${r.avg.toFixed(3)}ms`);
    });
    
    if (passedCount === totalTests) {
      console.log('\n✓ All queries achieve <1ms average latency!');
    } else if (passedCount > 0) {
      console.log(`\n⚠ ${passedCount} out of ${totalTests} queries achieve <1ms average latency.`);
    } else {
      console.log('\n✗ No queries achieve <1ms average latency. Consider optimizing indexes or query patterns.');
    }
    
    console.log('='.repeat(70));

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\nError running latency tests:', error);
    console.error('Error stack:', error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run tests
runLatencyTests();

