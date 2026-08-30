import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongod = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // If a custom local or cloud MONGO_URI is specified in .env, try it first
    if (uri && !uri.includes('localhost:27017')) {
      try {
        const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
        console.log(`✅ Connected to Cloud/Remote MongoDB: ${conn.connection.host}`);
        return conn;
      } catch (err) {
        console.log('Remote MongoDB connection error:', err.message);
      }
    }

    // Try standard local MongoDB
    try {
      const conn = await mongoose.connect('mongodb://localhost:27017/freelance-marketplace', { 
        serverSelectionTimeoutMS: 2000 
      });
      console.log(`✅ Local MongoDB Service Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      // Local service not running, fallback to persistent standalone storage
    }

    // Persistent Standalone MongoDB Server on Disk
    const dbDir = path.join(__dirname, '../data/db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`📁 Initializing persistent storage at: ${dbDir}`);

    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: dbDir,
        storageEngine: 'wiredTiger',
      }
    });

    uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ Persistent MongoDB Database Online: ${conn.connection.host}`);
    console.log(`💾 All registered users and projects will permanently persist in ./server/data/db`);
    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
