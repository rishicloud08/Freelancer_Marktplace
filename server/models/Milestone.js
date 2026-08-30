import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'approved'], default: 'pending' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  
  // Deliverable Submission & AI Audit
  repoUrl: { type: String, default: '' },
  demoUrl: { type: String, default: '' },
  deliverableNotes: { type: String, default: '' },
  submittedAt: { type: Date },
  aiReviewScore: { type: Number, default: 0 },
  aiReviewFeedback: { type: String, default: '' },
  aiReviewSecurityPassed: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Milestone', milestoneSchema);
