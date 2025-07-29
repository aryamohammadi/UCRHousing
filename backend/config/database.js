const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use local MongoDB for dev, Railway for production
    let mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ucrhousing';
    
    // If using Railway's internal URL and it fails, try the public URL
    if (mongoURI.includes('mongodb.railway.internal')) {
      const publicMongoURI = mongoURI.replace('mongodb.railway.internal', 'mongodb-production-c5d1.up.railway.app');
      console.log('Trying Railway public MongoDB URL...');
      mongoURI = publicMongoURI;
    }
    
    console.log('Connecting to MongoDB...', mongoURI.includes('localhost') ? 'localhost' : 'Railway');
    
    const conn = await mongoose.connect(mongoURI, {
      // Connection options for Railway and better reliability
      serverSelectionTimeoutMS: 5000, // Reduce timeout for faster failure detection
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Listen for connection issues
    mongoose.connection.on('error', (err) => {
      console.error('⚠️  MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // In production, try to continue without database (graceful degradation)
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Server continuing without database connection...');
      return null;
    }
    
    // In development, don't crash but log the error
    console.log('🔄 Development mode: continuing without database...');
  }
};

module.exports = connectDB; 