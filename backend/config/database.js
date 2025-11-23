const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI environment variable is not set');
      console.error('Please set MONGODB_URI in your Railway environment variables');
      if (process.env.NODE_ENV === 'production') {
        // In production, we should exit if DB is not configured
        process.exit(1);
      }
      return;
    }
    
    console.log('🔌 Connecting to MongoDB...');
    console.log('MongoDB URI:', mongoURI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout for Railway
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection state: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Error details:', error);
    
    // In production, exit if connection fails (Railway will restart)
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting application - Railway will restart and retry');
      process.exit(1);
    } else {
      console.log('App continuing without database (development mode)...');
    }
  }
};

module.exports = connectDB; 