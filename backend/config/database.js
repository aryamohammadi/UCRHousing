const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variable - Railway will provide MONGODB_URI
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('Connecting to MongoDB... Railway');
    
    const conn = await mongoose.connect(mongoURI, {
      // Connection options optimized for Railway
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // In production, keep the app running even if DB connection fails initially
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  MongoDB connection failed, but keeping app running');
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB; 