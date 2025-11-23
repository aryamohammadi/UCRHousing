const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const { sanitizeInput } = require('./middleware/sanitize');

// Load environment variables
dotenv.config();

// Connect to database - wait for connection before starting server
(async () => {
  try {
    console.log('🚀 Starting application initialization...');
    console.log('Environment variables check:');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('  MONGO_URL:', process.env.MONGO_URL ? 'SET' : 'NOT SET');
    console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    
    await connectDB();
    
    // Wait a moment for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check connection state
    const dbState = mongoose.connection.readyState;
    const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    console.log('Database ready state after connection attempt:', dbState, `(${stateNames[dbState] || 'unknown'})`);
    
    // Only start server if database is connected
    if (dbState === 1) {
      console.log('✅ Database connected, starting server...');
      startServer();
    } else {
      console.error('❌ Cannot start server without database connection');
      console.error('Database ready state:', dbState, `(${stateNames[dbState] || 'unknown'})`);
      console.error('Connection host:', mongoose.connection.host || 'none');
      console.error('Connection name:', mongoose.connection.name || 'none');
      console.error('Exiting - Railway will restart and retry');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
})();

function startServer() {

const app = express();
const PORT = process.env.PORT || 3001;

// Basic CORS setup - MUST be before other middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://dormduos.com',
  'https://www.dormduos.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all origins in development for easier testing
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.removeHeader('X-Powered-By');
  next();
});

// Parse JSON requests with increased limit for larger payloads
// This MUST be before any routes that need req.body
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json',
  strict: true
}));

// Also parse URL-encoded bodies (just in case)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log incoming requests for debugging - AFTER body parsing
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log(`📥 ${req.method} ${req.path}`);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('Body present:', !!req.body);
    console.log('Body type:', typeof req.body);
    if (req.body) {
      console.log('Body keys:', Object.keys(req.body));
      console.log('Body sample:', JSON.stringify(req.body).substring(0, 200));
    } else {
      console.error('⚠️  WARNING: req.body is undefined/null!');
      console.error('Raw headers:', req.headers);
    }
  }
  next();
});

// Basic JSON error handling
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('JSON parsing error:', error.message);
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

// Handle preflight OPTIONS requests explicitly
app.options('*', cors());

// Input sanitization
app.use(sanitizeInput);

// API routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));

// Basic error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled server error:', error.message);
  console.error('Error name:', error.name);
  console.error('Error stack:', error.stack);
  
  // Handle CORS errors specifically
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS: Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  const errorResponse = {
    error: 'Internal server error',
    errorType: error.name,
    message: error.message
  };
  
  // Add more details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }
  
  res.status(500).json(errorResponse);
});

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Frontend should connect from http://localhost:5173`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`💾 Database status: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  });
} 