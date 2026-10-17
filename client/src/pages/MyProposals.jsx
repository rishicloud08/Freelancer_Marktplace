import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AIMatchBadge from '../components/AIMatchBadge';
import StarRating from '../components/StarRating';
import { FiClock, FiFileText, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyProposals() {
  const { user } = useContext(AuthContext);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await api.proposals.getMyProposals();
      setProposals(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  }

  const filteredProposals = proposals.filter(p => 
    filter === 'All' ? true : p.status?.toLowerCase() === filter.toLowerCase()
  );

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': 
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Accepted 🎉</span>;
      case 'rejected': 
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Declined</span>;
      default: 
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Under Review</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 md:p-8 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">My Submitted Proposals</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">Track and manage your client pitches and bid statuses in Rupees (₹)</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden mb-6">
        <div className="flex border-b border-slate-800 overflow-x-auto">
          {['All', 'Pending', 'Accepted', 'Rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 md:flex-none px-6 py-4 text-xs font-bold text-center transition-colors cursor-pointer ${
                filter === tab 
                  ? 'border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredProposals.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-3xl border border-slate-800">
          <FiFileText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No proposals found</h3>
          <p className="text-slate-400 text-xs mb-6 max-w-sm mx-auto">
            {filter === 'All' 
              ? "You haven't submitted any proposals yet. Browse projects to submit your first proposal!"
              : `You don't have any ${filter.toLowerCase()} proposals.`}
          </p>
          <Link 
            to="/projects"
            className="inline-flex items-center px-6 py-3 rounded-2xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <div key={proposal._id} className="glass-card p-6 md:p-7 rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link to={`/projects/${proposal.project?._id}`} className="text-lg md:text-xl font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1">
                      {proposal.project?.title || 'Project'}
                    </Link>
                    {getStatusBadge(proposal.status)}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-3">
                    <span className="font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/30">
                      Bid: ₹{Number(proposal.bidAmount).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1"><FiClock /> {proposal.estimatedDuration || '2-4 weeks'}</span>
                    {proposal.experienceRating && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Self-Rating:</span>
                        <StarRating value={proposal.experienceRating} readOnly size="sm" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    "{proposal.coverLetter}"
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {proposal.aiMatchScore && <AIMatchBadge score={proposal.aiMatchScore} />}
                  <Link
                    to={`/projects/${proposal.project?._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 mt-2"
                  >
                    View Project <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}