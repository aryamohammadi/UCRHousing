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
    console.log('Starting application initialization...');
    console.log('Environment variables check:');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('  MONGO_URL:', process.env.MONGO_URL ? 'SET' : 'NOT SET');
    console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
    
    await connectDB();
    
    // Wait for connection to stabilize with retries
    const maxRetries = 5;
    let retries = 0;
    let dbState = mongoose.connection.readyState;
    const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    // Wait for connection with retries (up to 5 seconds total)
    while (dbState !== 1 && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      dbState = mongoose.connection.readyState;
      console.log(`Connection check ${retries + 1}/${maxRetries}: ${stateNames[dbState] || 'unknown'}`);
      retries++;
    }
    
    console.log('Database ready state after connection attempt:', dbState, `(${stateNames[dbState] || 'unknown'})`);
    
    // Only start server if database is connected
    if (dbState === 1) {
      console.log('Database connected, starting server...');
      console.log(`Database: ${mongoose.connection.name || 'unknown'}`);
      console.log(`Host: ${mongoose.connection.host || 'unknown'}`);
      startServer();
    } else {
      console.error('Cannot start server without database connection');
      console.error('Database ready state:', dbState, `(${stateNames[dbState] || 'unknown'})`);
      console.error('Connection host:', mongoose.connection.host || 'none');
      console.error('Connection name:', mongoose.connection.name || 'none');
      console.error('Exiting - Railway will restart and retry');
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
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

// Custom middleware to handle text/plain requests that are actually JSON
// This must come BEFORE express.json() so we can capture the raw body
app.use((req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && 
      req.headers['content-type'] && 
      req.headers['content-type'].includes('text/plain')) {
    // Change content-type to application/json so express.json() will parse it
    req.headers['content-type'] = 'application/json';
    console.log('Fixed Content-Type from text/plain to application/json');
  }
  next();
});

// Parse JSON requests with increased limit for larger payloads
// This MUST be before any routes that need req.body
app.use(express.json({ 
  limit: '10mb'
}));

// Also parse URL-encoded bodies (just in case)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log incoming requests for debugging - AFTER body parsing
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'] || '';
    // Skip detailed logging for file uploads (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      console.log(`${req.method} ${req.path} - File upload request`);
      return next();
    }
    
    console.log(`${req.method} ${req.path}`);
    console.log('Content-Type:', contentType);
    console.log('Content-Length:', req.headers['content-length']);
    console.log('Body present:', !!req.body);
    console.log('Body type:', typeof req.body);
    
    // Check if Content-Type is correct
    if (!contentType.includes('application/json')) {
      console.error('WARNING: Content-Type is not application/json!');
      console.error('Received Content-Type:', contentType);
      console.error('Expected: application/json');
    }
    
    if (req.body) {
      console.log('Body keys:', Object.keys(req.body));
      console.log('Body sample:', JSON.stringify(req.body).substring(0, 200));
    } else {
      console.error('WARNING: req.body is undefined/null!');
      console.error('Raw headers:', req.headers);
      console.error('Request URL:', req.url);
      console.error('Request path:', req.path);
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
// Note: CORS middleware should handle this, but we add explicit handler for all routes
// Using a catch-all route handler instead of wildcard pattern (Express 5 compatibility)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  next();
});

// Input sanitization
app.use(sanitizeInput);

// API routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/upload', require('./routes/upload'));

// Basic error handler
app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error.message);
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
  // Bind to 0.0.0.0 to accept connections from all network interfaces (required for Railway)
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`Database status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`Server is ready to accept connections`);
  });
  
  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('Database connection closed');
        process.exit(0);
      });
    });
  });
} 