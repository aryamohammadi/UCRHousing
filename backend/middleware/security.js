// Security middleware for production hardening

// Rate limiting implementation
const rateLimit = () => {
  const requests = new Map();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // per window per IP
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [ip, ipData] of requests.entries()) {
      ipData.timestamps = ipData.timestamps.filter(timestamp => timestamp > windowStart);
      if (ipData.timestamps.length === 0) {
        requests.delete(ip);
      }
    }
    
    // Get or create request record for this IP
    if (!requests.has(clientIP)) {
      requests.set(clientIP, { timestamps: [] });
    }
    
    const ipRecord = requests.get(clientIP);
    ipRecord.timestamps.push(now);
    
    // Check if rate limit exceeded
    if (ipRecord.timestamps.length > maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
      return;
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - ipRecord.timestamps.length),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });
    
    next();
  };
};

// Stricter rate limiting for auth endpoints
const authRateLimit = () => {
  const requests = new Map();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // much lower for auth
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [ip, ipData] of requests.entries()) {
      ipData.timestamps = ipData.timestamps.filter(timestamp => timestamp > windowStart);
      if (ipData.timestamps.length === 0) {
        requests.delete(ip);
      }
    }
    
    // Get or create request record for this IP
    if (!requests.has(clientIP)) {
      requests.set(clientIP, { timestamps: [] });
    }
    
    const ipRecord = requests.get(clientIP);
    ipRecord.timestamps.push(now);
    
    // Check if rate limit exceeded
    if (ipRecord.timestamps.length > maxRequests) {
      console.warn(`Rate limit exceeded for IP ${clientIP} on auth endpoint`);
      res.status(429).json({
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
      return;
    }
    
    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Needed for Vite dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; '));
  
  // Remove Express fingerprinting
  res.removeHeader('X-Powered-By');
  
  next();
};

// Environment validation
const validateEnvironment = () => {
  const requiredVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'MONGODB_URI'
  ];
  
  const productionVars = [
    'FRONTEND_URL'
  ];
  
  const missing = [];
  
  // Check required vars
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check production-specific vars
  if (process.env.NODE_ENV === 'production') {
    for (const varName of productionVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('💡 Please check your .env file or deployment configuration');
    process.exit(1);
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters for security');
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ JWT_SECRET too short for production use');
      process.exit(1);
    }
  }
  
  console.log('✅ Environment validation passed');
};

// CORS configuration with strict allowlist
const createCorsMiddleware = () => {
  return (req, res, next) => {
    const allowedOrigins = [
      'http://localhost:5173', // Local development
      'http://localhost:3000', // Alternative local port
      process.env.FRONTEND_URL // Production frontend URL
    ].filter(Boolean);
    
    const origin = req.headers.origin;
    
    // Allow requests with no origin (like mobile apps, Postman, server-to-server)
    if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      console.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
      return res.status(403).json({ 
        error: 'CORS: Origin not allowed',
        allowedOrigins: process.env.NODE_ENV === 'development' ? allowedOrigins : undefined
      });
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  };
};

// Request size limiting
const requestSizeLimit = (maxSize = '1mb') => {
  const maxBytes = typeof maxSize === 'string' ? 
    parseInt(maxSize.replace(/mb|kb/i, '')) * (maxSize.toLowerCase().includes('mb') ? 1024 * 1024 : 1024) :
    maxSize;
    
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    
    if (contentLength && contentLength > maxBytes) {
      return res.status(413).json({
        error: `Request too large. Maximum size: ${maxSize}`,
        received: `${Math.round(contentLength / 1024)}KB`
      });
    }
    
    next();
  };
};

module.exports = {
  rateLimit,
  authRateLimit,
  securityHeaders,
  validateEnvironment,
  createCorsMiddleware,
  requestSizeLimit
}; 