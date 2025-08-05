const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // EMERGENCY RAILWAY FIX: Hardcode regardless of environment
    // Railway might not have NODE_ENV=production or environment variables set
    const mongoURI = 'mongodb://mongo:HenGsHmsxgReveohpTWSTLvVSzpADZYX@mongodb-production-c5d1.up.railway.app:27017/ucrhousing';
    console.log('🚑 Using hardcoded MongoDB URI for Railway');
    
    console.log(`Connecting to MongoDB... cloud`);
    
    const conn = await mongoose.connect(mongoURI, {
      // Connection options for Railway and better reliability
      serverSelectionTimeoutMS: 10000, // Increased timeout for Railway
      maxPoolSize: 5 // Reduced pool size for Railway
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // PRODUCTION SAFE: Don't crash the entire app
    console.warn('⚠️  MongoDB connection failed, but keeping app running');
    return; // Don't exit
  }
};

module.exports = connectDB; 