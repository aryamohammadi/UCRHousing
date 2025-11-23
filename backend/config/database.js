const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    // Priority: MONGO_URL (Railway internal, free) > MONGODB_URI (MongoDB Atlas)
    // DO NOT use MONGO_PUBLIC_URL (external, incurs egress fees)
    const mongoURI = process.env.MONGO_URL || process.env.MONGODB_URI;
    
    // Debug: Show what we found
    console.log('🔍 Environment variable check:');
    console.log('  MONGO_URL:', process.env.MONGO_URL ? `SET (${process.env.MONGO_URL.substring(0, 30)}...)` : 'NOT SET');
    console.log('  MONGODB_URI:', process.env.MONGODB_URI ? `SET (${process.env.MONGODB_URI.substring(0, 30)}...)` : 'NOT SET');
    
    if (!mongoURI) {
      console.error('❌ MongoDB connection string not found');
      console.error('Please set either MONGO_URL (Railway MongoDB) or MONGODB_URI (MongoDB Atlas)');
      console.error('⚠️  Do NOT use MONGO_PUBLIC_URL (it incurs egress fees)');
      console.error('');
      console.error('To fix: Go to Railway → Backend Service → Variables → Add MONGODB_URI');
      if (process.env.NODE_ENV === 'production') {
        // In production, we should exit if DB is not configured
        console.error('Exiting - Railway will restart');
        process.exit(1);
      }
      return;
    }
    
    // Prevent connecting to localhost in production
    if (mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1')) {
      console.error('❌ Invalid MongoDB URI - contains localhost');
      console.error('This will not work on Railway. Use MongoDB Atlas or Railway MongoDB service.');
      console.error('Current URI (masked):', mongoURI.replace(/:[^:@]+@/, ':****@'));
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      return;
    }
    
    // Log which connection we're using (hide password)
    const connectionType = process.env.MONGO_URL ? 'Railway Internal (MONGO_URL)' : 'MongoDB Atlas (MONGODB_URI)';
    console.log(`🔌 Using ${connectionType}`);
    
    console.log('🔌 Connecting to MongoDB...');
    const maskedURI = mongoURI.replace(/:[^:@]+@/, ':****@');
    console.log('MongoDB URI:', maskedURI);
    console.log('URI length:', mongoURI.length);
    console.log('URI starts with mongodb:', mongoURI.startsWith('mongodb'));
    
    // Simplified connection options with longer timeouts
    const connectOptions = {
      serverSelectionTimeoutMS: 30000, // 30 seconds to find server
      socketTimeoutMS: 45000, // 45 seconds for socket operations
      connectTimeoutMS: 30000, // 30 seconds to establish connection
      maxPoolSize: 10,
      bufferMaxEntries: 0, // Disable buffering - fail immediately if not connected
      bufferCommands: false // Don't buffer commands
    };
    
    // Add database name if not in URI (for MongoDB Atlas)
    let finalURI = mongoURI;
    if (mongoURI.includes('mongodb+srv://') && !mongoURI.includes('/ucrhousing') && !mongoURI.includes('?') && !mongoURI.endsWith('/')) {
      finalURI = mongoURI.endsWith('/') ? mongoURI + 'ucrhousing' : mongoURI + '/ucrhousing';
      console.log('Added database name to URI');
    }
    
    console.log('Attempting connection with options:', JSON.stringify(connectOptions, null, 2));
    const conn = await mongoose.connect(finalURI, connectOptions);

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
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Check what connection string we tried to use
    const attemptedURI = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (attemptedURI) {
      console.error('Attempted URI (masked):', attemptedURI.replace(/:[^:@]+@/, ':****@'));
      console.error('URI exists:', !!attemptedURI);
      console.error('URI length:', attemptedURI.length);
    } else {
      console.error('❌ NO CONNECTION STRING FOUND!');
      console.error('MONGO_URL:', process.env.MONGO_URL ? 'SET' : 'NOT SET');
      console.error('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    }
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('💡 Authentication failed - check username/password in connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 DNS/Network error - check MongoDB Atlas Network Access (allow 0.0.0.0/0)');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Connection timeout - check network access and firewall settings');
    } else if (error.message.includes('buffering')) {
      console.error('💡 Buffering timeout - MongoDB never connected. Check connection string and network access.');
    }
    
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