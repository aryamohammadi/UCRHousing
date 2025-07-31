const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/', async (req, res) => {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    service: 'UCR Housing Backend',
    version: process.env.GIT_SHA || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    database: 'unknown',
    checks: {
      database: false,
      memory: false,
      process: false
    }
  };

  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      healthCheck.database = 'connected';
      healthCheck.checks.database = true;
      
      // Test a simple database operation
      await mongoose.connection.db.admin().ping();
    } else {
      healthCheck.database = 'disconnected';
      healthCheck.status = 'degraded';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    healthCheck.memory = memUsageMB;
    healthCheck.checks.memory = memUsageMB.heapUsed < 512; // Alert if using more than 512MB

    // Check process health
    healthCheck.checks.process = process.uptime() > 0;

    // Overall status
    const allChecksPass = Object.values(healthCheck.checks).every(check => check === true);
    if (!allChecksPass && healthCheck.status === 'ok') {
      healthCheck.status = 'degraded';
    }

    // Return appropriate status code
    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('Health check error:', error);
    
    healthCheck.status = 'error';
    healthCheck.database = 'error';
    healthCheck.error = error.message;
    
    res.status(503).json(healthCheck);
  }
});

// GET /api/health/ready - Readiness probe for container orchestration
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected'
      });
    }

    // Test database connectivity
    await mongoose.connection.db.admin().ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      reason: error.message
    });
  }
});

// GET /api/health/live - Liveness probe for container orchestration
router.get('/live', (req, res) => {
  // Simple liveness check - if this endpoint responds, the process is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

module.exports = router; 