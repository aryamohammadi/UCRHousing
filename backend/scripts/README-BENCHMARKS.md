# Resume Claims Validation Scripts

This directory contains scripts to validate and benchmark the technical claims from your resume.

## Prerequisites

1. **Database**: MongoDB must be running and accessible
2. **Server**: For API benchmarks, the server must be running on `localhost:3001` (or set `SERVER_URL` env var)
3. **Autocannon**: For API benchmarks, install globally:
   ```bash
   npm install -g autocannon
   ```

## Scripts

### 1. `validate-resume-claims.js` - Comprehensive Validation

Runs all validation tests and generates a report.

```bash
node scripts/validate-resume-claims.js
```

**What it validates:**
- ✓ Compound indexes on status, price, and room filters
- ✓ Query latency <1ms
- ✓ API benchmarked at 28k req/sec
- ✓ Stress-tested with 10k+ listings

**Output:** Generates `resume-validation-report.json` with detailed results.

---

### 2. `measure-latency.js` - Query Latency Measurement

Measures query execution time for filtered searches.

```bash
node scripts/measure-latency.js
```

**What it does:**
- Runs 100 iterations of each query pattern
- Measures average, min, max, P50, P95, P99 latencies
- Tests multiple filter combinations (status, price, bedrooms, bathrooms)
- Reports whether queries achieve <1ms average latency

**Use case:** Validate the "reduced query latency to <1ms" claim.

---

### 3. `run-autocannon-benchmark.js` - API Performance Benchmark

Runs Autocannon benchmarks on multiple endpoints.

```bash
# Make sure server is running first!
npm run dev  # or start your server

# In another terminal:
node scripts/run-autocannon-benchmark.js
```

**What it does:**
- Benchmarks 6 different endpoints:
  - Health check
  - Listings (no filters)
  - Listings with price filter
  - Listings with room filters
  - Listings with combined filters
  - Pagination (page 10)
- Reports requests/sec, latency, throughput
- Validates 28k req/sec claim

**Configuration:**
- Default: 50 connections, 20 seconds per test
- Set `SERVER_URL` env var to change server URL

**Use case:** Validate the "benchmarked API at 28k req/sec" claim.

---

### 4. `seed-large.js` - Generate Test Data

Generates large datasets for stress testing.

```bash
node scripts/seed-large.js 10000
```

**What it does:**
- Generates N fake listings with realistic data
- Inserts in batches of 500 for efficiency
- Creates admin landlord if needed
- Reports insertion throughput

**Use case:** Create 10k+ listings for stress testing.

---

## Quick Start Guide

### Step 1: Add Compound Indexes

The indexes are already added to `models/Listing.js`. If you need to recreate them:

```bash
# The indexes are defined in the model and will be created automatically
# when you connect to the database. To force recreation:
node -e "require('./models/Listing'); require('mongoose').connect(process.env.MONGODB_URI).then(() => process.exit())"
```

### Step 2: Generate Test Data (10k+ listings)

```bash
node scripts/seed-large.js 10000
```

### Step 3: Measure Query Latency

```bash
node scripts/measure-latency.js
```

### Step 4: Benchmark API (requires running server)

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run benchmark
node scripts/run-autocannon-benchmark.js
```

### Step 5: Run Full Validation

```bash
node scripts/validate-resume-claims.js
```

This runs all tests and generates a comprehensive report.

---

## Interpreting Results

### Query Latency

- **<1ms average**: ✓ Claim validated
- **1-5ms average**: ⚠ Close, but may need optimization
- **>5ms average**: ✗ Needs optimization (check indexes, query patterns)

### API Benchmark

- **≥28k req/sec**: ✓ Claim validated
- **20k-28k req/sec**: ⚠ Good performance, but below target
- **<20k req/sec**: ✗ May need optimization or better hardware

**Note:** Actual performance depends heavily on:
- Hardware (CPU, RAM, network)
- Database location (local vs cloud)
- Network latency
- Current system load

### Stress Test

- **≥10k listings**: ✓ Claim validated
- **<10k listings**: Run `seed-large.js` to generate more

---

## Tips for Best Results

1. **Run benchmarks on production-like hardware** for accurate numbers
2. **Warm up the database** before measuring (first query is usually slower)
3. **Close other applications** to reduce system load
4. **Use local database** for latency tests (cloud adds network latency)
5. **Run multiple times** and average results for consistency

---

## Resume Claims Reference

Your resume claims:
- ✓ "Reduced query latency to <1ms by adding compound indexes on status, price, and room filters"
- ✓ "Benchmarked API at 28k req/sec with Autocannon"
- ✓ "Stress-tested search and pagination with 10k+ listings"

These scripts help you validate and measure these claims.

---

## Troubleshooting

**"autocannon: command not found"**
```bash
npm install -g autocannon
```

**"Server not running"**
```bash
# Start your server first
npm run dev
```

**"Database connection failed"**
- Check your `.env` file has `MONGODB_URI` or `MONGO_URL` set
- Ensure MongoDB is running and accessible

**"No listings found"**
```bash
# Generate test data
node scripts/seed-large.js 10000
```

