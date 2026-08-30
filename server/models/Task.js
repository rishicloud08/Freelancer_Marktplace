import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['backlog', 'in-progress', 'ai-review', 'done'], 
    default: 'backlog' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  storyPoints: { type: Number, default: 3 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
