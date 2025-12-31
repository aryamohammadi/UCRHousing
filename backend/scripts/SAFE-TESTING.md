# Safe Testing Guide

## ⚠️ Important: Testing Without Affecting Production

This guide explains how to run benchmarks and tests **safely** without affecting your production website.

---

## 1. About Indexes

### Do indexes mess up the database?

**No!** Indexes actually **improve** database performance. They:
- ✅ Make queries faster
- ✅ Reduce database load
- ✅ Improve user experience

### When to be careful:

- **Creating indexes on large production databases** can take time (minutes to hours)
- During index creation, the database may be slightly slower
- Once created, indexes improve performance permanently

### Safe approach:

1. **Test indexes locally first** (see below)
2. **Create indexes during low-traffic hours** if adding to production
3. **Monitor database performance** during index creation

---

## 2. Setting Up a Test Database

### Option A: Use a Separate Test Database (Recommended)

Create a separate MongoDB database for testing:

```bash
# In your .env file, add:
TEST_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ucrhousing-test
TEST_SERVER_URL=http://localhost:3001
```

**Benefits:**
- ✅ Completely isolated from production
- ✅ Can generate 10k+ test listings without affecting real data
- ✅ Can run benchmarks without impacting real users
- ✅ Safe to experiment with indexes

### Option B: Use Local MongoDB

Install MongoDB locally and use it for testing:

```bash
# Install MongoDB locally (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# In your .env file:
TEST_MONGODB_URI=mongodb://localhost:27017/ucrhousing-test
```

### Option C: Use MongoDB Memory Server (For Quick Tests)

The Jest tests already use `mongodb-memory-server` which creates an in-memory database. This is perfect for quick tests but data is lost when tests finish.

---

## 3. Running Tests Safely

### Step 1: Set Up Test Environment

Create a `.env.test` file:

```bash
# .env.test
TEST_MONGODB_URI=mongodb://localhost:27017/ucrhousing-test
TEST_SERVER_URL=http://localhost:3001
NODE_ENV=test
```

### Step 2: Load Test Environment

```bash
# Load test environment variables
export $(cat .env.test | xargs)

# Or use a tool like dotenv-cli
npm install -g dotenv-cli
dotenv -e .env.test -- node scripts/validate-resume-claims.js
```

### Step 3: Run Tests Against Test Database

All scripts now check for `TEST_MONGODB_URI` first:

```bash
# This will use TEST_MONGODB_URI if set, otherwise warn before using production
node scripts/validate-resume-claims.js
```

---

## 4. Safe Testing Workflow

### Recommended Workflow:

1. **Set up test database:**
   ```bash
   export TEST_MONGODB_URI="mongodb://localhost:27017/ucrhousing-test"
   ```

2. **Generate test data in test database:**
   ```bash
   node scripts/seed-large.js 10000
   ```

3. **Run latency tests:**
   ```bash
   node scripts/measure-latency.js
   ```

4. **Start test server (separate from production):**
   ```bash
   # Terminal 1: Start test server
   export TEST_MONGODB_URI="mongodb://localhost:27017/ucrhousing-test"
   npm run dev
   ```

5. **Run API benchmarks:**
   ```bash
   # Terminal 2: Run benchmarks
   export TEST_SERVER_URL="http://localhost:3001"
   node scripts/run-autocannon-benchmark.js
   ```

6. **Run full validation:**
   ```bash
   node scripts/validate-resume-claims.js
   ```

---

## 5. What Each Script Does

### ✅ Safe Scripts (Read-Only or Test Database Only):

- **`measure-latency.js`** - Only reads data, doesn't modify anything
- **`run-autocannon-benchmark.js`** - Only sends HTTP requests, doesn't modify data
- **`validate-resume-claims.js`** - Only reads data and runs benchmarks

### ⚠️ Scripts That Modify Data:

- **`seed-large.js`** - **INSERTS** test listings into database
  - ✅ Safe if using `TEST_MONGODB_URI`
  - ⚠️ Will add data to production if using production database

---

## 6. Production Safety Checklist

Before running any script:

- [ ] Check which database you're connecting to
- [ ] Set `TEST_MONGODB_URI` for testing
- [ ] Verify `NODE_ENV` is not `production`
- [ ] Run scripts during low-traffic hours if testing on production
- [ ] Monitor database performance during index creation
- [ ] Have a backup plan (database backups)

---

## 7. Quick Reference

### Test Against Test Database:
```bash
export TEST_MONGODB_URI="mongodb://localhost:27017/ucrhousing-test"
node scripts/validate-resume-claims.js
```

### Test Against Production (with warning):
```bash
# Scripts will warn you and wait 5 seconds before proceeding
node scripts/validate-resume-claims.js
```

### Generate Test Data Safely:
```bash
export TEST_MONGODB_URI="mongodb://localhost:27017/ucrhousing-test"
node scripts/seed-large.js 10000
```

---

## 8. I Cannot Run Tests For You

**Important:** I (the AI) cannot actually run these tests because:
- I don't have access to your database
- I don't have access to your server
- I can't execute code on your machine

**What I can do:**
- ✅ Create the scripts (done!)
- ✅ Help you understand how to use them
- ✅ Troubleshoot issues you encounter

**What you need to do:**
- Run the scripts on your machine
- Set up a test database
- Execute the commands

---

## 9. Troubleshooting

### "Script is using production database!"
```bash
# Set test database explicitly
export TEST_MONGODB_URI="mongodb://localhost:27017/ucrhousing-test"
```

### "Can't connect to database"
- Check your MongoDB connection string
- Ensure MongoDB is running (if local)
- Check network access (if cloud)

### "Server not running"
```bash
# Start your server first
npm run dev
```

---

## Summary

✅ **Indexes are safe** - they improve performance, not break things  
✅ **Use TEST_MONGODB_URI** - keeps production safe  
✅ **Scripts warn you** - if you try to use production, you'll get a warning  
✅ **Read-only scripts are safe** - latency and benchmark scripts don't modify data  
⚠️ **Seed script modifies data** - only use with test database  

**Bottom line:** Set `TEST_MONGODB_URI` and you're safe to test everything!

