const express = require('express');
const jwt = require('jsonwebtoken');
const Landlord = require('../models/Landlord');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// EMERGENCY RAILWAY FIX: Hardcode regardless of environment
const getJwtSecret = () => {
  // HARDCODED for Railway (Railway might not have NODE_ENV=production)
  console.log('🚑 Using hardcoded JWT_SECRET for Railway');
  return '5ca2b60a803ac018f617bf748069e6f22abe6d2416a86fa0e19a4d31c6e4cc5613bc8156488d8c5612c0f47d62fc1782f32cca60d269b771b6076cc8fd9ff03c';
};

// Helper function to generate JWT token with safe error handling
const generateToken = (landlordId) => {
  try {
    const secret = getJwtSecret();
    return jwt.sign({ landlordId }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  } catch (error) {
    console.error('Token generation failed:', error);
    throw new Error('Authentication token generation failed');
  }
};

// Input validation helper
const validateStringInput = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  return value.trim();
};

// POST /api/auth/register - Register new landlord
router.post('/register', async (req, res) => {
  try {
    console.log('🔐 Registration attempt:', { body: req.body });
    
    const { email, password, name, phone } = req.body;
    
    // Validate input types and required fields
    if (!email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        error: 'Email and password are required fields'
      });
    }
    
    // Validate that inputs are strings
    let validatedEmail, validatedPassword;
    try {
      validatedEmail = validateStringInput(email, 'Email');
      validatedPassword = validateStringInput(password, 'Password');
    } catch (validationError) {
      console.log('❌ Input type validation failed:', validationError.message);
      return res.status(400).json({
        error: `Input type validation failed: ${validationError.message}`
      });
    }
    
    console.log('✅ Required fields present and validated');
    
    // Check if landlord already exists
    const existingLandlord = await Landlord.findOne({ email: validatedEmail });
    if (existingLandlord) {
      console.log('❌ Landlord already exists:', validatedEmail);
      return res.status(400).json({
        error: 'An account with this email already exists'
      });
    }
    
    console.log('✅ Email is available');
    
    // Create new landlord
    const landlord = new Landlord({
      email: validatedEmail,
      password: validatedPassword,
      name: name && typeof name === 'string' ? name.trim() : undefined,
      phone: phone && typeof phone === 'string' ? phone.trim() : undefined
    });
    
    console.log('✅ Landlord object created, attempting to save...');
    
    await landlord.save();
    
    console.log('✅ Landlord saved successfully:', landlord._id);
    
    // Generate JWT token
    const token = generateToken(landlord._id);
    
    console.log('✅ JWT token generated');
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      landlord
    });
    
  } catch (error) {
    console.error('💥 Registration error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: `validation failed: ${errors.join(', ')}` });
    }
    
    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'An account with this email already exists'
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login - Login landlord
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required fields'
      });
    }
    
    // Validate that inputs are strings
    let validatedEmail, validatedPassword;
    try {
      validatedEmail = validateStringInput(email, 'Email');
      validatedPassword = validateStringInput(password, 'Password');
    } catch (validationError) {
      return res.status(400).json({
        error: `Input type validation failed: ${validationError.message}`
      });
    }
    
    // Find landlord by email
    const landlord = await Landlord.findOne({ email: validatedEmail });
    if (!landlord) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }
    
    // Check if account is active
    if (!landlord.isActive) {
      return res.status(401).json({
        error: 'Account has been deactivated'
      });
    }
    
    // Compare password
    const isPasswordValid = await landlord.comparePassword(validatedPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = generateToken(landlord._id);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      landlord
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me - Get current landlord info (protected)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.landlord is added by authenticateToken middleware
    res.json({
      landlord: req.landlord
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 