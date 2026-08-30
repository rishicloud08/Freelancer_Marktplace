import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiAward, 
  FiCheckCircle, 
  FiX, 
  FiClock, 
  FiArrowRight, 
  FiDollarSign, 
  FiVolume2,
  FiZap,
  FiUser
} from 'react-icons/fi';
import StarRating from './StarRating';

export default function ProposalPopupModal({ isOpen, onClose, proposalData }) {
  const navigate = useNavigate();

  if (!isOpen || !proposalData) return null;

  const { proposal, project, freelancer } = proposalData;
  const freelancerName = freelancer?.name || proposal?.freelancer?.name || 'Top Freelancer';
  const bidAmount = proposal?.bidAmount || project?.budgetMax || 10;
  const matchScore = proposal?.aiMatchScore || 92;
  const coverLetter = proposal?.coverLetter || 'I have reviewed your project requirements and would love to deliver high-quality work within the deadline.';
  const projectTitle = project?.title || 'Your Project';
  const projectId = project?._id || proposal?.project;

  const handleViewProposal = () => {
    onClose();
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/projects');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="glass-card bg-white/95 max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl border border-white/80 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Bar */}
        <div className="flex items-center justify-between relative z-10 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce">
              <FiZap className="text-xl" />
            </div>
            <div>
              <span className="bg-emerald-500/15 text-emerald-800 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                <FiVolume2 className="text-xs animate-pulse" /> New Proposal Received!
              </span>
              <h3 className="text-base md:text-lg font-black text-gray-900 leading-tight mt-0.5">
                New Candidate Applied
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Project Context */}
        <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100/80 text-xs">
          <span className="text-gray-500 font-semibold block text-[11px]">Applied for your project:</span>
          <strong className="text-indigo-950 font-black text-sm block truncate mt-0.5">
            {projectTitle}
          </strong>
        </div>

        {/* Freelancer Profile Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md flex-shrink-0">
              {freelancerName.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                {freelancerName}
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Verified Talent
                </span>
              </h4>
              <p className="text-xs text-gray-500">{freelancer?.email || 'Candidate'}</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-600 font-bold">
                ⭐ {freelancer?.rating || 5}.0 Rating
              </div>
            </div>
          </div>

          {/* AI Match Score Badge */}
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase">AI Fit</span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs inline-flex items-center gap-1">
              <FiZap className="text-[10px]" /> {matchScore}%
            </span>
          </div>
        </div>

        {/* Bid & Duration */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
            <span className="text-emerald-700 font-bold block text-[10px] uppercase">Bid Amount</span>
            <span className="text-xl font-black text-emerald-950 mt-0.5 block">
              ₹{Number(bidAmount).toLocaleString()}
            </span>
          </div>
          <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200">
            <span className="text-purple-700 font-bold block text-[10px] uppercase">Estimated Timeline</span>
            <span className="text-sm font-bold text-purple-950 mt-1 block truncate">
              {proposal?.estimatedDuration || '2-3 weeks'}
            </span>
          </div>
        </div>

        {/* Cover Letter Excerpt */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-700">
          <span className="font-bold text-gray-900 block text-[11px] mb-1">Pitch / Cover Letter:</span>
          <p className="line-clamp-3 leading-relaxed italic text-gray-600">
            "{coverLetter}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors cursor-pointer"
          >
            Review Later
          </button>
          
          <button
            type="button"
            onClick={handleViewProposal}
            className="flex-[2] py-3 text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Open Proposal & Hire <FiArrowRight />
          </button>
        </div>

      </div>
    </div>
  );
}
