const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    
    // Set a lower timeout to quickly fallback if local mongo is down
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Standard MongoDB connection failed (${error.message}). Initializing MongoMemoryServer...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host} (${memUri})`);
    } catch (memError) {
      console.error(`Failed to start MongoMemoryServer: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
