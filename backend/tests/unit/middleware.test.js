const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../middleware/auth');
const { sanitizeInput } = require('../../middleware/sanitize');
const Landlord = require('../../models/Landlord');
const { createTestLandlord, generateTestToken } = require('../helpers/testHelpers');

describe('Middleware Unit Tests', () => {
  
  describe('Authentication Middleware', () => {
    let req, res, next, landlord, token;
    
    beforeEach(async () => {
      landlord = await createTestLandlord();
      token = generateTestToken(landlord._id);
      
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });
    
    test('should authenticate valid token', async () => {
      req.headers.authorization = `Bearer ${token}`;
      
      await authenticateToken(req, res, next);
      
      expect(req.landlord).toBeDefined();
      expect(req.landlord._id.toString()).toBe(landlord._id.toString());
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('should reject request without token', async () => {
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should reject request with invalid token format', async () => {
      req.headers.authorization = 'InvalidTokenFormat';
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should reject request with malformed JWT', async () => {
      req.headers.authorization = 'Bearer invalid.jwt.token';
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { landlordId: landlord._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );
      
      req.headers.authorization = `Bearer ${expiredToken}`;
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired.'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should reject request for non-existent landlord', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const fakeToken = jwt.sign(
        { landlordId: fakeId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      req.headers.authorization = `Bearer ${fakeToken}`;
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token or account deactivated.'
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should handle database errors gracefully', async () => {
      // Mock Landlord.findById to throw an error
      jest.spyOn(Landlord, 'findById').mockRejectedValueOnce(new Error('Database error'));
      
      req.headers.authorization = `Bearer ${token}`;
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication error.'
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restore the mock
      Landlord.findById.mockRestore();
    });
    
    test('should handle missing JWT_SECRET', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      req.headers.authorization = `Bearer ${token}`;
      
      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restore the environment variable
      process.env.JWT_SECRET = originalSecret;
    });
  });
  
  describe('Sanitize Middleware', () => {
    let req, res, next;
    
    beforeEach(() => {
      req = {
        body: {},
        query: {},
        params: {}
      };
      res = {};
      next = jest.fn();
    });
    
    test('should pass through safe data unchanged', () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        price: 1200,
        bedrooms: 3
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        price: 1200,
        bedrooms: 3
      });
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should remove dangerous MongoDB operators from body', () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        '$where': 'this.email.length > 0',
        '$ne': 'dangerous',
        '$gt': 100,
        '$regex': 'malicious'
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should remove dangerous operators from query params', () => {
      req.query = {
        search: 'normal search',
        '$where': 'malicious code',
        '$ne': { email: 'hack' },
        minPrice: '1000'
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.query).toEqual({
        search: 'normal search',
        minPrice: '1000'
      });
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should not modify params (params are route-controlled)', () => {
      req.params = {
        id: '507f1f77bcf86cd799439011',
        '$where': 'dangerous'
      };
      
      sanitizeInput(req, res, next);
      
      // Params should remain unchanged since they're controlled by routing
      expect(req.params).toEqual({
        id: '507f1f77bcf86cd799439011',
        '$where': 'dangerous'
      });
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should handle nested objects', () => {
      req.body = {
        user: {
          name: 'John',
          '$where': 'nested danger'
        },
        filters: {
          price: {
            '$gt': 1000,
            '$lt': 2000
          }
        }
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body).toEqual({
        user: {
          name: 'John'
        },
        filters: {
          price: {}
        }
      });
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should handle arrays', () => {
      req.body = {
        amenities: ['wifi', 'parking'],
        dangerousArray: [
          { '$where': 'bad' },
          { name: 'good' }
        ]
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body).toEqual({
        amenities: ['wifi', 'parking'],
        dangerousArray: [
          {},
          { name: 'good' }
        ]
      });
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should handle null and undefined values', () => {
      req.body = {
        name: null,
        description: undefined,
        '$where': 'dangerous'
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body).toEqual({
        name: null,
        description: undefined
      });
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should preserve non-object types', () => {
      req.body = {
        title: 'Test House',
        price: 1200,
        isActive: true,
        tags: ['student-friendly', 'pet-friendly'],
        '$where': 'remove this'
      };
      
      sanitizeInput(req, res, next);
      
      expect(req.body).toEqual({
        title: 'Test House',
        price: 1200,
        isActive: true,
        tags: ['student-friendly', 'pet-friendly']
      });
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should handle empty objects', () => {
      req.body = {};
      req.query = {};
      req.params = {};
      
      sanitizeInput(req, res, next);
      
      expect(req.body).toEqual({});
      expect(req.query).toEqual({});
      expect(req.params).toEqual({});
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should log blocked operators', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      req.body = {
        '$where': 'dangerous',
        '$ne': 'also dangerous'
      };
      
      sanitizeInput(req, res, next);
      
      expect(consoleSpy).toHaveBeenCalledWith('🛡️  Blocked dangerous MongoDB operator: $where');
      expect(consoleSpy).toHaveBeenCalledWith('🛡️  Blocked dangerous MongoDB operator: $ne');
      
      consoleSpy.mockRestore();
    });
  });
}); 