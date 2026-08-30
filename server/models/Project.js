import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skills: [{ type: String, required: true }],
  budgetMin: { type: Number },
  budgetMax: { type: Number },
  duration: { type: String },
  status: { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
  assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
