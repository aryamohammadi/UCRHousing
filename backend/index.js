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
  await connectDB();
  
  // Only start server if database is connected (or in dev mode)
  if (mongoose.connection.readyState === 1 || process.env.NODE_ENV !== 'production') {
    startServer();
  } else {
    console.error('❌ Cannot start server without database connection');
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

// Parse JSON requests
app.use(express.json());

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
  console.error('Server error:', error);
  
  // Handle CORS errors specifically
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS: Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error'
  });
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