import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractTitle: { type: String, required: true },
  totalBudget: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  slaTerms: { type: String, required: true },
  ipClauses: { type: String, default: 'Full intellectual property and commercial copyright transfer to Client upon 100% escrow settlement.' },
  
  // Signatures
  clientSigned: { type: Boolean, default: false },
  clientSignatureName: { type: String, default: '' },
  clientSignedAt: { type: Date },

  freelancerSigned: { type: Boolean, default: false },
  freelancerSignatureName: { type: String, default: '' },
  freelancerSignedAt: { type: Date },

  status: { 
    type: String, 
    enum: ['draft', 'pending_signatures', 'active', 'completed', 'terminated'], 
    default: 'pending_signatures' 
  },
  contractHash: { type: String }
}, { timestamps: true });

export default mongoose.model('Contract', contractSchema);
