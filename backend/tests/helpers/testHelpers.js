const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const Landlord = require('../../models/Landlord');
const Listing = require('../../models/Listing');

/**
 * Test helper functions for UCR Housing platform testing
 * These functions help create test data and authenticate users
 */

// Create a test landlord with hashed password
const createTestLandlord = async (overrides = {}) => {
  const defaultLandlord = {
    name: 'Test Landlord',
    email: 'test@example.com',
    phone: '(555) 123-4567',
    password: 'testpassword123'
  };
  
  const landlordData = { ...defaultLandlord, ...overrides };
  
  // Let the model's pre-save hook handle password hashing
  const landlord = new Landlord(landlordData);
  await landlord.save();
  
  return landlord;
};

// Generate a JWT token for testing
const generateTestToken = (landlordId) => {
  return jwt.sign(
    { landlordId: landlordId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Create a test listing
const createTestListing = async (landlordId, overrides = {}) => {
  const defaultListing = {
    title: 'Test House Near UCR',
    description: 'A beautiful test house perfect for students',
    price: 1200,
    bedrooms: 3,
    bathrooms: 2,
    address: '123 Test Street, Riverside, CA 92521',
    amenities: ['wifi', 'parking', 'laundry'],
    available_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    contact_email: 'test@example.com',
    contact_phone: '(555) 123-4567',
    status: 'active',
    landlord: landlordId
  };
  
  const listingData = { ...defaultListing, ...overrides };
  const listing = new Listing(listingData);
  await listing.save();
  
  return listing;
};

// Create multiple test listings with different properties
const createMultipleTestListings = async (landlordId, count = 5) => {
  const listings = [];
  
  for (let i = 0; i < count; i++) {
    const listing = await createTestListing(landlordId, {
      title: `Test House ${i + 1}`,
      price: 1000 + (i * 200), // Different prices: 1000, 1200, 1400, etc.
      bedrooms: (i % 4) + 1, // 1-4 bedrooms
      bathrooms: (i % 3) + 1, // 1-3 bathrooms
      address: `${123 + i} Test Street ${i + 1}, Riverside, CA 92521`
    });
    listings.push(listing);
  }
  
  return listings;
};

// Create authentication headers for requests
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Validate listing data structure
const validateListingStructure = (listing) => {
  expect(listing).toHaveProperty('_id');
  expect(listing).toHaveProperty('title');
  expect(listing).toHaveProperty('description');
  expect(listing).toHaveProperty('price');
  expect(listing).toHaveProperty('bedrooms');
  expect(listing).toHaveProperty('bathrooms');
  expect(listing).toHaveProperty('address');
  expect(listing).toHaveProperty('status');
  expect(listing).toHaveProperty('landlord');
  expect(listing).toHaveProperty('createdAt');
  expect(listing).toHaveProperty('updatedAt');
};

// Validate landlord data structure
const validateLandlordStructure = (landlord) => {
  expect(landlord).toHaveProperty('_id');
  expect(landlord).toHaveProperty('name');
  expect(landlord).toHaveProperty('email');
  expect(landlord).toHaveProperty('phone');
  expect(landlord).toHaveProperty('createdAt');
  expect(landlord).toHaveProperty('updatedAt');
  // Password should not be included in responses
  expect(landlord).not.toHaveProperty('password');
};

// Test data generators for edge cases
const generateInvalidListingData = () => ({
  price: 'not-a-number',
  bedrooms: 'invalid',
  bathrooms: {},
  title: '', // Empty title
  description: '', // Empty description
  address: '' // Empty address
});

const generateValidListingData = () => ({
  title: 'Valid Test Listing',
  description: 'This is a valid test listing with all required fields',
  price: 1500,
  bedrooms: 2,
  bathrooms: 1,
  address: '456 Valid Street, Riverside, CA 92521',
  contact_email: 'valid@example.com',
  contact_phone: '(555) 987-6543',
  amenities: ['wifi', 'parking']
});

// Query parameter test cases
const getTestQueryParams = () => ({
  valid: {
    minPrice: '1000',
    maxPrice: '2000',
    bedrooms: '3',
    bathrooms: '2',
    search: 'test house'
  },
  invalid: {
    minPrice: {},
    maxPrice: 'not-a-number',
    bedrooms: 'NaN',
    bathrooms: [],
    search: ''
  },
  edge: {
    minPrice: '0',
    maxPrice: '999999',
    bedrooms: '10',
    bathrooms: '10'
  }
});

module.exports = {
  createTestLandlord,
  generateTestToken,
  createTestListing,
  createMultipleTestListings,
  getAuthHeaders,
  validateListingStructure,
  validateLandlordStructure,
  generateInvalidListingData,
  generateValidListingData,
  getTestQueryParams
}; 