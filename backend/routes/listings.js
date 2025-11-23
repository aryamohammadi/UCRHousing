const express = require('express');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Simple input validation helper
const validateStringInput = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  return value.trim();
};

// GET /api/listings - Get all active listings (public)
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      console.error('❌ Database not connected. Ready state:', dbState, `(${stateNames[dbState] || 'unknown'})`);
      console.error('Connection host:', mongoose.connection.host || 'none');
      return res.status(503).json({ 
        error: 'Database temporarily unavailable. Please try again later.',
        details: `Database state: ${stateNames[dbState] || 'unknown'}`
      });
    }
    
    console.log('✅ Database connected, proceeding with query...');

    const { 
      page = 1, 
      limit = 20, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      bathrooms,
      amenities,
      search 
    } = req.query;

    // Build basic filter
    const filter = { status: 'active' };

    // Price filtering
    if (minPrice && !isNaN(minPrice) && parseFloat(minPrice) >= 0) {
      filter.price = { ...filter.price, $gte: parseFloat(minPrice) };
    }
    if (maxPrice && !isNaN(maxPrice) && parseFloat(maxPrice) >= 0) {
      filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
    }

    // Room filtering
    if (bedrooms && !isNaN(bedrooms)) {
      filter.bedrooms = parseInt(bedrooms);
    }
    if (bathrooms && !isNaN(bathrooms)) {
      filter.bathrooms = parseInt(bathrooms);
    }

    // Amenities filtering
    if (amenities) {
      const amenitiesList = Array.isArray(amenities) ? amenities : [amenities];
      filter.amenities = { $in: amenitiesList };
    }

    // Search functionality
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { address: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Get listings and count
    console.log('🔍 Querying listings with filter:', JSON.stringify(filter, null, 2));
    
    let listings, totalCount;
    try {
      [listings, totalCount] = await Promise.all([
        Listing.find(filter)
          .populate({
            path: 'landlord',
            select: 'name email',
            // Handle missing landlord references gracefully
            options: { lean: true }
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(), // Use lean() for better performance and to avoid Mongoose document issues
        Listing.countDocuments(filter)
      ]);
      console.log(`✅ Found ${listings.length} listings, total count: ${totalCount}`);
    } catch (queryError) {
      console.error('❌ Database query failed:', queryError.message);
      console.error('Query error stack:', queryError.stack);
      throw queryError;
    }

    // Pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      listings,
      pagination: {
        page: pageNum,
        currentPage: pageNum,
        pages: totalPages,
        totalPages,
        total: totalCount,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('❌ Get listings error:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Provide detailed error information
    const errorResponse = {
      error: 'Server error while fetching listings',
      errorType: error.name,
      message: error.message
    };
    
    // Always include error details for debugging (we can remove later)
    errorResponse.stack = error.stack;
    errorResponse.details = error.toString();
    errorResponse.fullError = JSON.stringify(error, Object.getOwnPropertyNames(error));
    
    // Check if it's a database connection error
    if (error.name === 'MongoServerError' || error.message.includes('Mongo') || error.message.includes('buffering')) {
      console.error('❌ MongoDB connection error detected');
      errorResponse.error = 'Database connection error';
      errorResponse.suggestion = 'Check MongoDB connection and network access';
      return res.status(503).json(errorResponse);
    }
    
    // Check if it's a Mongoose error
    if (error.name === 'MongooseError' || error.name === 'CastError') {
      console.error('❌ Mongoose error detected');
      errorResponse.error = 'Database query error';
      return res.status(500).json(errorResponse);
    }
    
    res.status(500).json(errorResponse);
  }
});

// GET /api/listings/my - Get current user's listings (protected)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching listings for landlord:', req.landlord._id);
    
    const listings = await Listing.find({ landlord: req.landlord._id })
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    console.log(`Found ${listings.length} listings for landlord ${req.landlord._id}`);

    res.json({
      success: true,
      listings: listings || []
    });

  } catch (error) {
    console.error('Get my listings error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error while fetching your listings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/listings/:id - Get single listing (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }

    const listing = await Listing.findById(id)
      .populate('landlord', 'name email phone');

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Increment view count (don't await to avoid slowing response)
    listing.incrementViews().catch(err => 
      console.error('Error incrementing views:', err)
    );

    res.json({ listing });

  } catch (error) {
    console.error('Get single listing error:', error);
    res.status(500).json({ error: 'Server error while fetching listing' });
  }
});

// POST /api/listings - Create new listing (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Create listing request received');
    console.log('📋 Request body type:', typeof req.body);
    console.log('📋 Request body:', req.body);
    console.log('📋 Request headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    });
    
    // Check if body is undefined
    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ req.body is invalid:', req.body);
      return res.status(400).json({ 
        error: 'Invalid request body',
        debug: `req.body is ${req.body === undefined ? 'undefined' : typeof req.body}`
      });
    }
    
    const {
      title,
      description,
      price,
      bedrooms,
      bathrooms,
      address,
      distance_from_campus,
      amenities,
      lease_terms,
      available_date,
      contact_email,
      contact_phone,
      parking_type,
      campus_proximity
    } = req.body;

    // Basic validation
    if (!title || !description || !price || bedrooms === undefined || bathrooms === undefined || !address) {
      return res.status(400).json({
        error: 'validation failed: Missing required fields: title, description, price, bedrooms, bathrooms, address'
      });
    }

    // Validate string inputs
    try {
      validateStringInput(title, 'Title');
      validateStringInput(description, 'Description');
      validateStringInput(address, 'Address');
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    // Create listing
    const listing = new Listing({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      address: address.trim(),
      distance_from_campus,
      amenities: amenities || [],
      lease_terms: lease_terms || [],
      available_date: available_date ? new Date(available_date) : new Date(),
      landlord: req.landlord._id,
      contact_email: contact_email || req.landlord.email,
      contact_phone: contact_phone || req.landlord.phone,
      parking_type,
      campus_proximity
    });

    await listing.save();

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing
    });

  } catch (error) {
    console.error('Create listing error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ 
        error: `validation failed: ${validationErrors}` 
      });
    }
    
    res.status(500).json({ error: 'Server error while creating listing' });
  }
});

// PUT /api/listings/:id - Update listing (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const listingId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }
    
    // Find listing and verify ownership
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.landlord.toString() !== req.landlord._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized. You can only edit your own listings' });
    }

    // Update listing
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Listing updated successfully',
      listing: updatedListing
    });

  } catch (error) {
    console.error('Update listing error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ 
        error: `validation failed: ${validationErrors}` 
      });
    }
    
    res.status(500).json({ error: 'Server error while updating listing' });
  }
});

// DELETE /api/listings/:id - Delete listing (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const listingId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }
    
    // Find listing and verify ownership
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.landlord.toString() !== req.landlord._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized. You can only delete your own listings' });
    }

    await Listing.findByIdAndDelete(listingId);

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Server error while deleting listing' });
  }
});

// PUT /api/listings/:id/toggle-status - Toggle listing status (protected)
router.put('/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    const listingId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }
    
    // Find listing and verify ownership
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.landlord.toString() !== req.landlord._id.toString()) {
      return res.status(403).json({ error: 'You can only modify your own listings' });
    }

    // Toggle status
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';
    listing.status = newStatus;
    await listing.save();

    res.json({
      success: true,
      message: `Listing ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      listing
    });

  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Server error while updating listing status' });
  }
});

module.exports = router; 