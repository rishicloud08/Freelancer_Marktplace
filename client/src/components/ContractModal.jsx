import React, { useState, useEffect } from 'react';
import { 
  FiFileText, 
  FiShield, 
  FiCheckCircle, 
  FiLock, 
  FiEdit3, 
  FiX, 
  FiCheck,
  FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ContractModal({ isOpen, onClose, projectId, currentUser }) {
  if (!isOpen) return null;

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [signatureName, setSignatureName] = useState(currentUser?.name || '');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [projectId]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const res = await api.contracts.getProjectContract(projectId);
      setContract(res.data);
    } catch (err) {
      console.log('Contract fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async () => {
    setGenerating(true);
    try {
      const res = await api.contracts.generateContract({ projectId });
      setContract(res.data);
      toast.success('📜 Gemini AI drafted an official Service Level Agreement (SLA)!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate contract');
    } finally {
      setGenerating(false);
    }
  };

  const handleSignContract = async (e) => {
    e.preventDefault();
    if (!signatureName.trim()) return toast.error('Please enter your full signature name');

    setSigning(true);
    try {
      const res = await api.contracts.signContract({
        contractId: contract._id,
        signatureName
      });
      setContract(res.data);
      toast.success('✍️ Contract digitally signed with timestamped hash!');
    } catch (err) {
      toast.error('Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  const isClient = currentUser?.role === 'client';
  const hasUserSigned = isClient ? contract?.clientSigned : contract?.freelancerSigned;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-950/90 p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/30 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <FiShield /> Cryptographically Secured SLA
            </span>
          </div>

          <h3 className="text-xl font-black mt-2 text-white">
            AI Smart Contract & Digital IP Agreement
          </h3>
          <p className="text-xs text-indigo-200 mt-0.5">
            Legally binding freelance terms in Indian Rupees (₹) with dual digital signatures.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 bg-slate-900/70 space-y-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-12"><LoadingSpinner /></div>
          ) : !contract ? (
            <div className="text-center py-12 space-y-4">
              <FiFileText className="w-14 h-14 mx-auto text-indigo-400 opacity-60" />
              <h4 className="text-base font-bold text-white">No Agreement Drafted Yet</h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Generate an AI-drafted contract with scope definition, milestones, and intellectual property transfer clauses.
              </p>
              <button
                onClick={handleGenerateContract}
                disabled={generating}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {generating ? 'Drafting Agreement...' : '✨ Generate AI Smart Contract'}
              </button>
            </div>
          ) : (
            <>
              {/* Contract Terms Box */}
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex justify-between items-start border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-white">{contract.contractTitle}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Client: <strong>{contract.client?.name}</strong> • Freelancer: <strong>{contract.freelancer?.name}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                    ₹{Number(contract.totalBudget).toLocaleString()} INR
                  </span>
                </div>

                <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed font-sans max-h-60 overflow-y-auto bg-black/30 p-4 rounded-2xl border border-white/5">
                  {contract.slaTerms}
                </div>

                <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-[11px] text-purple-200">
                  🛡️ <strong>IP Ownership Clause:</strong> {contract.ipClauses}
                </div>

                {contract.contractHash && (
                  <p className="text-[10px] text-gray-500 font-mono truncate">
                    SHA256 Token: {contract.contractHash}
                  </p>
                )}
              </div>

              {/* Signatures Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${contract.clientSigned ? 'bg-emerald-900/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">Client Signature:</span>
                    {contract.clientSigned ? <span className="text-xs">✓ Signed</span> : <span className="text-xs text-yellow-400">Pending</span>}
                  </div>
                  {contract.clientSigned ? (
                    <p className="text-sm font-bold text-white font-mono italic">"{contract.clientSignatureName}"</p>
                  ) : (
                    <p className="text-xs italic">Awaiting client e-signature</p>
                  )}
                </div>

                <div className={`p-4 rounded-2xl border ${contract.freelancerSigned ? 'bg-emerald-900/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">Freelancer Signature:</span>
                    {contract.freelancerSigned ? <span className="text-xs">✓ Signed</span> : <span className="text-xs text-yellow-400">Pending</span>}
                  </div>
                  {contract.freelancerSigned ? (
                    <p className="text-sm font-bold text-white font-mono italic">"{contract.freelancerSignatureName}"</p>
                  ) : (
                    <p className="text-xs italic">Awaiting freelancer e-signature</p>
                  )}
                </div>
              </div>

              {/* Digital Signature Pad Form */}
              {!hasUserSigned ? (
                <form onSubmit={handleSignContract} className="bg-white/10 p-5 rounded-2xl border border-white/15 space-y-3">
                  <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <FiEdit3 className="text-indigo-400" /> Sign Agreement as {currentUser?.name}
                  </h5>
                  <input
                    required
                    type="text"
                    placeholder="Type your full legal name to digitally sign"
                    className="w-full px-3.5 py-2.5 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-white font-mono"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={signing}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {signing ? 'Signing Contract...' : '✍️ Apply Digital Signature'}
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-500/30 text-center text-xs text-emerald-300 font-bold">
                  ✓ You have digitally signed this agreement.
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
