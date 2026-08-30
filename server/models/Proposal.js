import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, required: true },
  bidAmount: { type: Number, required: true },
  estimatedDuration: { type: String },
  experienceRating: { type: Number, default: 5 }, // 1-5 yellow stars selected by freelancer
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  aiMatchScore: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Proposal', proposalSchema);
