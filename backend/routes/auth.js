const express = require('express');
const jwt = require('jsonwebtoken');
const Landlord = require('../models/Landlord');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get JWT secret - simple fallback for production
const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'fallback-secret-key-for-development';
};

// Helper function to generate JWT token
const generateToken = (landlordId) => {
  try {
    const secret = getJwtSecret();
    return jwt.sign({ landlordId }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  } catch (error) {
    console.error('Error generating token:', error.message);
    throw new Error('Failed to generate authentication token');
  }
};

// Basic input validation helper
const validateStringInput = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  return value.trim();
};

// POST /api/auth/register - Register new landlord
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { email: req.body.email });
    
    const { email, password, name, phone } = req.body;
    
    // Check required fields
    if (!email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        error: 'Email and password are required fields'
      });
    }
    
    // Basic input validation
    let validatedEmail, validatedPassword;
    try {
      validatedEmail = validateStringInput(email, 'Email');
      validatedPassword = validateStringInput(password, 'Password');
    } catch (validationError) {
      console.log('Input validation failed:', validationError.message);
      return res.status(400).json({
        error: `type validation failed: ${validationError.message}`
      });
    }
    
    console.log('Basic validation passed');
    
    // Check if user already exists
    const existingLandlord = await Landlord.findOne({ email: validatedEmail });
    if (existingLandlord) {
      console.log('User already exists:', validatedEmail);
      return res.status(400).json({
        error: 'An account with this email already exists'
      });
    }
    
    console.log('Email is available');
    
    // Create new user
    const landlord = new Landlord({
      email: validatedEmail,
      password: validatedPassword,
      name: name && typeof name === 'string' ? name.trim() : undefined,
      phone: phone && typeof phone === 'string' ? phone.trim() : undefined
    });
    
    console.log('Saving new user...');
    
    await landlord.save();
    
    console.log('User saved successfully:', landlord._id);
    
    // Generate token
    const token = generateToken(landlord._id);
    
    console.log('Token generated');
    
    // Get landlord data (password removed by toJSON method)
    const landlordData = landlord.toJSON();
    landlordData.id = landlordData._id;
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      landlord: landlordData
    });
    
  } catch (error) {
    console.error('Registration error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ 
        error: `validation failed: ${validationErrors}` 
      });
    }

    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login - Login landlord
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required fields'
      });
    }
    
    // Basic input validation
    let validatedEmail, validatedPassword;
    try {
      validatedEmail = validateStringInput(email, 'Email');
      validatedPassword = validateStringInput(password, 'Password');
    } catch (validationError) {
      return res.status(400).json({
        error: `type validation failed: ${validationError.message}`
      });
    }
    
    // Find user
    const landlord = await Landlord.findOne({ email: validatedEmail });
    if (!landlord) {
      console.log('Login failed: User not found for email:', validatedEmail);
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (!landlord.isActive) {
      console.log('Login failed: Account deactivated for email:', validatedEmail);
      return res.status(401).json({
        error: 'Account has been deactivated'
      });
    }
    
    // Check password
    const isPasswordValid = await landlord.comparePassword(validatedPassword);
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for email:', validatedEmail);
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    console.log('Login successful for email:', validatedEmail);
    
    // Generate token
    const token = generateToken(landlord._id);
    
    // Get landlord data (password removed by toJSON method)
    const landlordData = landlord.toJSON();
    landlordData.id = landlordData._id;
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      landlord: landlordData
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me - Get current user info (protected)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const landlord = await Landlord.findById(req.landlord._id).select('-password');
    if (!landlord) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      landlord
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

module.exports = router; 