const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // EMERGENCY RAILWAY FIX: Use internal Railway network
    // Railway services communicate via mongodb.railway.internal, not public domains
    const mongoURI = 'mongodb://mongo:HenGsHmsxgReveohpTWSTLvVSzpADZYX@mongodb.railway.internal:27017/ucrhousing';
    console.log('🚑 Using hardcoded Railway internal MongoDB URI');
    
    console.log(`Connecting to MongoDB... Railway-Internal`);
    
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