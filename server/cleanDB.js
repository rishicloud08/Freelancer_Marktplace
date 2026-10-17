import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Project from './models/Project.js';
import Proposal from './models/Proposal.js';
import Milestone from './models/Milestone.js';
import Payment from './models/Payment.js';
import Message from './models/Message.js';
import Review from './models/Review.js';
import Contract from './models/Contract.js';
import Dispute from './models/Dispute.js';
import Task from './models/Task.js';

dotenv.config();

const clearAllData = async (uri) => {
  try {
    console.log(`Connecting to: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ Connected to DB: ${conn.connection.host} / ${conn.connection.name}`);

    const resUser = await User.deleteMany({});
    const resProj = await Project.deleteMany({});
    const resProp = await Proposal.deleteMany({});
    const resMile = await Milestone.deleteMany({});
    const resPay = await Payment.deleteMany({});
    const resMsg = await Message.deleteMany({});
    const resRev = await Review.deleteMany({});
    const resCont = await Contract.deleteMany({});
    const resDisp = await Dispute.deleteMany({});
    const resTask = await Task.deleteMany({});

    console.log(`Deleted:`);
    console.log(` - Users: ${resUser.deletedCount}`);
    console.log(` - Projects: ${resProj.deletedCount}`);
    console.log(` - Proposals: ${resProp.deletedCount}`);
    console.log(` - Milestones: ${resMile.deletedCount}`);
    console.log(` - Payments: ${resPay.deletedCount}`);
    console.log(` - Messages: ${resMsg.deletedCount}`);
    console.log(` - Reviews: ${resRev.deletedCount}`);
    console.log(` - Contracts: ${resCont.deletedCount}`);
    console.log(` - Disputes: ${resDisp.deletedCount}`);
    console.log(` - Tasks: ${resTask.deletedCount}`);

    await mongoose.disconnect();
    console.log(`✅ Database wipe completed successfully.`);
  } catch (err) {
    console.error(`❌ Error clearing DB:`, err.message);
  }
};

const run = async () => {
  // 1. Try remote MongoDB Atlas if provided or configured
  const atlasUri = process.env.MONGO_URI && !process.env.MONGO_URI.includes('localhost') 
    ? process.env.MONGO_URI 
    : 'mongodb+srv://rishikesh2006gr_db_user:rQpX0rLuoinIRhCe@cluster0.11uyep8.mongodb.net/freelance-marketplace?retryWrites=true&w=majority&compressors=zlib';

  if (atlasUri) {
    console.log('\n--- Cleaning Atlas MongoDB ---');
    await clearAllData(atlasUri);
  }

  // 2. Try default database name on cluster
  const defaultAtlasUri = 'mongodb+srv://rishikesh2006gr_db_user:rQpX0rLuoinIRhCe@cluster0.11uyep8.mongodb.net/test?retryWrites=true&w=majority&compressors=zlib';
  console.log('\n--- Cleaning Atlas MongoDB (test db) ---');
  await clearAllData(defaultAtlasUri);

  console.log('\nFinished all database clear attempts.');
  process.exit(0);
};

run();
