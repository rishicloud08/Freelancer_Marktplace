import React, { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiShield, 
  FiCheckCircle, 
  FiX, 
  FiCpu,
  FiTrendingUp,
  FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DisputeModal({ isOpen, onClose, projectId, milestone, currentUser, onDisputeResolved }) {
  if (!isOpen || !milestone) return null;

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filing, setFiling] = useState(false);
  const [reason, setReason] = useState('Deliverable did not meet milestone acceptance criteria');
  const [disputeNotes, setDisputeNotes] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, [projectId]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.disputes.getProjectDisputes(projectId);
      setDisputes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log('Dispute fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDispute = async (e) => {
    e.preventDefault();
    if (!disputeNotes.trim()) return toast.error('Please explain the reason for the dispute');

    setFiling(true);
    try {
      await api.disputes.fileDispute({
        projectId,
        milestoneId: milestone._id,
        reason,
        disputeNotes
      });
      toast.success('⚖️ Dispute submitted! Gemini AI Arbitration analysis generated.');
      setDisputeNotes('');
      fetchDisputes();
      onDisputeResolved && onDisputeResolved();
    } catch (err) {
      toast.error('Failed to submit dispute');
    } finally {
      setFiling(false);
    }
  };

  const activeDispute = disputes.find(d => d.milestone?._id === milestone._id || d.milestone === milestone._id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-xl w-full overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/90 via-purple-900/90 to-slate-950/90 p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="bg-red-500/30 text-red-300 border border-red-400/30 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <FiShield /> Gemini AI Supreme Arbitrator
            </span>
          </div>

          <h3 className="text-xl font-black mt-2 text-white">
            Milestone Dispute & AI Mediation
          </h3>
          <p className="text-xs text-red-200 mt-0.5">
            Milestone: <strong className="text-white">{milestone.title}</strong> (₹{Number(milestone.amount).toLocaleString()})
          </p>
        </div>

        {/* Body */}
        <div className="p-6 bg-slate-900/70 space-y-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><LoadingSpinner /></div>
          ) : activeDispute ? (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-purple-950/60 to-indigo-950/60 rounded-3xl border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                    <FiCpu /> AI Arbitration Ruling
                  </span>
                  <span className="bg-purple-500/20 text-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30">
                    Confidence: {activeDispute.aiConfidenceScore}%
                  </span>
                </div>

                <h4 className="text-lg font-black text-white">{activeDispute.aiVerdict}</h4>
                <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
                  {activeDispute.aiArbitrationSummary}
                </p>

                {/* Allocation split bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-emerald-400">Freelancer Payout: {activeDispute.aiFreelancerShare}% (₹{Math.round(milestone.amount * activeDispute.aiFreelancerShare / 100).toLocaleString()})</span>
                    <span className="text-indigo-400">Client Refund: {activeDispute.aiClientRefundShare}% (₹{Math.round(milestone.amount * activeDispute.aiClientRefundShare / 100).toLocaleString()})</span>
                  </div>
                  <div className="w-full h-3 bg-indigo-950 rounded-full overflow-hidden flex border border-white/10">
                    <div style={{ width: `${activeDispute.aiFreelancerShare}%` }} className="bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <div style={{ width: `${activeDispute.aiClientRefundShare}%` }} className="bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Dispute filed on {new Date(activeDispute.createdAt).toLocaleDateString()} • Status: <strong className="text-white uppercase">{activeDispute.status}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleFileDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Reason for Dispute
                </label>
                <select
                  className="w-full p-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white outline-none focus:ring-2 focus:ring-red-400"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="Deliverable did not meet milestone acceptance criteria" className="bg-slate-900">Deliverable did not meet milestone acceptance criteria</option>
                  <option value="Missed agreed deadline without communication" className="bg-slate-900">Missed agreed deadline without communication</option>
                  <option value="Unsatisfactory deliverable quality or missing source code" className="bg-slate-900">Unsatisfactory deliverable quality or missing source code</option>
                  <option value="Request for partial milestone release settlement" className="bg-slate-900">Request for partial milestone release settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Detailed Explanation & Evidence
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the disagreement, references to requirements, and what resolution you propose..."
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white outline-none focus:ring-2 focus:ring-red-400"
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                />
              </div>

              <div className="bg-red-950/30 p-3 rounded-xl border border-red-500/20 text-[11px] text-red-200 flex items-start gap-2">
                <FiAlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                <span>
                  Our <strong>Supreme AI Arbitrator</strong> will review project deliverables, chat history, and milestone terms to generate an equitable dispute resolution.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={filing}
                  className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {filing ? 'Running AI Arbitration...' : '⚖️ Submit for AI Dispute Arbitration'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
