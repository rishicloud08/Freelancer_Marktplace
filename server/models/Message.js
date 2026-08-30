import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
