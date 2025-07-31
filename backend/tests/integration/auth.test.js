const request = require('supertest');
const express = require('express');
const authRouter = require('../../routes/auth');
const { sanitizeInput } = require('../../middleware/sanitize');
const { 
  createTestLandlord, 
  validateLandlordStructure,
  getAuthHeaders
} = require('../helpers/testHelpers');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(sanitizeInput);
  app.use('/api/auth', authRouter);
  return app;
};

describe('Auth API Integration Tests', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  describe('POST /api/auth/register', () => {
    
    test('should register a new landlord successfully', async () => {
      const landlordData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(landlordData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.landlord).toBeDefined();
      expect(response.body.token).toBeDefined();
      
      validateLandlordStructure(response.body.landlord);
      expect(response.body.landlord.email).toBe(landlordData.email);
      expect(response.body.landlord.name).toBe(landlordData.name);
      
      // Password should not be included in response
      expect(response.body.landlord.password).toBeUndefined();
    });
    
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);
      
      expect(response.body.error).toContain('required fields');
    });
    
    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          phone: '(555) 123-4567',
          password: 'password123'
        })
        .expect(400);
      
      expect(response.body.error).toContain('validation');
    });
    
    test('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '(555) 123-4567',
          password: '123' // Too short
        })
        .expect(400);
      
      expect(response.body.error).toContain('validation');
    });
    
    test('should prevent duplicate email registration', async () => {
      const landlordData = {
        name: 'First User',
        email: 'duplicate@example.com',
        phone: '(555) 111-1111',
        password: 'password123'
      };
      
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(landlordData)
        .expect(201);
      
      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...landlordData,
          name: 'Second User'
        })
        .expect(400);
      
      expect(response.body.error).toContain('already exists');
    });
    
    test('should validate input types', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 123, // Should be string
          email: ['not', 'a', 'string'], // Should be string
          phone: '(555) 123-4567',
          password: 'password123'
        })
        .expect(400);
      
      expect(response.body.error).toContain('type validation');
    });
    
    test('should handle injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '(555) 123-4567',
          password: 'password123',
          '$where': 'this.email.length > 0' // MongoDB injection attempt
        })
        .expect(201);
      
      // Should register successfully but ignore dangerous fields
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('POST /api/auth/login', () => {
    let testLandlord;
    
    beforeEach(async () => {
      testLandlord = await createTestLandlord({
        email: 'login@example.com',
        password: 'testpassword123'
      });
    });
    
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'testpassword123'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.landlord).toBeDefined();
      expect(response.body.token).toBeDefined();
      
      validateLandlordStructure(response.body.landlord);
      expect(response.body.landlord.email).toBe('login@example.com');
    });
    
    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123'
        })
        .expect(400);
      
      expect(response.body.error).toContain('Invalid credentials');
    });
    
    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(400);
      
      expect(response.body.error).toContain('Invalid credentials');
    });
    
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com'
          // Missing password
        })
        .expect(400);
      
      expect(response.body.error).toContain('required');
    });
    
    test('should validate input types', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 123,
          password: ['not', 'a', 'string']
        })
        .expect(400);
      
      expect(response.body.error).toContain('type validation');
    });
    
    test('should handle empty credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: ''
        })
        .expect(400);
      
      expect(response.body.error).toContain('required');
    });
  });
  
  describe('Security and Rate Limiting', () => {
    
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);
    });
    
    test('should handle extremely large payloads', async () => {
      const largePayload = {
        name: 'x'.repeat(10000),
        email: 'test@example.com',
        phone: '(555) 123-4567',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(largePayload)
        .expect(400);
    });
    
    test('should sanitize dangerous MongoDB operators', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '(555) 123-4567',
          password: 'password123',
          '$ne': 'dangerous',
          '$where': 'malicious code'
        })
        .expect(201);
      
      // Should register successfully, ignoring dangerous operators
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('JWT Token Validation', () => {
    
    test('should generate valid JWT tokens', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Token Test',
          email: 'token@example.com',
          phone: '(555) 123-4567',
          password: 'password123'
        })
        .expect(201);
      
      const token = response.body.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
    
    test('should include correct payload in JWT', async () => {
      const jwt = require('jsonwebtoken');
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'JWT Test',
          email: 'jwt@example.com',
          phone: '(555) 123-4567',
          password: 'password123'
        })
        .expect(201);
      
      const token = response.body.token;
      const decoded = jwt.decode(token);
      
      expect(decoded.landlordId).toBeDefined();
      expect(decoded.exp).toBeDefined(); // Expiration time
      expect(decoded.iat).toBeDefined(); // Issued at time
    });
  });
}); 