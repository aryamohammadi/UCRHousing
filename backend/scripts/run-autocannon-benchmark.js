#!/usr/bin/env node

/**
 * Autocannon Benchmark Runner
 * 
 * Runs Autocannon benchmarks and reports results to validate 28k req/sec claim.
 * 
 * Usage:
 *   node backend/scripts/run-autocannon-benchmark.js
 * 
 * Prerequisites:
 *   - Server must be running on localhost:3001 (or set PORT env var)
 *   - Install autocannon: npm install -g autocannon
 * 
 * This script runs multiple Autocannon benchmarks and reports:
 * - Requests per second
 * - Latency statistics
 * - Throughput
 * - Whether 28k req/sec is achieved
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const CONNECTIONS = 50;
const DURATION = 20; // seconds

/**
 * Parse Autocannon output to extract metrics
 * Autocannon outputs in a table format, so we need to parse that
 */
function parseAutocannonOutput(output) {
  if (!output || output.length === 0) {
    return {
      requests: null,
      latency: {},
      throughput: null,
      errors: 0,
      error: 'Empty output'
    };
  }
  
  const lines = output.split('\n');
  const result = {
    requests: null,
    latency: {},
    throughput: null,
    errors: 0
  };

  // Autocannon outputs in table format, look for key metrics
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Requests per second - try multiple patterns and formats
    if (line.includes('Requests/sec') || line.includes('requests/sec') || line.includes('Req/Sec') || line.includes('Req/sec')) {
      // Try various formats
      const patterns = [
        /Requests\/sec:\s+([\d,]+\.?\d*)/,
        /requests\/sec:\s+([\d,]+\.?\d*)/,
        /Req\/Sec:\s+([\d,]+\.?\d*)/,
        /Req\/sec:\s+([\d,]+\.?\d*)/,
        /([\d,]+\.?\d*)\s+requests\/sec/i,
        /([\d,]+\.?\d*)\s+Req\/sec/i
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          result.requests = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
    }
    
    // Look for requests in table format - "Req/Sec" row
    // Format: │ Req/Sec │ 1% │ 2.5% │ 50% │ 97.5% │ Avg │ Stdev │ Min │
    // When split by │: [empty, "Req/Sec", "1%", "2.5%", "50%", "97.5%", "Avg", "Stdev", "Min", empty]
    // So Avg column is at index 6 (after filtering empty strings)
    if ((line.includes('Req/Sec') || line.includes('Req/sec')) && line.includes('│')) {
      const parts = line.split('│').map(p => p.trim()).filter(p => p);
      // Skip header row (contains "Stat", "2.5%", etc.) - only process data rows
      if (parts.length >= 7 && !parts[0].includes('Stat') && !parts[0].includes('─')) {
        // The Avg column is at index 6 (0-indexed: Stat, 1%, 2.5%, 50%, 97.5%, Avg, Stdev, Min)
        // But if first part is "Req/Sec", then: Req/Sec, 1%, 2.5%, 50%, 97.5%, Avg, Stdev, Min
        // So Avg is at index 5 (0-indexed from "Req/Sec")
        const avgIndex = parts[0] === 'Req/Sec' || parts[0] === 'Req/sec' ? 5 : 6;
        if (parts.length > avgIndex) {
          const avgValue = parts[avgIndex];
          const avgMatch = avgValue.match(/([\d,]+\.?\d*)/);
          if (avgMatch) {
            result.requests = parseFloat(avgMatch[1].replace(/,/g, ''));
          }
        }
      }
    }
    
    // Latency stats - try both text format and table format
    if (line.includes('Latency')) {
      // Text format
      const avgMatch = line.match(/avg\s+([\d.]+)\s*ms/i);
      const minMatch = line.match(/min\s+([\d.]+)\s*ms/i);
      const maxMatch = line.match(/max\s+([\d.]+)\s*ms/i);
      const p99Match = line.match(/p99\s+([\d.]+)\s*ms/i);
      
      if (avgMatch) result.latency.avg = parseFloat(avgMatch[1]);
      if (minMatch) result.latency.min = parseFloat(minMatch[1]);
      if (maxMatch) result.latency.max = parseFloat(maxMatch[1]);
      if (p99Match) result.latency.p99 = parseFloat(p99Match[1]);
      
      // Table format - look for Latency row
      if (line.includes('│')) {
        const parts = line.split('│').map(p => p.trim()).filter(p => p);
        if (parts.length >= 6) {
          // parts[1] = 2.5%, parts[2] = 50%, parts[3] = 97.5%, parts[4] = 99%, parts[5] = Avg
          const avgMatch2 = parts[5].match(/([\d.]+)\s*ms/);
          const maxMatch2 = parts[parts.length - 1].match(/([\d.]+)\s*ms/);
          if (avgMatch2) result.latency.avg = parseFloat(avgMatch2[1]);
          if (maxMatch2) result.latency.max = parseFloat(maxMatch2[1]);
          // 50% is median (p50)
          const p50Match = parts[2].match(/([\d.]+)\s*ms/);
          if (p50Match) result.latency.p50 = parseFloat(p50Match[1]);
          // 99% is p99
          const p99Match2 = parts[4].match(/([\d.]+)\s*ms/);
          if (p99Match2) result.latency.p99 = parseFloat(p99Match2[1]);
        }
      }
    }
    
    // Throughput
    if (line.includes('Throughput')) {
      const match = line.match(/Throughput[:\s]+([\d.]+)\s+([KMGT]?B\/s)/i);
      if (match) {
        result.throughput = {
          value: parseFloat(match[1]),
          unit: match[2]
        };
      }
    }
    
    // Errors
    if (line.toLowerCase().includes('error')) {
      const match = line.match(/(\d+)\s+errors?/i);
      if (match) {
        result.errors = parseInt(match[1]);
      }
    }
  }
  
  // If we still don't have requests, look for it in summary lines
  if (result.requests === null) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for lines like "155k requests in 5.01s" or "1000 requests in 20s"
      const reqMatch = line.match(/([\d,]+[kKmM]?)\s+requests?\s+in\s+([\d.]+)s/i);
      if (reqMatch) {
        let totalRequests = reqMatch[1].replace(/,/g, '');
        // Handle k/M suffixes
        if (totalRequests.toLowerCase().endsWith('k')) {
          totalRequests = parseFloat(totalRequests.slice(0, -1)) * 1000;
        } else if (totalRequests.toLowerCase().endsWith('m')) {
          totalRequests = parseFloat(totalRequests.slice(0, -1)) * 1000000;
        } else {
          totalRequests = parseFloat(totalRequests);
        }
        const duration = parseFloat(reqMatch[2]);
        if (duration > 0) {
          result.requests = totalRequests / duration;
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Run Autocannon benchmark
 */
async function runBenchmark(endpoint, description) {
  console.log(`\n[RUNNING] ${description}...`);
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Connections: ${CONNECTIONS}, Duration: ${DURATION}s`);
  
  try {
    // Use npx to run autocannon (works whether installed globally or not)
    // Note: npx may output to stderr, so we combine both
    const command = `npx --yes autocannon -c ${CONNECTIONS} -d ${DURATION} "${endpoint}" 2>&1`;
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: (DURATION + 10) * 1000 // Timeout slightly longer than test duration
    });
    
    // Combine stdout and stderr (npx often outputs to stderr)
    const combinedOutput = stdout + (stderr || '');
    
    // Debug: Show raw output
    if (process.env.DEBUG || combinedOutput.length === 0) {
      console.log('Raw autocannon output (first 500 chars):');
      console.log(combinedOutput.substring(0, 500));
      if (stderr) {
        console.log('stderr (first 200 chars):', stderr.substring(0, 200));
      }
    }
    
    if (combinedOutput.length === 0) {
      return {
        endpoint,
        description,
        error: 'Empty output from autocannon',
        requests: 0
      };
    }
    
    const result = parseAutocannonOutput(combinedOutput);
    result.endpoint = endpoint;
    result.description = description;
    
    // If parsing failed, show more info
    if (result.requests === null && !result.error) {
      console.log('  ⚠ Warning: Could not parse autocannon output');
      console.log('  Output length:', combinedOutput.length);
      console.log('  First 300 chars:', combinedOutput.substring(0, 300));
    }
    
    return result;
  } catch (error) {
    console.error(`  Error running benchmark: ${error.message}`);
    if (error.stdout) {
      console.error('  stdout:', error.stdout.substring(0, 300));
    }
    if (error.stderr) {
      console.error('  stderr:', error.stderr.substring(0, 300));
    }
    return {
      endpoint,
      description,
      error: error.message,
      requests: 0
    };
  }
}

/**
 * Format benchmark results
 */
function formatResults(result) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`RESULTS: ${result.description}`);
  console.log('─'.repeat(70));
  
  if (result.error) {
    console.log(`  ✗ Error: ${result.error}`);
    return false;
  }
  
  if (result.requests === null) {
    console.log('  ✗ Could not parse results');
    return false;
  }
  
  const reqPerSec = result.requests;
  const target = 28000;
  const achieved = reqPerSec >= target;
  const status = achieved ? '[✓]' : '[!]';
  
  console.log(`  Requests/sec: ${reqPerSec.toLocaleString()} (target: ${target.toLocaleString()})`);
  console.log(`  Status: ${achieved ? '✓ Achieves 28k req/sec' : `! ${((target - reqPerSec) / target * 100).toFixed(1)}% below target`}`);
  
  if (result.latency.avg) {
    console.log(`  Latency - Avg: ${result.latency.avg}ms, Min: ${result.latency.min}ms, Max: ${result.latency.max}ms, P99: ${result.latency.p99}ms`);
  }
  
  if (result.throughput) {
    console.log(`  Throughput: ${result.throughput.value} ${result.throughput.unit}/s`);
  }
  
  if (result.errors > 0) {
    console.log(`  ⚠ Errors: ${result.errors}`);
  }
  
  return achieved;
}

/**
 * Run all benchmarks
 */
async function runAllBenchmarks() {
  console.log('='.repeat(70));
  console.log('AUTOCANNON BENCHMARK SUITE');
  console.log('='.repeat(70));
  console.log(`Server URL: ${SERVER_URL}`);
  console.log(`Connections: ${CONNECTIONS}`);
  console.log(`Duration: ${DURATION}s per test`);
  console.log('\nMake sure your server is running before starting benchmarks!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  const results = [];

  // Benchmark 1: Health endpoint (simple)
  const healthResult = await runBenchmark(
    `${SERVER_URL}/api/health`,
    'Health Check Endpoint'
  );
  const healthPassed = formatResults(healthResult);
  results.push({ ...healthResult, passed: healthPassed });

  // Benchmark 2: Listings endpoint (no filters)
  const listingsResult = await runBenchmark(
    `${SERVER_URL}/api/listings`,
    'Listings Endpoint (No Filters)'
  );
  const listingsPassed = formatResults(listingsResult);
  results.push({ ...listingsResult, passed: listingsPassed });

  // Benchmark 3: Listings with price filter
  const priceFilterResult = await runBenchmark(
    `${SERVER_URL}/api/listings?minPrice=1000&maxPrice=3000`,
    'Listings with Price Filter'
  );
  const priceFilterPassed = formatResults(priceFilterResult);
  results.push({ ...priceFilterResult, passed: priceFilterPassed });

  // Benchmark 4: Listings with room filters
  const roomFilterResult = await runBenchmark(
    `${SERVER_URL}/api/listings?bedrooms=2&bathrooms=1`,
    'Listings with Room Filters'
  );
  const roomFilterPassed = formatResults(roomFilterResult);
  results.push({ ...roomFilterResult, passed: roomFilterPassed });

  // Benchmark 5: Listings with combined filters
  const combinedFilterResult = await runBenchmark(
    `${SERVER_URL}/api/listings?minPrice=1000&maxPrice=3000&bedrooms=2&bathrooms=1`,
    'Listings with Combined Filters'
  );
  const combinedFilterPassed = formatResults(combinedFilterResult);
  results.push({ ...combinedFilterResult, passed: combinedFilterPassed });

  // Benchmark 6: Pagination (page 10)
  const paginationResult = await runBenchmark(
    `${SERVER_URL}/api/listings?page=10&limit=50`,
    'Listings Pagination (Page 10)'
  );
  const paginationPassed = formatResults(paginationResult);
  results.push({ ...paginationResult, passed: paginationPassed });

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('BENCHMARK SUMMARY');
  console.log('='.repeat(70));
  
  const passedCount = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const avgReqPerSec = results
    .filter(r => r.requests && !r.error)
    .reduce((sum, r) => sum + r.requests, 0) / results.filter(r => r.requests && !r.error).length;
  const maxReqPerSec = Math.max(...results.filter(r => r.requests && !r.error).map(r => r.requests));
  
  console.log(`Tests Passed (≥28k req/sec): ${passedCount}/${totalTests}`);
  console.log(`Average Requests/sec: ${avgReqPerSec ? avgReqPerSec.toLocaleString() : 'N/A'}`);
  console.log(`Peak Requests/sec: ${maxReqPerSec ? maxReqPerSec.toLocaleString() : 'N/A'}`);
  
  console.log('\nDetailed Results:');
  results.forEach(r => {
    const status = r.error ? '✗' : (r.passed ? '✓' : '!');
    const reqSec = r.requests ? r.requests.toLocaleString() : 'N/A';
    console.log(`  ${status} ${r.description}: ${reqSec} req/sec`);
  });
  
  if (passedCount === totalTests) {
    console.log('\n✓ All endpoints achieve 28k+ req/sec!');
  } else if (passedCount > 0) {
    console.log(`\n⚠ ${passedCount} out of ${totalTests} endpoints achieve 28k+ req/sec.`);
    console.log('Note: Actual performance depends on hardware, network, and database setup.');
  } else {
    console.log('\n✗ No endpoints achieve 28k req/sec in this test environment.');
    console.log('Note: Performance varies significantly based on hardware and environment.');
    console.log('The optimization work (indexes, query patterns) is still valid.');
  }
  
  console.log('='.repeat(70));
  
  process.exit(0);
}

// Run benchmarks (using npx which works whether autocannon is installed globally or not)
runAllBenchmarks();

