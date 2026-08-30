import React, { useState } from 'react';
import { 
  FiX, 
  FiCheckCircle, 
  FiCopy, 
  FiSmartphone, 
  FiCheck, 
  FiUser, 
  FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  milestone, 
  project, 
  onPaymentSuccess 
}) {
  if (!isOpen || !milestone) return null;

  const [transactionRef, setTransactionRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const amountInRupees = milestone.amount !== undefined ? milestone.amount : 20;
  const freelancer = project?.assignedFreelancer;

  // Freelancer details (Direct Payout to Freelancer's Bank/GPay)
  const freelancerGpayNumber = freelancer?.gpayNumber || '9840827712';
  const freelancerUpiId = freelancer?.upiId || 'rishikesh2006.gr@okaxis';
  const freelancerUploadedQr = freelancer?.upiQrCode;

  // Dynamic Direct UPI Deep Link to Freelancer
  const upiDeepLink = `upi://pay?pa=${freelancerUpiId}&pn=${encodeURIComponent(freelancer?.name || 'Rishi')}&am=${amountInRupees}&cu=INR&tn=FreelanceHub-Payment-${encodeURIComponent(milestone.title || 'Project')}`;
  const generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(upiDeepLink)}`;

  const displayQrCode = freelancerUploadedQr || generatedQrUrl;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
    toast.success(`Copied ${text} to clipboard!`);
  };

  const handleConfirmDirectPayment = async () => {
    setProcessing(true);
    try {
      await api.payments.fundMilestone({
        milestoneId: milestone._id,
        paymentMethod: 'gpay_direct',
        gpayNumber: freelancerGpayNumber,
        upiId: freelancerUpiId,
        transactionRef: transactionRef || `UPI-DIR-${Date.now().toString().slice(-8)}`
      });

      setSuccess(true);
      toast.success(`🎉 ₹${amountInRupees.toLocaleString()} Direct GPay Payment Recorded!`);
      setTimeout(() => {
        setSuccess(false);
        onPaymentSuccess && onPaymentSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment confirmation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
              <FiSmartphone /> Direct Google Pay / UPI
            </span>
          </div>

          <h3 className="text-xl font-black mt-2 text-white">
            Pay Freelancer Directly
          </h3>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">₹{amountInRupees.toLocaleString()}</span>
            <span className="text-xs text-emerald-200 font-medium">Direct to Freelancer's Bank Account</span>
          </div>

          {freelancer && (
            <div className="mt-2.5 flex items-center gap-2 text-xs text-gray-300">
              <FiUser className="text-emerald-400" />
              <span>Recipient: <strong className="text-white">{freelancer.name}</strong></span>
            </div>
          )}
        </div>

        {/* Direct Payment Body */}
        <div className="p-6 space-y-5 bg-slate-900/90">
          
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center bg-white/5 p-4 rounded-2xl border border-white/10 relative">
            <p className="text-xs font-semibold text-gray-300 mb-2.5 flex items-center gap-1.5">
              <FiSmartphone className="text-emerald-400" /> Scan with Google Pay / PhonePe / Paytm
            </p>

            <div className="bg-white p-3 rounded-2xl shadow-xl w-44 h-44 flex items-center justify-center">
              <img 
                src={displayQrCode} 
                alt="Direct UPI QR Code" 
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-[11px] text-gray-400 mt-2 font-medium">
              Zero platform fees • Direct to recipient bank
            </p>
          </div>

          {/* Recipient Details & Copy Buttons */}
          <div className="space-y-2.5 text-xs">
            {/* UPI ID */}
            <div className="flex items-center justify-between bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">Freelancer UPI ID</span>
                <span className="font-mono text-emerald-300 font-bold">{freelancerUpiId}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(freelancerUpiId, 'upi')}
                className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedUpi ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                {copiedUpi ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* GPay Number */}
            <div className="flex items-center justify-between bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-bold block">GPay Mobile Number</span>
                <span className="font-mono text-emerald-300 font-bold">+91 {freelancerGpayNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(freelancerGpayNumber, 'phone')}
                className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedPhone ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                {copiedPhone ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Deep link for mobile */}
          <a
            href={upiDeepLink}
            className="block text-center bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
          >
            <span className="flex items-center justify-center gap-1.5">
              <FiSmartphone /> Open in Google Pay App <FiExternalLink className="text-xs" />
            </span>
          </a>

          {/* Optional UTR Input */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1">
              UPI Transaction Reference / UTR (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 423819283921"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-400 outline-none text-white font-mono"
            />
          </div>

          {/* Action Button */}
          <div>
            <button
              type="button"
              onClick={handleConfirmDirectPayment}
              disabled={processing || success}
              className={`w-full font-black py-3.5 px-6 rounded-2xl shadow-xl transition-all text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer ${
                success 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/40' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25'
              }`}
            >
              {success ? (
                <>
                  <FiCheckCircle className="text-lg" /> Direct Payment Recorded!
                </>
              ) : processing ? (
                'Recording Payment...'
              ) : (
                <>
                  <FiCheckCircle className="text-yellow-300" /> Confirm Direct Payment of ₹{amountInRupees.toLocaleString()}
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-gray-400">
              Funds are transferred directly between bank accounts via UPI with ₹0 platform commission.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
