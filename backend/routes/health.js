const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/health - Simple health check
router.get('/', (req, res) => {
  const health = {
    message: 'UCR Housing API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    jwt_secret: process.env.JWT_SECRET ? 'configured' : 'missing',
    mongodb_uri: process.env.MONGODB_URI ? 'configured' : 'missing'
  };
  
  res.json(health);
});

// GET /api/health/env - PRODUCTION DIAGNOSTIC - Check environment variables
router.get('/env', (req, res) => {
  const envStatus = {
    timestamp: new Date().toISOString(),
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    JWT_SECRET: process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length} chars)` : 'NOT_SET',
    MONGODB_URI: process.env.MONGODB_URI ? `SET (${process.env.MONGODB_URI.substring(0, 20)}...)` : 'NOT_SET',
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT_SET',
    PORT: process.env.PORT || 'NOT_SET'
  };
  
  res.json(envStatus);
});

// GET /api/health/detailed - More detailed health check
router.get('/detailed', (req, res) => {
  const detailed = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not-set',
      PORT: process.env.PORT || '3001',
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasFrontendUrl: !!process.env.FRONTEND_URL
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown'
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    }
  };
  
  res.json(detailed);
});

// GET /api/health/test - Simple test that doesn't depend on anything
router.get('/test', (req, res) => {
  res.json({ 
    test: 'success',
    timestamp: new Date().toISOString(),
    cors: req.headers.origin || 'no-origin'
  });
});

module.exports = router; 