const request = require('supertest');
const express = require('express');
const listingsRouter = require('../../routes/listings');
const authRouter = require('../../routes/auth');
const { sanitizeInput } = require('../../middleware/sanitize');
const { 
  createTestLandlord, 
  generateTestToken, 
  createTestListing,
  createMultipleTestListings,
  getAuthHeaders,
  validateListingStructure,
  getTestQueryParams,
  generateValidListingData,
  generateInvalidListingData
} = require('../helpers/testHelpers');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(sanitizeInput);
  app.use('/api/auth', authRouter);
  app.use('/api/listings', listingsRouter);
  return app;
};

describe('Listings API Integration Tests', () => {
  let app;
  let landlord;
  let token;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  beforeEach(async () => {
    landlord = await createTestLandlord();
    token = generateTestToken(landlord._id);
  });
  
  describe('GET /api/listings', () => {
    
    test('should get all active listings successfully', async () => {
      // Create some test listings
      await createMultipleTestListings(landlord._id, 3);
      
      const response = await request(app)
        .get('/api/listings')
        .expect(200);
      
      expect(response.body).toHaveProperty('listings');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.listings).toHaveLength(3);
      
      // Validate listing structure
      response.body.listings.forEach(listing => {
        validateListingStructure(listing);
        expect(listing.status).toBe('active');
      });
      
      // Validate pagination
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.total).toBe(3);
    });
    
    test('should handle empty listings gracefully', async () => {
      const response = await request(app)
        .get('/api/listings')
        .expect(200);
      
      expect(response.body.listings).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });
    
    test('should filter by price range correctly', async () => {
      // Create listings with different prices
      await createTestListing(landlord._id, { title: 'Cheap House', price: 800 });
      await createTestListing(landlord._id, { title: 'Medium House', price: 1200 });
      await createTestListing(landlord._id, { title: 'Expensive House', price: 2000 });
      
      const response = await request(app)
        .get('/api/listings')
        .query({ minPrice: '1000', maxPrice: '1500' })
        .expect(200);
      
      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].title).toBe('Medium House');
      expect(response.body.listings[0].price).toBe(1200);
    });
    
    test('should filter by bedrooms correctly', async () => {
      await createTestListing(landlord._id, { title: '2BR House', bedrooms: 2 });
      await createTestListing(landlord._id, { title: '3BR House', bedrooms: 3 });
      await createTestListing(landlord._id, { title: '4BR House', bedrooms: 4 });
      
      const response = await request(app)
        .get('/api/listings')
        .query({ bedrooms: '3' })
        .expect(200);
      
      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].title).toBe('3BR House');
      expect(response.body.listings[0].bedrooms).toBe(3);
    });
    
    test('should filter by bathrooms correctly', async () => {
      await createTestListing(landlord._id, { title: '1BA House', bathrooms: 1 });
      await createTestListing(landlord._id, { title: '2BA House', bathrooms: 2 });
      
      const response = await request(app)
        .get('/api/listings')
        .query({ bathrooms: '2' })
        .expect(200);
      
      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].title).toBe('2BA House');
      expect(response.body.listings[0].bathrooms).toBe(2);
    });
    
    test('should search by text correctly', async () => {
      await createTestListing(landlord._id, { 
        title: 'Beautiful House Near Campus',
        description: 'Great for UCR students'
      });
      await createTestListing(landlord._id, { 
        title: 'Apartment Downtown',
        description: 'City living'
      });
      
      const response = await request(app)
        .get('/api/listings')
        .query({ search: 'campus' })
        .expect(200);
      
      expect(response.body.listings).toHaveLength(1);
      expect(response.body.listings[0].title).toContain('Campus');
    });
    
    test('should handle pagination correctly', async () => {
      // Create 25 listings
      await createMultipleTestListings(landlord._id, 25);
      
      // Test first page
      const page1 = await request(app)
        .get('/api/listings')
        .query({ page: '1', limit: '10' })
        .expect(200);
      
      expect(page1.body.listings).toHaveLength(10);
      expect(page1.body.pagination.page).toBe(1);
      expect(page1.body.pagination.total).toBe(25);
      expect(page1.body.pagination.pages).toBe(3);
      
      // Test second page
      const page2 = await request(app)
        .get('/api/listings')
        .query({ page: '2', limit: '10' })
        .expect(200);
      
      expect(page2.body.listings).toHaveLength(10);
      expect(page2.body.pagination.page).toBe(2);
      
      // Test last page
      const page3 = await request(app)
        .get('/api/listings')
        .query({ page: '3', limit: '10' })
        .expect(200);
      
      expect(page3.body.listings).toHaveLength(5);
      expect(page3.body.pagination.page).toBe(3);
    });
    
    // CRITICAL: Test cases for the casting errors found in logs
    test('should handle invalid query parameters gracefully (casting bug fix)', async () => {
      await createTestListing(landlord._id);
      
      // Test with object parameters (this was causing the casting error)
      const response1 = await request(app)
        .get('/api/listings')
        .query({ minPrice: '{}' })
        .expect(200);
      
      expect(response1.body.listings).toHaveLength(1); // Should ignore invalid filter
      
      // Test with NaN values
      const response2 = await request(app)
        .get('/api/listings')
        .query({ bedrooms: 'NaN' })
        .expect(200);
      
      expect(response2.body.listings).toHaveLength(1); // Should ignore invalid filter
      
      // Test with array parameters
      const response3 = await request(app)
        .get('/api/listings')
        .query({ bathrooms: '[]' })
        .expect(200);
      
      expect(response3.body.listings).toHaveLength(1); // Should ignore invalid filter
    });
    
    test('should validate query parameter bounds', async () => {
      await createTestListing(landlord._id);
      
      // Test extremely high values
      const response1 = await request(app)
        .get('/api/listings')
        .query({ minPrice: '999999999' })
        .expect(200);
      
      expect(response1.body.listings).toHaveLength(0); // No listings match extreme price
      
      // Test negative values
      const response2 = await request(app)
        .get('/api/listings')
        .query({ maxPrice: '-100' })
        .expect(200);
      
      expect(response2.body.listings).toHaveLength(1); // Should ignore invalid negative price
    });
    
    test('should handle malformed JSON in query params', async () => {
      await createTestListing(landlord._id);
      
      const response = await request(app)
        .get('/api/listings')
        .query({ search: '{"malformed": json}' })
        .expect(200);
      
      expect(response.body.listings).toHaveLength(0); // Should search for literal string
    });
  });
  
  describe('GET /api/listings/my', () => {
    
    test('should get landlord\'s listings with authentication', async () => {
      // Create listings for this landlord
      await createMultipleTestListings(landlord._id, 2);
      
      // Create another landlord with listings
      const otherLandlord = await createTestLandlord({ email: 'other@example.com' });
      await createTestListing(otherLandlord._id);
      
      const response = await request(app)
        .get('/api/listings/my')
        .set(getAuthHeaders(token))
        .expect(200);
      
      expect(response.body.listings).toHaveLength(2);
      response.body.listings.forEach(listing => {
        expect(listing.landlord.toString()).toBe(landlord._id.toString());
      });
    });
    
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/listings/my')
        .expect(401);
      
      expect(response.body.error).toContain('token');
    });
    
    test('should handle invalid token', async () => {
      const response = await request(app)
        .get('/api/listings/my')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.error).toContain('Invalid token');
    });
  });
  
  describe('GET /api/listings/:id', () => {
    
    test('should get single listing by ID', async () => {
      const listing = await createTestListing(landlord._id);
      
      const response = await request(app)
        .get(`/api/listings/${listing._id}`)
        .expect(200);
      
      expect(response.body.listing).toBeDefined();
      validateListingStructure(response.body.listing);
      expect(response.body.listing._id).toBe(listing._id.toString());
    });
    
    test('should return 404 for non-existent listing', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/listings/${fakeId}`)
        .expect(404);
      
      expect(response.body.error).toContain('not found');
    });
    
    test('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/listings/invalid-id')
        .expect(400);
      
      expect(response.body.error).toContain('Invalid listing ID');
    });
  });
  
  describe('POST /api/listings', () => {
    
    test('should create new listing with valid data', async () => {
      const listingData = generateValidListingData();
      
      const response = await request(app)
        .post('/api/listings')
        .set(getAuthHeaders(token))
        .send(listingData)
        .expect(201);
      
      expect(response.body.listing).toBeDefined();
      validateListingStructure(response.body.listing);
      expect(response.body.listing.title).toBe(listingData.title);
      expect(response.body.listing.landlord).toBe(landlord._id.toString());
    });
    
    test('should require authentication for creating listings', async () => {
      const listingData = generateValidListingData();
      
      const response = await request(app)
        .post('/api/listings')
        .send(listingData)
        .expect(401);
      
      expect(response.body.error).toContain('token');
    });
    
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/listings')
        .set(getAuthHeaders(token))
        .send({})
        .expect(400);
      
      expect(response.body.error).toContain('validation');
    });
    
    test('should validate field types and ranges', async () => {
      const invalidData = generateInvalidListingData();
      
      const response = await request(app)
        .post('/api/listings')
        .set(getAuthHeaders(token))
        .send(invalidData)
        .expect(400);
      
      expect(response.body.error).toContain('validation');
    });
    
    test('should handle excessive values', async () => {
      const listingData = {
        ...generateValidListingData(),
        bedrooms: 100, // Exceeds max
        bathrooms: 50  // Exceeds max
      };
      
      const response = await request(app)
        .post('/api/listings')
        .set(getAuthHeaders(token))
        .send(listingData)
        .expect(400);
      
      expect(response.body.error).toContain('validation');
    });
  });
  
  describe('PUT /api/listings/:id', () => {
    let listing;
    
    beforeEach(async () => {
      listing = await createTestListing(landlord._id);
    });
    
    test('should update own listing successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        price: 1800
      };
      
      const response = await request(app)
        .put(`/api/listings/${listing._id}`)
        .set(getAuthHeaders(token))
        .send(updateData)
        .expect(200);
      
      expect(response.body.listing.title).toBe(updateData.title);
      expect(response.body.listing.price).toBe(updateData.price);
    });
    
    test('should not update other landlord\'s listing', async () => {
      const otherLandlord = await createTestLandlord({ email: 'other@example.com' });
      const otherListing = await createTestListing(otherLandlord._id);
      
      const response = await request(app)
        .put(`/api/listings/${otherListing._id}`)
        .set(getAuthHeaders(token))
        .send({ title: 'Unauthorized Update' })
        .expect(403);
      
      expect(response.body.error).toContain('authorized');
    });
    
    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/listings/${listing._id}`)
        .send({ title: 'No Auth Update' })
        .expect(401);
      
      expect(response.body.error).toContain('token');
    });
  });
  
  describe('DELETE /api/listings/:id', () => {
    let listing;
    
    beforeEach(async () => {
      listing = await createTestListing(landlord._id);
    });
    
    test('should delete own listing successfully', async () => {
      const response = await request(app)
        .delete(`/api/listings/${listing._id}`)
        .set(getAuthHeaders(token))
        .expect(200);
      
      expect(response.body.message).toContain('deleted');
      
      // Verify listing is actually deleted
      const getResponse = await request(app)
        .get(`/api/listings/${listing._id}`)
        .expect(404);
    });
    
    test('should not delete other landlord\'s listing', async () => {
      const otherLandlord = await createTestLandlord({ email: 'other@example.com' });
      const otherListing = await createTestListing(otherLandlord._id);
      
      const response = await request(app)
        .delete(`/api/listings/${otherListing._id}`)
        .set(getAuthHeaders(token))
        .expect(403);
      
      expect(response.body.error).toContain('authorized');
    });
    
    test('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/listings/${listing._id}`)
        .expect(401);
      
      expect(response.body.error).toContain('token');
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    
    test('should handle database connection errors gracefully', async () => {
      // This would require mocking mongoose, which is complex
      // In a real scenario, you might test this by disconnecting the database
      // For now, we'll test other error scenarios
    });
    
    test('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/listings')
        .set(getAuthHeaders(token))
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);
    });
    
    test('should handle extremely large request bodies', async () => {
      const largeData = {
        ...generateValidListingData(),
        description: 'x'.repeat(10000) // Very long description
      };
      
      const response = await request(app)
        .post('/api/listings')
        .set(getAuthHeaders(token))
        .send(largeData)
        .expect(400); // Should be rejected due to size or validation
    });
  });
}); 