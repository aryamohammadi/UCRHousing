// Basic input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Simple function to clean potentially dangerous input
  const cleanObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(cleanObject);
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remove some dangerous MongoDB operators that students might encounter
      if (key.startsWith('$')) {
        console.log(`🛡️  Blocked dangerous MongoDB operator: ${key}`);
        continue;
      }

      cleaned[key] = cleanObject(value);
    }

    return cleaned;
  };

  // Clean request body
  if (req.body && typeof req.body === 'object') {
    req.body = cleanObject(req.body);
  }

  // Clean query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = cleanObject(req.query);
  }

  next();
};

module.exports = { sanitizeInput }; 