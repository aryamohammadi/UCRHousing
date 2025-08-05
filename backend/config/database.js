const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // EMERGENCY RAILWAY FIX: Use correct Railway internal private domain
    // Based on public domain: mongodb-production-c5d1.up.railway.app
    // Internal equivalent: mongodb-production-c5d1.railway.internal
    const mongoURI = 'mongodb://mongo:HenGsHmsxgReveohpTWSTLvVSzpADZYX@mongodb-production-c5d1.railway.internal:27017/ucrhousing';
    console.log('🚑 Using Railway internal private domain for MongoDB');
    
    console.log(`Connecting to MongoDB... Railway-Private`);
    
    const conn = await mongoose.connect(mongoURI, {
      // Connection options for Railway internal network
      serverSelectionTimeoutMS: 5000, // Reduced timeout for internal network
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