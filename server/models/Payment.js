import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', required: true },
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['gpay_number', 'upi_qr', 'escrow_wallet'], 
    default: 'upi_qr' 
  },
  gpayNumber: { type: String },
  upiId: { type: String },
  transactionRef: { type: String }, // UTR / Transaction Reference Number
  status: { type: String, enum: ['funded', 'released', 'refunded'], default: 'funded' },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
