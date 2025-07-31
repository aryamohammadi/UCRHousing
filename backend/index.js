const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const corsOptions = require('./config/cors');
const { sanitizeInput } = require('./middleware/sanitize');
const { 
  rateLimit, 
  authRateLimit, 
  securityHeaders, 
  validateEnvironment,
  createCorsMiddleware,
  requestSizeLimit 
} = require('./middleware/security');

// Load all our environment variables from .env file
dotenv.config();

// Validate environment variables (fail fast if required vars missing)
validateEnvironment();

// Connect to our MongoDB database
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// Production security hardening
app.use(securityHeaders);
app.use(requestSizeLimit('10mb'));
app.use(rateLimit());

// Setup CORS with strict allowlist
app.use(createCorsMiddleware());

// Let Express parse JSON requests (with a reasonable size limit)
app.use(express.json({
  limit: '10mb'
}));

// Handle when someone sends us malformed JSON
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

// Input sanitization middleware to prevent NoSQL injection
app.use(sanitizeInput);

// Hook up all our API routes with appropriate security
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', authRateLimit(), require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));

// Catch any errors that slip through
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Actually start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend should connect from http://localhost:5173`);
}); 