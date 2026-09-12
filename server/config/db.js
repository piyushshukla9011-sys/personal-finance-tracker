const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';
    console.log(`Connecting to MongoDB...`);
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    
    // Fallback to in-memory DB only in local development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Initializing MongoMemoryServer fallback for local development...`);
      try {
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (memError) {
        console.error(`Failed to start MongoMemoryServer: ${memError.message}`);
      }
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
