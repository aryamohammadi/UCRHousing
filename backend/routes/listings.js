const express = require('express');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Input validation helper
const validateStringInput = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  return value.trim();
};

// GET /api/listings - Get all active listings (public)
router.get('/', async (req, res) => {
  try {
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

    // Helper function to safely parse and validate numeric values
    const safeParseNumber = (value, min = 0, max = 999999) => {
      if (!value || typeof value === 'object' || Array.isArray(value)) return null;
      const stringValue = String(value).trim();
      if (!stringValue || stringValue === 'undefined' || stringValue === 'null') return null;
      const parsed = parseFloat(stringValue);
      if (isNaN(parsed) || parsed < min) return null;
      if (parsed > max) return 'exceeded'; // Special value for exceeded max
      return parsed;
    };

    // Helper function to safely parse integer values
    const safeParseInt = (value, min = 0, max = 100) => {
      if (!value || typeof value === 'object' || Array.isArray(value)) return null;
      const stringValue = String(value).trim();
      if (!stringValue || stringValue === 'undefined' || stringValue === 'null') return null;
      const parsed = parseInt(stringValue, 10);
      if (isNaN(parsed) || parsed < min || parsed > max) return null;
      return parsed;
    };

    // Build filter object
    const filter = { status: 'active' };

    // Price filtering (with enhanced validation)
    if (minPrice || maxPrice) {
      const priceFilter = {};
      let hasPriceFilter = false;
      let minPriceNum = null;
      let maxPriceNum = null;
      
      if (minPrice) {
        minPriceNum = safeParseNumber(minPrice, 0, 50000);
        if (minPriceNum === 'exceeded') {
          // Extremely high minimum price - return no results
          return res.json({
            listings: [],
            pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
          });
        }
        if (minPriceNum !== null && minPriceNum !== undefined && !isNaN(minPriceNum)) {
          priceFilter.$gte = minPriceNum;
          hasPriceFilter = true;
        }
      }
      if (maxPrice) {
        maxPriceNum = safeParseNumber(maxPrice, 0, 50000);
        if (maxPriceNum !== null && maxPriceNum !== undefined && !isNaN(maxPriceNum) && maxPriceNum !== 'exceeded') {
          priceFilter.$lte = maxPriceNum;
          hasPriceFilter = true;
        }
      }
      
      // Check for invalid range (min > max) - return no results
      if (minPriceNum !== null && minPriceNum !== 'exceeded' && 
          maxPriceNum !== null && maxPriceNum !== 'exceeded' && 
          minPriceNum > maxPriceNum) {
        // Invalid price range - return empty results
        return res.json({
          listings: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
        });
      }
      
      // Only add price filter if we have valid constraints
      if (hasPriceFilter) {
        filter.price = priceFilter;
      }
    }

    // Room filtering (with enhanced validation)
    if (bedrooms) {
      const bedroomsNum = safeParseInt(bedrooms, 0, 20);
      if (bedroomsNum !== null && bedroomsNum !== undefined && !isNaN(bedroomsNum)) {
        filter.bedrooms = bedroomsNum;
      }
    }
    if (bathrooms) {
      const bathroomsNum = safeParseNumber(bathrooms, 0, 20);
      if (bathroomsNum !== null && bathroomsNum !== undefined && !isNaN(bathroomsNum) && bathroomsNum !== 'exceeded') {
        filter.bathrooms = bathroomsNum;
      }
    }

    // Amenities filtering (with validation)
    if (amenities && typeof amenities === 'string' && amenities.trim().length > 0) {
      const amenitiesArray = amenities.split(',')
        .map(a => String(a).trim())
        .filter(a => a.length > 0 && a.length <= 50)
        .slice(0, 10); // Limit to 10 amenities max
      
      if (amenitiesArray.length > 0) {
        filter.amenities = { $in: amenitiesArray };
      }
    }

    // Search in title and description (with enhanced validation)
    if (search && typeof search === 'string' && search.trim().length > 0) {
      // Sanitize search term to prevent regex injection
      const sanitizedSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Limit search term length
      if (sanitizedSearch.length > 0 && sanitizedSearch.length <= 100) {
        filter.$or = [
          { title: { $regex: sanitizedSearch, $options: 'i' } },
          { description: { $regex: sanitizedSearch, $options: 'i' } },
          { address: { $regex: sanitizedSearch, $options: 'i' } }
        ];
      }
    }

    // Validate pagination parameters
    const validPage = safeParseInt(page, 1, 1000) || 1;
    const validLimit = safeParseInt(limit, 1, 100) || 20;

    // Final validation: ensure filter object is clean before MongoDB query
    const cleanFilter = { status: 'active' };
    
    // Only add filters that have valid values
    if (filter.price && typeof filter.price === 'object' && Object.keys(filter.price).length > 0) {
      // Double-check price filter values
      const priceFilter = {};
      if (filter.price.$gte !== undefined && !isNaN(filter.price.$gte)) {
        priceFilter.$gte = filter.price.$gte;
      }
      if (filter.price.$lte !== undefined && !isNaN(filter.price.$lte)) {
        priceFilter.$lte = filter.price.$lte;
      }
      if (Object.keys(priceFilter).length > 0) {
        cleanFilter.price = priceFilter;
      }
    }
    
    if (filter.bedrooms !== undefined && !isNaN(filter.bedrooms)) {
      cleanFilter.bedrooms = filter.bedrooms;
    }
    
    if (filter.bathrooms !== undefined && !isNaN(filter.bathrooms)) {
      cleanFilter.bathrooms = filter.bathrooms;
    }
    
    if (filter.amenities) {
      cleanFilter.amenities = filter.amenities;
    }
    
    if (filter.$or) {
      cleanFilter.$or = filter.$or;
    }

    // Execute query with pagination
    const listings = await Listing.find(cleanFilter)
      .populate('landlord', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(validLimit)
      .skip((validPage - 1) * validLimit);

    // Get total count for pagination
    const total = await Listing.countDocuments(cleanFilter);

    res.json({
      listings,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        pages: Math.ceil(total / validLimit)
      }
    });

  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Server error while fetching listings' });
  }
});

// GET /api/listings/my - Get current landlord's listings (protected)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const listings = await Listing.findByLandlord(req.landlord._id);
    
    res.json({
      listings,
      total: listings.length
    });

  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ error: 'Server error while fetching your listings' });
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

    // Validate required fields
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

    // Create new listing
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
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: `validation failed: ${errors.join(', ')}` });
    }

    res.status(500).json({ error: 'Server error while creating listing' });
  }
});

// PUT /api/listings/:id - Update listing (protected + ownership check)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }

    // Find listing and check ownership
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.landlord.toString() !== req.landlord._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    // Update fields (only allow certain fields to be updated)
    const allowedUpdates = [
      'title', 'description', 'price', 'bedrooms', 'bathrooms', 
      'address', 'distance_from_campus', 'amenities', 'lease_terms',
      'available_date', 'contact_email', 'contact_phone', 
      'parking_type', 'campus_proximity', 'status'
    ];

    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Validate string inputs if being updated
    if (updates.title) {
      updates.title = validateStringInput(updates.title, 'Title');
    }
    if (updates.description) {
      updates.description = validateStringInput(updates.description, 'Description');
    }
    if (updates.address) {
      updates.address = validateStringInput(updates.address, 'Address');
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('landlord', 'name email phone');

    res.json({
      message: 'Listing updated successfully',
      listing: updatedListing
    });

  } catch (error) {
    console.error('Update listing error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    res.status(500).json({ error: 'Server error while updating listing' });
  }
});

// DELETE /api/listings/:id - Delete listing (protected + ownership check)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }

    // Find listing and check ownership
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.landlord.toString() !== req.landlord._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await Listing.findByIdAndDelete(id);

    res.json({
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Server error while deleting listing' });
  }
});

module.exports = router; 