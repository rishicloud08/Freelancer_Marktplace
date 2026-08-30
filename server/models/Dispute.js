import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', required: true },
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  reason: { type: String, required: true },
  disputeNotes: { type: String, required: true },
  disputedAmount: { type: Number, required: true },

  // AI Arbitration Results
  aiVerdict: { type: String, default: '' },
  aiFreelancerShare: { type: Number, default: 50 }, // % allocated to freelancer
  aiClientRefundShare: { type: Number, default: 50 }, // % refunded to client
  aiArbitrationSummary: { type: String, default: '' },
  aiConfidenceScore: { type: Number, default: 90 },

  status: {
    type: String,
    enum: ['open', 'under_ai_review', 'resolved', 'closed'],
    default: 'open'
  },
  resolvedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Dispute', disputeSchema);
