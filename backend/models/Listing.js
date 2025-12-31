const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  // Basic listing information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Pricing and property details
  price: {
    type: Number,
    required: [true, 'Monthly rent is required'],
    min: [0, 'Price cannot be negative']
  },
  bedrooms: {
    type: Number,
    required: [true, 'Number of bedrooms is required'],
    min: [0, 'Bedrooms cannot be negative'],
    max: [10, 'Maximum 10 bedrooms allowed']
  },
  bathrooms: {
    type: Number,
    required: [true, 'Number of bathrooms is required'],
    min: [0, 'Bathrooms cannot be negative'],
    max: [10, 'Maximum 10 bathrooms allowed']
  },
  
  // Location information
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  distance_from_campus: {
    type: String,
    trim: true,
    default: 'Not specified'
  },
  
  // UCR-specific amenities that students care about
  amenities: [{
    type: String,
    enum: [
      'parking',
      'wifi',
      'utilities_included',
      'furnished',
      'laundry',
      'air_conditioning',
      'heating',
      'dishwasher',
      'microwave',
      'gym_access',
      'pool',
      'study_room',
      'pet_friendly',
      'bike_storage',
      'shuttle_service'
    ]
  }],
  
  // Lease and availability
  lease_terms: [{
    type: String,
    enum: ['semester', 'academic_year', 'monthly', 'yearly']
  }],
  available_date: {
    type: Date,
    default: Date.now
  },
  
  // Contact and landlord information
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Landlord',
    required: [true, 'Landlord reference is required']
  },
  contact_email: {
    type: String,
    trim: true,
    lowercase: true
  },
  contact_phone: {
    type: String,
    trim: true
  },
  
  // Photos (for future implementation)
  photos: [{
    type: String, // Will store URLs to uploaded images
    validate: {
      validator: function(url) {
        // Basic URL validation
        return /^https?:\/\//.test(url);
      },
      message: 'Photo must be a valid URL'
    }
  }],
  
  // Status and metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'rented'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Additional UCR-specific information
  parking_type: {
    type: String,
    enum: ['street', 'driveway', 'garage', 'covered', 'none'],
    default: 'none'
  },
  campus_proximity: {
    walking_distance: {
      type: Boolean,
      default: false
    },
    bike_friendly: {
      type: Boolean,
      default: false
    },
    near_bus_stop: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for better query performance
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ landlord: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ bedrooms: 1, bathrooms: 1 });

// Compound indexes for optimized filtered queries (status + price + room filters)
// These indexes significantly improve query performance for common filter combinations
listingSchema.index({ status: 1, price: 1, bedrooms: 1 });
listingSchema.index({ status: 1, price: 1, bathrooms: 1 });
listingSchema.index({ status: 1, bedrooms: 1, bathrooms: 1 });
listingSchema.index({ status: 1, price: 1, bedrooms: 1, bathrooms: 1 });

// Virtual for price formatting
listingSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toLocaleString()}`;
});

// Method to increment views
listingSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to find active listings
listingSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).populate('landlord', 'name email phone');
};

// Static method to find listings by landlord
listingSchema.statics.findByLandlord = function(landlordId) {
  return this.find({ landlord: landlordId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Listing', listingSchema); 