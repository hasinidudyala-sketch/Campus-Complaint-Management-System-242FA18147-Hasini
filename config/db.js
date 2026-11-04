/**
 * CAMPUSCARE - Database Connection Module
 * Connects to MongoDB Atlas or local MongoDB using Mongoose.
 * Includes graceful fallback to in-memory MongoDB for offline/development testing.
 */

const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuscare_vfstr';

  try {
    console.log(`[MongoDB] Attempting connection to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    // Set strictQuery setting
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Primary connection failed: ${err.message}`);

    // If running in development and primary connection failed, try MongoDB Memory Server as fallback
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Initializing in-memory MongoDB instance for offline development/testing...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();

        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] In-Memory MongoDB connected at: ${memUri}`);
        console.log('[MongoDB] NOTE: Configure your MONGODB_URI in .env for persistent MongoDB Atlas storage.');
        return conn;
      } catch (memErr) {
        console.error('[MongoDB] In-Memory MongoDB failed to initialize:', memErr.message);
        throw err;
      }
    } else {
      throw err;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('[MongoDB] Disconnected.');
  } catch (err) {
    console.error('[MongoDB] Disconnect error:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };

