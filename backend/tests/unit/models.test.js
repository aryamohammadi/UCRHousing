const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const Landlord = require('../../models/Landlord');
const Listing = require('../../models/Listing');

describe('Models Unit Tests', () => {
  
  describe('Landlord Model', () => {
    
    test('should create a valid landlord', async () => {
      const landlordData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        password: 'password123'
      };
      
      const landlord = new Landlord(landlordData);
      const savedLandlord = await landlord.save();
      
      expect(savedLandlord._id).toBeDefined();
      expect(savedLandlord.name).toBe(landlordData.name);
      expect(savedLandlord.email).toBe(landlordData.email);
      expect(savedLandlord.phone).toBe(landlordData.phone);
      expect(savedLandlord.password).toBeDefined();
      expect(savedLandlord.password).not.toBe(landlordData.password); // Should be hashed
      expect(savedLandlord.createdAt).toBeDefined();
      expect(savedLandlord.updatedAt).toBeDefined();
    });
    
    test('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const landlord = new Landlord({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '(555) 987-6543',
        password: plainPassword
      });
      
      // Mock bcryptjs.hash to verify it's called
      const hashSpy = jest.spyOn(bcryptjs, 'hash').mockResolvedValue('hashed_password');
      
      await landlord.save();
      
      expect(hashSpy).toHaveBeenCalledWith(plainPassword, 12);
      hashSpy.mockRestore();
    });
    
    test('should require all mandatory fields', async () => {
      const landlord = new Landlord({});
      
      let error;
      try {
        await landlord.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });
    
    test('should validate email format', async () => {
      const landlord = new Landlord({
        name: 'Test User',
        email: 'invalid-email',
        phone: '(555) 123-4567',
        password: 'password123'
      });
      
      let error;
      try {
        await landlord.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.email.message).toContain('valid email');
    });
    
    test('should enforce unique email', async () => {
      const landlordData = {
        name: 'User One',
        email: 'duplicate@example.com',
        phone: '(555) 111-1111',
        password: 'password123'
      };
      
      // Create first landlord
      const landlord1 = new Landlord(landlordData);
      await landlord1.save();
      
      // Try to create second landlord with same email
      const landlord2 = new Landlord({
        ...landlordData,
        name: 'User Two'
      });
      
      let error;
      try {
        await landlord2.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });
    
    test('should validate password length', async () => {
      const landlord = new Landlord({
        name: 'Test User',
        email: 'test@example.com',
        phone: '(555) 123-4567',
        password: '123' // Too short
      });
      
      let error;
      try {
        await landlord.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
      expect(error.errors.password.message).toContain('6 characters');
    });
    
    test('should compare passwords correctly', async () => {
      const plainPassword = 'testpassword123';
      const hashedPassword = await bcryptjs.hash(plainPassword, 12);
      
      const landlord = new Landlord({
        name: 'Test User',
        email: 'test@example.com',
        phone: '(555) 123-4567',
        password: hashedPassword
      });
      
      const isMatch = await landlord.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
      
      const isNotMatch = await landlord.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });
  });
  
  describe('Listing Model', () => {
    let landlord;
    
    beforeEach(async () => {
      landlord = new Landlord({
        name: 'Test Landlord',
        email: 'landlord@example.com',
        phone: '(555) 123-4567',
        password: 'password123'
      });
      await landlord.save();
    });
    
    test('should create a valid listing', async () => {
      const listingData = {
        title: 'Beautiful House Near UCR',
        description: 'A spacious house perfect for students',
        price: 1500,
        bedrooms: 3,
        bathrooms: 2,
        address: '123 College Ave, Riverside, CA 92521',
        contact_email: 'contact@example.com',
        contact_phone: '(555) 987-6543',
        landlord: landlord._id
      };
      
      const listing = new Listing(listingData);
      const savedListing = await listing.save();
      
      expect(savedListing._id).toBeDefined();
      expect(savedListing.title).toBe(listingData.title);
      expect(savedListing.description).toBe(listingData.description);
      expect(savedListing.price).toBe(listingData.price);
      expect(savedListing.bedrooms).toBe(listingData.bedrooms);
      expect(savedListing.bathrooms).toBe(listingData.bathrooms);
      expect(savedListing.address).toBe(listingData.address);
      expect(savedListing.status).toBe('active'); // Default value
      expect(savedListing.landlord).toEqual(landlord._id);
      expect(savedListing.createdAt).toBeDefined();
      expect(savedListing.updatedAt).toBeDefined();
    });
    
    test('should require all mandatory fields', async () => {
      const listing = new Listing({});
      
      let error;
      try {
        await listing.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.price).toBeDefined();
      expect(error.errors.bedrooms).toBeDefined();
      expect(error.errors.bathrooms).toBeDefined();
      expect(error.errors.address).toBeDefined();
      expect(error.errors.landlord).toBeDefined();
    });
    
    test('should validate numeric fields are not negative', async () => {
      const listing = new Listing({
        title: 'Test House',
        description: 'Test description',
        price: -100,
        bedrooms: -1,
        bathrooms: -1,
        address: '123 Test St',
        landlord: landlord._id
      });
      
      let error;
      try {
        await listing.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.price).toBeDefined();
      expect(error.errors.bedrooms).toBeDefined();
      expect(error.errors.bathrooms).toBeDefined();
    });
    
    test('should validate maximum values for bedrooms and bathrooms', async () => {
      const listing = new Listing({
        title: 'Test House',
        description: 'Test description',
        price: 1000,
        bedrooms: 15, // Exceeds max of 10
        bathrooms: 15, // Exceeds max of 10
        address: '123 Test St',
        landlord: landlord._id
      });
      
      let error;
      try {
        await listing.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.bedrooms.message).toContain('Maximum 10 bedrooms');
      expect(error.errors.bathrooms.message).toContain('Maximum 10 bathrooms');
    });
    
    test('should validate status enum values', async () => {
      const listing = new Listing({
        title: 'Test House',
        description: 'Test description',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        address: '123 Test St',
        status: 'invalid-status',
        landlord: landlord._id
      });
      
      let error;
      try {
        await listing.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });
    
    test('should accept valid contact_email', async () => {
      const listing = new Listing({
        title: 'Test House',
        description: 'Test description',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        address: '123 Test St',
        contact_email: 'test@example.com',
        landlord: landlord._id
      });
      
      const savedListing = await listing.save();
      
      expect(savedListing.contact_email).toBe('test@example.com');
    });
    
    test('should find listings by landlord', async () => {
      // Create multiple listings for the landlord
      const listing1 = new Listing({
        title: 'House 1',
        description: 'Description 1',
        price: 1000,
        bedrooms: 2,
        bathrooms: 1,
        address: '123 Test St',
        landlord: landlord._id
      });
      await listing1.save();
      
      const listing2 = new Listing({
        title: 'House 2',
        description: 'Description 2',
        price: 1200,
        bedrooms: 3,
        bathrooms: 2,
        address: '456 Test Ave',
        landlord: landlord._id
      });
      await listing2.save();
      
      // Create another landlord and listing
      const otherLandlord = new Landlord({
        name: 'Other Landlord',
        email: 'other@example.com',
        phone: '(555) 999-9999',
        password: 'password123'
      });
      await otherLandlord.save();
      
      const otherListing = new Listing({
        title: 'Other House',
        description: 'Other description',
        price: 1500,
        bedrooms: 4,
        bathrooms: 3,
        address: '789 Other St',
        landlord: otherLandlord._id
      });
      await otherListing.save();
      
      // Test findByLandlord static method
      const landlordListings = await Listing.findByLandlord(landlord._id);
      
      expect(landlordListings).toHaveLength(2);
      expect(landlordListings[0].landlord.toString()).toBe(landlord._id.toString());
      expect(landlordListings[1].landlord.toString()).toBe(landlord._id.toString());
    });
    
    test('should handle amenities array properly', async () => {
      const listing = new Listing({
        title: 'House with Amenities',
        description: 'Great amenities',
        price: 1300,
        bedrooms: 2,
        bathrooms: 1,
        address: '123 Amenity St',
        amenities: ['wifi', 'parking', 'laundry', 'pool'],
        landlord: landlord._id
      });
      
      const savedListing = await listing.save();
      
      expect(savedListing.amenities).toHaveLength(4);
      expect(savedListing.amenities).toContain('wifi');
      expect(savedListing.amenities).toContain('parking');
      expect(savedListing.amenities).toContain('laundry');
      expect(savedListing.amenities).toContain('pool');
    });
    
    test('should handle available_date properly', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      const listing = new Listing({
        title: 'Available Future',
        description: 'Available in the future',
        price: 1100,
        bedrooms: 1,
        bathrooms: 1,
        address: '123 Future St',
        available_date: futureDate,
        landlord: landlord._id
      });
      
      const savedListing = await listing.save();
      
      expect(savedListing.available_date).toEqual(futureDate);
    });
  });
}); 