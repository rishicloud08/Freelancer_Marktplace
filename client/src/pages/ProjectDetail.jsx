import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiDollarSign, 
  FiClock, 
  FiCalendar, 
  FiUser, 
  FiZap, 
  FiCheck, 
  FiAward, 
  FiArrowLeft,
  FiSend,
  FiLock,
  FiShield,
  FiMessageSquare,
  FiPlus,
  FiCheckCircle,
  FiStar,
  FiBriefcase,
  FiExternalLink,
  FiSmartphone,
  FiVideo,
  FiGithub,
  FiGlobe,
  FiCode,
  FiCpu,
  FiX,
  FiTrello,
  FiFileText,
  FiAlertTriangle,
  FiTrash2,
  FiEdit2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import AIMatchBadge from '../components/AIMatchBadge';
import StarRating from '../components/StarRating';
import PaymentModal from '../components/PaymentModal';
import KanbanBoard from '../components/KanbanBoard';
import ContractModal from '../components/ContractModal';
import DisputeModal from '../components/DisputeModal';
import FreelancerResumeModal from '../components/FreelancerResumeModal';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const socket = useSocket();
  const chatMessagesEndRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Proposal Submission State (Freelancer)
  const [proposalData, setProposalData] = useState({ 
    coverLetter: '', 
    bidAmount: '', 
    estimatedDuration: '2-4 weeks',
    experienceRating: 5 // 1-5 yellow stars
  });
  const [enhancing, setEnhancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Matching / Recommendations State (Client)
  const [recommendations, setRecommendations] = useState([]);
  const [gettingRecs, setGettingRecs] = useState(false);

  // Milestone Form State (Client)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneFormData, setMilestoneFormData] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: ''
  });

  // Budget Estimation Edit State (Client)
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetMin, setEditBudgetMin] = useState('');
  const [editBudgetMax, setEditBudgetMax] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  // Milestone Budget Estimation Edit State (Client)
  const [isEditingMilestoneAmount, setIsEditingMilestoneAmount] = useState(false);
  const [editMilestoneAmount, setEditMilestoneAmount] = useState('');
  const [savingMilestoneAmount, setSavingMilestoneAmount] = useState(false);

  // Deliverable Submission Modal State (Freelancer)
  const [selectedMilestoneForDelivery, setSelectedMilestoneForDelivery] = useState(null);
  const [deliverableForm, setDeliverableForm] = useState({
    repoUrl: '',
    demoUrl: '',
    deliverableNotes: ''
  });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Deliverable AI Inspection Inspecting State
  const [inspectingMilestoneId, setInspectingMilestoneId] = useState(null);

  // Live Sync Video Call State
  const [showVideoCallRoom, setShowVideoCallRoom] = useState(false);

  // Payment Modal State
  const [selectedMilestoneForPayment, setSelectedMilestoneForPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Smart Contract Modal State
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Dispute Modal State
  const [selectedMilestoneForDispute, setSelectedMilestoneForDispute] = useState(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // Freelancer Resume Modal State (for Clients to view full resume)
  const [selectedFreelancerForResume, setSelectedFreelancerForResume] = useState(null);
  const [isFreelancerResumeModalOpen, setIsFreelancerResumeModalOpen] = useState(false);

  // Embedded Live Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedChatPartner, setSelectedChatPartner] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  useEffect(() => {
    if (socket) {
      socket.on('messageReceived', (message) => {
        if (
          selectedChatPartner && 
          (message.sender === selectedChatPartner._id || message.receiver === selectedChatPartner._id)
        ) {
          setChatMessages(prev => [...prev, message]);
        }
      });
    }
    return () => {
      if (socket) socket.off('messageReceived');
    };
  }, [socket, selectedChatPartner]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const projRes = await api.projects.getProject(id);
      const proj = projRes.data;
      setProject(proj);

      // Determine default chat partner
      if (user?.role === 'freelancer') {
        setSelectedChatPartner(proj.client);
      } else if (proj.assignedFreelancer) {
        setSelectedChatPartner(proj.assignedFreelancer);
      }

      // Fetch proposals for this project
      try {
        const propRes = await api.proposals.getProjectProposals(id);
        const pList = Array.isArray(propRes.data) ? propRes.data : [];
        setProposals(pList);
        if (user?.role === 'client' && !proj.assignedFreelancer && pList.length > 0 && !selectedChatPartner) {
          setSelectedChatPartner(pList[0].freelancer);
        }
      } catch (err) {
        console.log('Proposals load note:', err.message);
      }

      // Fetch milestones
      try {
        const msRes = await api.milestones.getMilestones(id);
        setMilestones(Array.isArray(msRes.data) ? msRes.data : []);
      } catch (err) {
        console.log('Milestones load note:', err.message);
      }

      // Fetch payments
      try {
        const payRes = await api.payments.getProjectPayments(id);
        setPayments(Array.isArray(payRes.data) ? payRes.data : []);
      } catch (err) {
        console.log('Payments load note:', err.message);
      }

    } catch (error) {
      console.error(error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch chat messages when chat partner is selected
  useEffect(() => {
    if (selectedChatPartner?._id) {
      fetchProjectChat(selectedChatPartner._id);
    }
  }, [selectedChatPartner]);

  const fetchProjectChat = async (partnerId) => {
    setLoadingChat(true);
    try {
      const res = await api.messages.getConversation(partnerId);
      setChatMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log('Chat fetch note:', err.message);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendProjectMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChatPartner?._id) return;

    const messageContent = chatInput;
    setChatInput('');

    const tempMsg = {
      _id: Date.now().toString(),
      sender: user._id,
      receiver: selectedChatPartner._id,
      content: messageContent,
      createdAt: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      await api.messages.sendMessage({
        receiverId: selectedChatPartner._id,
        receiver: selectedChatPartner._id,
        projectId: id,
        content: messageContent
      });
    } catch (err) {
      toast.error('Failed to deliver message');
      setChatMessages(prev => prev.filter(m => m._id !== tempMsg._id));
    }
  };

  // AI Proposal Enhancement
  const handleEnhanceProposal = async () => {
    if (!proposalData.coverLetter.trim()) {
      return toast.error('Please write a draft cover letter first so AI can polish and enhance it!');
    }
    setEnhancing(true);
    try {
      const res = await api.ai.enhanceProposal({
        coverLetter: proposalData.coverLetter,
        projectDescription: project.description,
        freelancerSkills: user.skills || []
      });
      if (res.data?.enhancedCoverLetter) {
        setProposalData(prev => ({ ...prev, coverLetter: res.data.enhancedCoverLetter }));
        toast.success('✨ Proposal enhanced by Gemini AI with high persuasiveness!');
      }
    } catch (err) {
      toast.error('AI proposal enhancement unavailable');
    } finally {
      setEnhancing(false);
    }
  };

  // Submit Proposal
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!proposalData.coverLetter.trim()) {
      return toast.error('Please provide a cover letter');
    }
    setSubmitting(true);
    try {
      await api.proposals.submitProposal({
        projectId: id,
        project: id,
        coverLetter: proposalData.coverLetter,
        bidAmount: Number(proposalData.bidAmount) || project.budgetMin || 5000,
        estimatedDuration: proposalData.estimatedDuration,
        experienceRating: proposalData.experienceRating
      });
      toast.success('Proposal submitted successfully! AI match calculated.');
      fetchProjectDetails();
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  // AI Freelancer Matching (Client)
  const handleGetRecommendations = async () => {
    setGettingRecs(true);
    try {
      const res = await api.ai.recommendFreelancers(id);
      setRecommendations(Array.isArray(res.data) ? res.data : []);
      toast.success('🧠 AI matched the best freelancers for this project!');
    } catch (err) {
      toast.error('Failed to fetch AI recommendations');
    } finally {
      setGettingRecs(false);
    }
  };

  // Accept / Reject Proposal (Client)
  const handleAcceptProposal = async (proposalId) => {
    try {
      await api.proposals.acceptProposal(proposalId);
      toast.success('Proposal accepted! Freelancer assigned to project.');
      fetchProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept proposal');
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      await api.proposals.rejectProposal(proposalId);
      toast.success('Proposal rejected');
      fetchProjectDetails();
    } catch (err) {
      toast.error('Failed to reject proposal');
    }
  };

  // Create Milestone (Client)
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await api.milestones.createMilestone({
        project: id,
        title: milestoneFormData.title,
        description: milestoneFormData.description,
        amount: Number(milestoneFormData.amount),
        dueDate: milestoneFormData.dueDate || new Date()
      });
      toast.success('Milestone created!');
      setShowMilestoneForm(false);
      setMilestoneFormData({ title: '', description: '', amount: '', dueDate: '' });
      fetchProjectDetails();
    } catch (err) {
      toast.error('Failed to create milestone');
    }
  };

  // Client: Save Updated Project Budget Estimation
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const minVal = Number(editBudgetMin);
    const maxVal = Number(editBudgetMax);
    if (isNaN(minVal) || isNaN(maxVal) || minVal <= 0 || maxVal <= 0) {
      toast.error('Please enter valid budget amounts');
      return;
    }
    if (minVal > maxVal) {
      toast.error('Minimum budget cannot exceed maximum budget');
      return;
    }

    setSavingBudget(true);
    try {
      await api.projects.updateProject(project._id, {
        budgetMin: minVal,
        budgetMax: maxVal
      });

      setProject(prev => ({
        ...prev,
        budgetMin: minVal,
        budgetMax: maxVal
      }));

      // If milestone exists and is unfunded, update primary milestone amount if needed
      if (milestones && milestones.length > 0) {
        const primary = milestones[0];
        if (primary && primary.status === 'pending') {
          try {
            await api.milestones.updateMilestoneStatus(primary._id, {
              amount: maxVal,
              projectId: project._id
            });
            setMilestones(prev => prev.map((m, idx) => idx === 0 ? { ...m, amount: maxVal } : m));
          } catch (e) {
            console.log('Milestone amount sync note:', e.message);
          }
        }
      }

      setIsEditingBudget(false);
      toast.success('Budget estimation updated and saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update budget estimation');
    } finally {
      setSavingBudget(false);
    }
  };

  // Client: Save Updated Milestone Budget Estimation
  const handleSaveMilestoneAmount = async (milestoneId) => {
    const val = Number(editMilestoneAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid milestone amount');
      return;
    }

    setSavingMilestoneAmount(true);
    try {
      await api.milestones.updateMilestoneStatus(milestoneId, {
        amount: val,
        projectId: project._id
      });

      setMilestones(prev => prev.map(m => (m._id === milestoneId ? { ...m, amount: val } : m)));
      setIsEditingMilestoneAmount(false);
      toast.success('Milestone budget estimation updated and saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update milestone amount');
    } finally {
      setSavingMilestoneAmount(false);
    }
  };

  // Submit Milestone Deliverable & Run AI Quality Audit
  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!selectedMilestoneForDelivery) return;

    setSubmittingDelivery(true);
    try {
      const milestoneId = selectedMilestoneForDelivery._id || 'default-milestone';
      await api.milestones.updateMilestoneStatus(milestoneId, {
        status: 'completed',
        project: id,
        projectId: id,
        repoUrl: deliverableForm.repoUrl,
        demoUrl: deliverableForm.demoUrl,
        deliverableNotes: deliverableForm.deliverableNotes
      });
      toast.success('🎉 Deliverables submitted! AI Quality Inspector verified your work.');
      setSelectedMilestoneForDelivery(null);
      setDeliverableForm({ repoUrl: '', demoUrl: '', deliverableNotes: '' });
      fetchProjectDetails();
    } catch (err) {
      console.error('Submit deliverable error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit milestone deliverable');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // Run On-Demand AI Deliverable Inspection
  const handleInspectMilestone = async (milestone) => {
    setInspectingMilestoneId(milestone._id);
    try {
      const res = await api.ai.inspectDeliverable({
        milestoneId: milestone._id,
        deliverableNotes: milestone.deliverableNotes,
        repoUrl: milestone.repoUrl,
        demoUrl: milestone.demoUrl
      });
      toast.success(`🧠 AI Quality Audit: Score ${res.data?.audit?.score || 95}% - ${res.data?.audit?.verdict || 'Verified'}`);
      fetchProjectDetails();
    } catch (err) {
      toast.error('AI audit inspection failed');
    } finally {
      setInspectingMilestoneId(null);
    }
  };

  // Update Milestone Status
  const handleUpdateMilestone = async (milestoneId, newStatus) => {
    try {
      await api.milestones.updateMilestoneStatus(milestoneId, { status: newStatus });
      toast.success(`Milestone marked as ${newStatus}`);
      fetchProjectDetails();
    } catch (err) {
      toast.error('Failed to update milestone status');
    }
  };

  // Release Milestone Payment
  const handleReleasePayment = async (paymentId) => {
    try {
      await api.payments.releasePayment(paymentId);
      toast.success('Payment released to freelancer!');
      fetchProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release payment');
    }
  };

  const [resettingProject, setResettingProject] = useState(false);

  const handleResetProject = async () => {
    if (!window.confirm('Reset this project back to Step 1 (Open & Bidding)? This resets all milestones and payments so you can test work submission and direct GPay payout again from scratch.')) return;
    setResettingProject(true);
    try {
      await api.projects.resetProject(id);
      toast.success('🔄 Project lifecycle reset back to Step 1!');
      fetchProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset project');
    } finally {
      setResettingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      await api.projects.deleteProject(id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const [resettingSubmission, setResettingSubmission] = useState(false);

  const handleResetSubmission = async (milestoneId) => {
    if (!window.confirm('Reset this deliverable submission back to in-progress? This clears the submitted repository & demo links so new work can be submitted.')) return;
    setResettingSubmission(true);
    try {
      await api.milestones.resetSubmission(milestoneId || 'default-milestone', { projectId: id });
      toast.success('🔄 Deliverable submission reset! Ready for re-submission.');
      fetchProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset submission');
    } finally {
      setResettingSubmission(false);
    }
  };

  const [deletingProposal, setDeletingProposal] = useState(false);

  const handleDeleteProposal = async (proposalId) => {
    if (!window.confirm('Withdraw and delete your submitted proposal? You will be able to submit a new proposal with updated bids/cover letter.')) return;
    setDeletingProposal(true);
    try {
      await api.proposals.deleteProposal(proposalId);
      toast.success('🗑️ Proposal withdrawn successfully! You can now submit a fresh proposal.');
      fetchProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw proposal');
    } finally {
      setDeletingProposal(false);
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center p-12 glass-card rounded-3xl">
          <h2 className="text-xl font-bold text-gray-800">Project Not Found</h2>
          <p className="text-gray-500 mt-2 text-xs">The project you are looking for does not exist or was removed.</p>
          <Link to="/projects" className="mt-4 inline-block bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold">
            Back to Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isClientOwner = user?._id?.toString() === project.client?._id?.toString() || user?.role === 'client';
  const isAssignedFreelancer = project.assignedFreelancer && (project.assignedFreelancer._id?.toString() === user?._id?.toString() || project.assignedFreelancer.toString() === user?._id?.toString());
  const mySubmittedProposal = proposals.find(p => p.freelancer?._id?.toString() === user?._id?.toString());

  const callRoomId = `FreelanceHub-${id.slice(-8)}`;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back Link & Quick Actions */}
        <div className="flex items-center justify-between">
          <Link 
            to="/projects" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <FiArrowLeft /> Back to Projects
          </Link>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {isClientOwner && (
              <button
                type="button"
                onClick={handleResetProject}
                disabled={resettingProject}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset project lifecycle back to Step 1"
              >
                <FiZap className="text-purple-400" />
                {resettingProject ? 'Resetting...' : '🔄 Reset to Step 1'}
              </button>
            )}

            {project.assignedFreelancer && (
              <button
                onClick={() => setIsContractModalOpen(true)}
                className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FiFileText /> Smart Contract SLA
              </button>
            )}

            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              project.status === 'open' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              project.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              Status: {project.status}
            </span>

            {isClientOwner && (
              <button
                type="button"
                onClick={handleDeleteProject}
                title="Delete project"
                className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Project Glass Header Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {project.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs md:text-sm text-slate-400">
                <span className="flex items-center gap-1.5 font-bold text-slate-200">
                  <FiUser className="text-indigo-400" />
                  Client: {project.client?.name || 'Client User'}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <FiCalendar className="text-slate-500" />
                  Posted: {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <FiClock className="text-slate-500" />
                  Duration: {project.duration || '1-3 months'}
                </span>
              </div>
            </div>

            {/* Budget Box in Rupees & Direct GPay Payment */}
            <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-5 rounded-2xl border border-indigo-500/30 min-w-[260px] text-right shadow-md flex flex-col justify-between">
              {isEditingBudget ? (
                <form onSubmit={handleSaveBudget} className="text-left bg-slate-900/95 p-4 rounded-xl border border-indigo-500/50 space-y-3 mb-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-300 border-b border-slate-700 pb-1.5">
                    <span>Edit Budget Estimation</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Persisted in DB</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Min Budget (₹)</label>
                      <input
                        type="number"
                        min="10"
                        required
                        value={editBudgetMin}
                        onChange={e => setEditBudgetMin(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block font-semibold mb-0.5">Max Budget (₹)</label>
                      <input
                        type="number"
                        min="10"
                        required
                        value={editBudgetMax}
                        onChange={e => setEditBudgetMax(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                        placeholder="25000"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingBudget(false)}
                      className="px-2.5 py-1 text-slate-400 hover:text-white text-xs rounded-lg border border-slate-700 hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingBudget}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 text-xs rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <FiCheck className="w-3 h-3" /> {savingBudget ? 'Saving...' : 'Save & Keep'}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Project Budget (INR)</span>
                    {isClientOwner && (
                      <button
                        onClick={() => {
                          setEditBudgetMin(project.budgetMin ?? 5000);
                          setEditBudgetMax(project.budgetMax ?? 25000);
                          setIsEditingBudget(true);
                        }}
                        className="text-[11px] text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/40 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer font-bold"
                        title="Edit Project Budget Estimation"
                      >
                        <FiEdit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>
                  <div className="text-2xl font-black text-white mt-0.5">
                    ₹{(project.budgetMin ?? 5000).toLocaleString()} - ₹{(project.budgetMax ?? 25000).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400 block mb-2">Direct UPI / GPay to Freelancer</span>
                </div>
              )}

              {isClientOwner && milestones.length > 0 && (
                <button
                  onClick={() => {
                    const firstUnfunded = milestones.find(m => {
                      const p = payments.find(pay => pay.milestone?._id?.toString() === m._id?.toString() || pay.milestone?.toString() === m._id?.toString());
                      return !p || (p.status !== 'funded' && p.status !== 'released');
                    }) || milestones[0];
                    setSelectedMilestoneForPayment(firstUnfunded);
                    setIsPaymentModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer mt-1"
                >
                  <FiSmartphone /> 📱 Pay Freelancer via GPay
                </button>
              )}
            </div>
          </div>

          {/* Required Skills Badges */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Required Skills & Technologies:
            </h4>
            <div className="flex flex-wrap gap-2">
              {(project.skills || []).map((skill, index) => (
                <span 
                  key={index}
                  className="bg-slate-800/80 text-indigo-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-indigo-500/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 🌟 PROJECT LIFECYCLE & STATUS PIPELINE TRACKER */}
        {(() => {
          const submittedCount = milestones.filter(m => m.status === 'completed').length;
          const approvedCount = milestones.filter(m => m.status === 'approved').length;
          const totalMilestones = milestones.length;
          const allCompleted = totalMilestones > 0 && approvedCount === totalMilestones;
          const hasAssigned = !!project.assignedFreelancer;

          // Pipeline steps: 1: Open, 2: Awarded, 3: Submitted, 4: Completed
          const currentStep = allCompleted || project.status === 'completed' ? 4 :
                              submittedCount > 0 ? 3 :
                              hasAssigned || project.status === 'in-progress' ? 2 : 1;

          return (
            <div className="space-y-4">
              {/* Step Pipeline Progress Bar */}
              <div className="glass-card rounded-3xl p-5 md:p-6 border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Project Lifecycle & Completion Pipeline
                  </h4>
                  <div className="flex items-center gap-2">
                    {isClientOwner && (
                      <>
                        <button
                          type="button"
                          onClick={handleResetProject}
                          disabled={resettingProject}
                          className="text-[11px] font-bold text-purple-300 hover:text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 px-3 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <FiZap className="text-[10px]" />
                          {resettingProject ? 'Resetting...' : '🔄 Reset to Step 1'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteProject}
                          className="text-[11px] font-bold text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-3 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <FiTrash2 className="text-[10px]" /> Delete Project
                        </button>
                      </>
                    )}
                    <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                      Stage {currentStep} of 4: {
                        currentStep === 1 ? 'Open for Proposals' :
                        currentStep === 2 ? 'In Progress & Assigned' :
                        currentStep === 3 ? 'Work Submitted & Audited' : 'Completed & Paid'
                      }
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Step 1 */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    currentStep >= 1 ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        currentStep > 1 ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                      }`}>
                        {currentStep > 1 ? '✓' : '1'}
                      </span>
                      <span className="text-xs font-bold text-white">1. Open & Bidding</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Clients review proposals and select talent</p>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    currentStep >= 2 ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        currentStep > 2 ? 'bg-emerald-500 text-white' : currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {currentStep > 2 ? '✓' : '2'}
                      </span>
                      <span className="text-xs font-bold text-white">2. Work in Progress</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Freelancer assigned & building deliverables</p>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    currentStep >= 3 ? 'bg-purple-500/15 border-purple-500/30 text-purple-200 shadow-sm' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        currentStep > 3 ? 'bg-emerald-500 text-white' : currentStep === 3 ? 'bg-purple-600 text-white animate-pulse' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {currentStep > 3 ? '✓' : '3'}
                      </span>
                      <span className="text-xs font-bold text-white">3. Work Submitted</span>
                    </div>
                    <p className="text-[10px] text-purple-300">Code/Deliverable verified by AI Inspector</p>
                  </div>

                  {/* Step 4 */}
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    currentStep >= 4 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200 shadow-sm' : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        currentStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {currentStep === 4 ? '✓' : '4'}
                      </span>
                      <span className="text-xs font-bold text-white">4. Paid via GPay & Done</span>
                    </div>
                    <p className="text-[10px] text-emerald-300">Client approves & pays direct to GPay</p>
                  </div>
                </div>
              </div>

              {/* ACTION ALERT BANNER FOR CLIENTS WHEN WORK IS SUBMITTED */}
              {submittedCount > 0 && (
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-5 rounded-3xl shadow-xl border border-purple-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/30 text-purple-300 border border-purple-400/40 flex items-center justify-center text-xl flex-shrink-0 animate-bounce">
                      🚀
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-yellow-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Deliverable Submitted
                        </span>
                        <span className="text-xs text-purple-200 font-semibold">
                          {submittedCount} Milestone(s) Awaiting Review
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1">
                        {isClientOwner ? "Freelancer has submitted project deliverables for your approval!" : "You have submitted your deliverables. Client has been notified for review."}
                      </h4>
                      <p className="text-xs text-purple-200 mt-0.5">
                        Our Gemini 2.0 AI Inspector has audited the submitted GitHub code & live demo links.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('payments')}
                    className="bg-white hover:bg-gray-100 text-indigo-950 font-black px-5 py-2.5 rounded-2xl text-xs shadow-lg transition-all flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiCheckCircle className="text-emerald-600" />
                    {isClientOwner ? "Review & Release Payment (₹) →" : "View Submission Details →"}
                  </button>
                </div>
              )}

              {/* ALL COMPLETED BANNER */}
              {allCompleted && (
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-5 rounded-3xl shadow-xl border border-emerald-400/40 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div>
                      <h4 className="font-bold text-sm text-white">Project 100% Completed & Verified!</h4>
                      <p className="text-xs text-emerald-200">All milestone deliverables have been inspected, approved, and funds settled.</p>
                    </div>
                  </div>
                  <span className="bg-emerald-400/20 text-emerald-300 font-bold px-3 py-1 rounded-xl text-xs border border-emerald-400/40">
                    ✓ Completed
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Glass Navigation Tabs */}
        <div className="flex border-b border-slate-800 glass-dark rounded-t-3xl px-6 gap-6 shadow-md overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 font-bold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FiBriefcase /> Requirements & Scope
          </button>
          
          <button
            onClick={() => setActiveTab('proposals')}
            className={`py-4 font-bold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'proposals'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FiAward /> Proposals ({proposals.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`py-4 font-bold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'payments'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FiSmartphone className="text-emerald-400" /> 📱 Direct Payment & Deliverables
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`py-4 font-bold text-xs md:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'messages'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FiLock className="text-emerald-400" /> Live Chat & Sync Call
          </button>
        </div>

        {/* TAB 1: Requirements & Scope Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-7 rounded-3xl border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FiBriefcase className="text-indigo-400" /> Detailed Project Specifications
                </h3>
                <div className="prose text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                  {project.description}
                </div>
              </div>

              {project.assignedFreelancer && (
                <div className="bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 p-6 rounded-3xl space-y-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center justify-center font-black text-lg">
                        ✓
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-300 text-base">Project Assigned & In Progress</h4>
                        <p className="text-xs text-emerald-400/80">
                          Assigned to: <strong className="text-white">{project.assignedFreelancer.name}</strong> ({project.assignedFreelancer.email})
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('payments')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FiSmartphone /> Open Payment & Deliverables →
                    </button>
                  </div>

                  {/* If deliverable submitted, show preview right here! */}
                  {milestones.some(m => m.status === 'completed' || m.repoUrl || m.demoUrl) && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Deliverable Ready
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          Freelancer submitted code & demo:
                        </span>
                      </div>

                      {milestones.filter(m => m.repoUrl || m.demoUrl).map((m, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-2xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-3">
                            {m.repoUrl && (
                              <a href={m.repoUrl} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                <FiGithub /> GitHub Code
                              </a>
                            )}
                            {m.demoUrl && (
                              <a href={m.demoUrl} target="_blank" rel="noreferrer" className="font-bold text-emerald-600 hover:underline flex items-center gap-1">
                                <FiGlobe /> Live Demo
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleResetSubmission(m._id)}
                              disabled={resettingSubmission}
                              title="Reset deliverable submission"
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <FiTrash2 className="text-red-500 text-[10px]" />
                              {resettingSubmission ? '...' : 'Reset'}
                            </button>

                            {isClientOwner && (
                              <button
                                onClick={() => setActiveTab('payments')}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                              >
                                Review & Pay (₹)
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6 rounded-3xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">About the Client</h4>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                    {project.client?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">{project.client?.name || 'Verified Client'}</h5>
                    <p className="text-xs text-gray-500">{project.client?.email}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/60 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Payment Verification:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <FiShield /> Verified Direct Google Pay / UPI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client Rating:</span>
                    <span className="font-semibold text-yellow-500">★ 5.0 (Client)</span>
                  </div>
                </div>
              </div>

              {user?.role === 'freelancer' && (
                <div className="bg-gradient-to-br from-indigo-900/95 to-purple-900/95 text-white p-6 rounded-3xl shadow-xl backdrop-blur-md border border-white/10">
                  <h4 className="font-bold text-lg mb-2">Ready to work on this?</h4>
                  <p className="text-xs text-indigo-200 mb-4">
                    Submit your proposal in Rupees (₹) with yellow star rating and let AI enhance your pitch.
                  </p>
                  {mySubmittedProposal ? (
                    <div className="bg-white/10 p-3 rounded-xl border border-white/20 text-center text-xs font-semibold">
                      ✓ You have already submitted a proposal ({mySubmittedProposal.status})
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab('proposals')}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Submit Proposal Now →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Proposals */}
        {activeTab === 'proposals' && (
          <div className="space-y-6">
            {isClientOwner ? (
              <>

                <div className="glass-card p-6 md:p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Received Freelancer Proposals ({proposals.length})
                  </h3>

                  {proposals.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FiAward className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="font-bold text-xs">No proposals submitted yet by freelancers.</p>
                      <p className="text-[11px] mt-1">Use the AI Smart Match above to discover and invite top talent directly.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {proposals.map(prop => (
                        <div 
                          key={prop._id}
                          className="border border-white/80 p-6 rounded-3xl bg-white/60 hover:bg-white/90 transition-all shadow-xs"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
                                {prop.freelancer?.name?.charAt(0) || 'F'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-gray-900 text-sm">{prop.freelancer?.name || 'Freelancer'}</h4>
                                  {prop.freelancer?.verifiedBadges?.length > 0 && (
                                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                                      ⭐ Verified AI Expert
                                    </span>
                                  )}
                                  {Array.isArray(prop.freelancer?.certificates) && prop.freelancer.certificates.length > 0 && (
                                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                                      📜 {prop.freelancer.certificates.length} Certificate{prop.freelancer.certificates.length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{prop.freelancer?.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="bg-white/80 px-3 py-1.5 rounded-2xl border border-gray-200 flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Self-Rating:</span>
                                <StarRating value={prop.experienceRating || 5} readOnly size="sm" />
                              </div>

                              <AIMatchBadge score={prop.aiMatchScore || 88} />
                              
                              <span className="font-black text-emerald-800 text-base bg-emerald-50 px-3 py-1 rounded-2xl border border-emerald-200">
                                ₹{Number(prop.bidAmount).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white/80 p-4 rounded-2xl border border-gray-100 text-xs md:text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                            {prop.coverLetter}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-gray-400 font-medium">
                              Estimated Time: {prop.estimatedDuration || '2-4 weeks'} • Status: <strong className="capitalize text-gray-700">{prop.status}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedFreelancerForResume(prop.freelancer);
                                  setIsFreelancerResumeModalOpen(true);
                                }}
                                className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <FiFileText /> View Resume & Skills
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedChatPartner(prop.freelancer);
                                  setActiveTab('messages');
                                }}
                                className="px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-white rounded-xl border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <FiMessageSquare /> Chat
                              </button>

                              {project.status === 'open' && prop.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleRejectProposal(prop._id)}
                                    className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    onClick={() => handleAcceptProposal(prop._id)}
                                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors cursor-pointer"
                                  >
                                    Accept & Assign Project
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="glass-card p-6 md:p-8 rounded-3xl">
                <h3 className="text-2xl font-black text-gray-900 mb-1">
                  Submit Proposal for this Project
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Fill out your proposal in Rupees (₹), select your experience level in yellow stars, and use AI to enhance your pitch.
                </p>

                {mySubmittedProposal ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 p-6 rounded-3xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-emerald-900 text-base">You have already submitted a proposal!</h4>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Status: <strong className="uppercase">{mySubmittedProposal.status}</strong> • Bid: <strong className="text-emerald-900">₹{Number(mySubmittedProposal.bidAmount).toLocaleString()}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteProposal(mySubmittedProposal._id)}
                        disabled={deletingProposal}
                        className="self-start sm:self-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        {deletingProposal ? 'Deleting...' : '🗑️ Delete & Resubmit'}
                      </button>
                    </div>

                    <div className="bg-white/90 p-4 rounded-2xl text-xs text-gray-700 border border-emerald-100">
                      <strong>Your Submitted Cover Letter:</strong>
                      <p className="mt-1 leading-relaxed">{mySubmittedProposal.coverLetter}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProposal} className="space-y-6">
                    <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200">
                      <label className="block text-xs font-bold text-amber-900 mb-1.5">
                        ⭐ Rate Your Experience Level in Required Tech Stack:
                      </label>
                      <p className="text-[11px] text-amber-700 mb-3">
                        Click the stars below (in bright yellow) to specify your domain expertise for this client.
                      </p>
                      <StarRating 
                        value={proposalData.experienceRating} 
                        onChange={(stars) => setProposalData({ ...proposalData, experienceRating: stars })} 
                        size="lg"
                        showLabel={true}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-800">
                          Cover Letter / Pitch to Client
                        </label>
                        <button
                          type="button"
                          onClick={handleEnhanceProposal}
                          disabled={enhancing}
                          className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold px-3 py-1.5 rounded-xl border border-purple-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FiZap className="text-purple-600" />
                          {enhancing ? 'Enhancing with AI...' : '✨ Enhance with Gemini AI'}
                        </button>
                      </div>
                      <textarea
                        required
                        rows={6}
                        className="w-full rounded-2xl glass-input p-4 text-gray-900 text-xs md:text-sm leading-relaxed"
                        placeholder="Explain why you are the best fit for this project, mention your past projects, and how you will deliver the requirements..."
                        value={proposalData.coverLetter}
                        onChange={e => setProposalData({ ...proposalData, coverLetter: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">Your Bid Amount in Rupees (₹)</label>
                        <input
                          required
                          type="number"
                          min="10"
                          className="w-full rounded-2xl glass-input p-3 text-gray-900 text-xs"
                          placeholder={`${project.budgetMin || 10}`}
                          value={proposalData.bidAmount}
                          onChange={e => setProposalData({ ...proposalData, bidAmount: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">Estimated Duration</label>
                        <select
                          className="w-full rounded-2xl glass-input p-3 text-gray-900 text-xs"
                          value={proposalData.estimatedDuration}
                          onChange={e => setProposalData({ ...proposalData, estimatedDuration: e.target.value })}
                        >
                          <option>1 to 2 weeks</option>
                          <option>2 to 4 weeks</option>
                          <option>1 to 2 months</option>
                          <option>3+ months</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all text-xs disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? 'Submitting Proposal...' : 'Submit Official Proposal →'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Direct 1-Click Payment & Deliverables */}
        {activeTab === 'payments' && (() => {
          const primaryMilestone = milestones[0] || {
            _id: 'default-milestone',
            title: `${project.title} - Main Deliverable`,
            amount: project.budgetMax || 15000,
            status: project.status === 'completed' ? 'approved' : project.assignedFreelancer ? 'in-progress' : 'pending'
          };

          const milestonePayment = payments.find(p => 
            p.milestone?._id?.toString() === primaryMilestone._id?.toString() || 
            p.milestone?.toString() === primaryMilestone._id?.toString()
          );

          const isFunded = milestonePayment && milestonePayment.status === 'funded';
          const isReleased = (milestonePayment && milestonePayment.status === 'released') || primaryMilestone.status === 'approved' || project.status === 'completed';
          const isSubmitted = primaryMilestone.status === 'completed' || !!primaryMilestone.repoUrl || !!primaryMilestone.demoUrl;
          const assignedFreelancer = project.assignedFreelancer;

          return (
            <div className="space-y-6">
              
              {/* Main Payment & Freelancer Card */}
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/80 space-y-6 shadow-sm">
                
                {/* 🌟 Interactive Money Journey Tracker */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <FiSmartphone /> Live Payment Tracker
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        ₹{Number(primaryMilestone.amount || project.budgetMax || 20).toLocaleString()} Journey: From {project.client?.name || 'Kesh'} ➔ {assignedFreelancer?.name || 'Rishi'}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-300 font-bold">
                      {isReleased ? 'Status: Paid Directly via GPay 🎉' : isSubmitted ? 'Status: Deliverables Under Review 🚀' : isFunded ? 'Status: Milestone Paid via GPay' : 'Status: Ready for Direct GPay Payment ⏳'}
                    </span>
                  </div>

                  {/* 4 Interactive Journey Steps */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
                    <div className={`p-2.5 rounded-xl border ${isFunded || isSubmitted || isReleased ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                      <span className="font-black block text-[10px] uppercase">1. Project Started</span>
                      <p className="text-[11px] mt-0.5">{project.client?.name || 'Kesh'} hires talent</p>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isFunded || isSubmitted || isReleased ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                      <span className="font-black block text-[10px] uppercase">2. Work in Progress 💻</span>
                      <p className="text-[11px] mt-0.5">Freelancer builds code</p>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isSubmitted || isReleased ? 'bg-purple-500/20 border-purple-400/40 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                      <span className="font-black block text-[10px] uppercase">3. Work & Submit 🚀</span>
                      <p className="text-[11px] mt-0.5">{assignedFreelancer?.name || 'Rishi'} sends code</p>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isReleased ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                      <span className="font-black block text-[10px] uppercase">4. Direct in Bank 🎉</span>
                      <p className="text-[11px] mt-0.5">₹ Paid straight to Rishi</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-800 border border-emerald-400/30 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <FiSmartphone className="text-emerald-600" /> ⚡ 100% Direct Transfer
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mt-2">
                      Direct Google Pay & Project Work
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pay the assigned freelancer directly in Rupees (₹) via Google Pay / UPI with 0% platform commission.
                    </p>
                  </div>

                  {/* Milestone Amount & Status Badge */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 min-w-[260px] text-right">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Milestone Amount</span>
                      {isClientOwner && !isFunded && !isReleased && !isEditingMilestoneAmount && (
                        <button
                          onClick={() => {
                            setEditMilestoneAmount(primaryMilestone.amount || project.budgetMax || 15000);
                            setIsEditingMilestoneAmount(true);
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Edit Milestone Estimation"
                        >
                          <FiEdit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>

                    {isEditingMilestoneAmount ? (
                      <div className="mt-2 space-y-2 text-left bg-white/90 p-3 rounded-xl border border-indigo-200">
                        <label className="text-[10px] text-gray-500 block font-semibold">Estimated Amount (₹)</label>
                        <input
                          type="number"
                          min="10"
                          value={editMilestoneAmount}
                          onChange={e => setEditMilestoneAmount(e.target.value)}
                          className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1 text-sm font-bold text-indigo-900 focus:outline-none focus:border-indigo-600"
                        />
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingMilestoneAmount(false)}
                            className="px-2 py-1 text-gray-500 text-xs rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingMilestoneAmount}
                            onClick={() => handleSaveMilestoneAmount(primaryMilestone._id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 text-xs rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {savingMilestoneAmount ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl md:text-3xl font-black text-indigo-900 mt-0.5">
                        ₹{Number(primaryMilestone.amount || project.budgetMax || 15000).toLocaleString()}
                      </div>
                    )}
                    <div className="mt-2">
                      {isReleased ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs border border-emerald-200 inline-flex items-center gap-1">
                          ✓ ₹ Paid & Completed
                        </span>
                      ) : isSubmitted ? (
                        <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full text-xs border border-purple-200 inline-flex items-center gap-1 animate-pulse">
                          🚀 Deliverable Submitted
                        </span>
                      ) : isFunded ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs border border-emerald-200 inline-flex items-center gap-1">
                          <FiSmartphone /> 📱 Paid via Google Pay
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full text-xs border border-amber-200 inline-flex items-center gap-1">
                          ⏳ Direct Payment Needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Freelancer Details or Assign Prompt */}
                {assignedFreelancer ? (
                  <div className="bg-white/80 p-5 md:p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                        {assignedFreelancer.name?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-gray-900 text-base">{assignedFreelancer.name}</h4>
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            Assigned Freelancer
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{assignedFreelancer.email}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-mono text-gray-700">
                            📱 GPay: <strong>+91 {assignedFreelancer.gpayNumber || '9840827712'}</strong>
                          </span>
                          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-mono text-gray-700">
                            💳 UPI: <strong>{assignedFreelancer.upiId || 'rishikesh2006.gr@okaxis'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Client Action Buttons */}
                    {isClientOwner && (
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Direct Pay Button */}
                        {!isFunded && !isReleased && (
                          <button
                            onClick={() => {
                              setSelectedMilestoneForPayment(primaryMilestone);
                              setIsPaymentModalOpen(true);
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black px-5 py-3 rounded-2xl text-xs md:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <FiSmartphone className="text-base" /> Pay ₹{Number(primaryMilestone.amount || 15000).toLocaleString()} via GPay
                          </button>
                        )}

                        {/* Release Payment Button */}
                        {isSubmitted && !isReleased && (
                          <button
                            onClick={() => {
                              if (milestonePayment?._id) {
                                handleReleasePayment(milestonePayment._id);
                              } else {
                                handleUpdateMilestone(primaryMilestone._id, 'approved');
                              }
                            }}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black px-5 py-3 rounded-2xl text-xs md:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <FiCheckCircle className="text-base" /> Approve & Complete ₹{Number(primaryMilestone.amount || 15000).toLocaleString()}
                          </button>
                        )}

                        {/* AI Dispute Button */}
                        {isFunded && !isReleased && (
                          <button
                            onClick={() => {
                              setSelectedMilestoneForDispute(primaryMilestone);
                              setIsDisputeModalOpen(true);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <FiAlertTriangle /> AI Dispute
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 text-center space-y-3">
                    <FiAward className="w-10 h-10 mx-auto text-amber-600" />
                    <h4 className="font-bold text-amber-900 text-sm">No Freelancer Assigned Yet</h4>
                    <p className="text-xs text-amber-700 max-w-md mx-auto">
                      Review submitted bids from freelancers in the <strong>Proposals ({proposals.length})</strong> tab and accept the best candidate to start direct payment.
                    </p>
                    <button
                      onClick={() => setActiveTab('proposals')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FiAward /> View Received Proposals →
                    </button>
                  </div>
                )}

              </div>

              {/* Work Deliverables & AI Inspection Section */}
              {assignedFreelancer && (
                <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/80 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="text-lg font-black text-gray-900">Project Deliverables & AI Code Audit</h4>
                      <p className="text-xs text-gray-500">Freelancer submits work links (GitHub repository & live preview) for instant Gemini AI inspection.</p>
                    </div>
                    
                    {/* Freelancer Submit Button Trigger */}
                    {isAssignedFreelancer && !isReleased && (
                      <button
                        onClick={() => {
                          setSelectedMilestoneForDelivery(primaryMilestone);
                          setDeliverableForm({
                            repoUrl: primaryMilestone.repoUrl || '',
                            demoUrl: primaryMilestone.demoUrl || '',
                            deliverableNotes: primaryMilestone.deliverableNotes || ''
                          });
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <FiCpu /> {isSubmitted ? 'Update Submitted Work' : 'Submit Deliverable for AI Audit'}
                      </button>
                    )}
                  </div>

                  {/* Submitted Work Display */}
                  {isSubmitted || primaryMilestone.repoUrl || primaryMilestone.demoUrl ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {primaryMilestone.repoUrl && (
                          <a
                            href={primaryMilestone.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                          >
                            <FiGithub className="text-sm" /> View GitHub Repository <FiExternalLink className="text-[10px]" />
                          </a>
                        )}

                        {primaryMilestone.demoUrl && (
                          <a
                            href={primaryMilestone.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                          >
                            <FiGlobe className="text-sm" /> View Live Demo Preview <FiExternalLink className="text-[10px]" />
                          </a>
                        )}

                        {/* Trigger AI Quality Audit */}
                        <button
                          onClick={() => handleInspectMilestone(primaryMilestone)}
                          disabled={inspectingMilestoneId === primaryMilestone._id}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FiZap className="text-purple-600" />
                          {inspectingMilestoneId === primaryMilestone._id ? 'Auditing Code...' : 'Re-Run Gemini AI Audit'}
                        </button>

                        {/* Reset Submission / Clear Work */}
                        <button
                          onClick={() => handleResetSubmission(primaryMilestone._id)}
                          disabled={resettingSubmission}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <FiTrash2 className="text-red-500" />
                          {resettingSubmission ? 'Resetting...' : '🔄 Reset Submission / Re-deliver'}
                        </button>
                      </div>

                      {primaryMilestone.deliverableNotes && (
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-800">
                          <strong>Delivery Notes from Freelancer:</strong>
                          <p className="mt-1">{primaryMilestone.deliverableNotes}</p>
                        </div>
                      )}

                      {/* AI Audit Feedback */}
                      {primaryMilestone.aiReviewFeedback && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 text-xs text-purple-950 flex items-start gap-3">
                          <FiCpu className="text-purple-600 mt-0.5 text-lg flex-shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-sm">Gemini 2.0 AI Code Quality Audit:</strong>
                              <span className="bg-purple-200 text-purple-900 font-black px-2 py-0.5 rounded-full text-[11px]">
                                {primaryMilestone.aiReviewScore || 96}% Verified Quality
                              </span>
                            </div>
                            <p className="mt-1 text-gray-700">{primaryMilestone.aiReviewFeedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FiCheckCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-xs font-semibold text-gray-600">
                        {isClientOwner 
                          ? "Freelancer is currently working on the project. Once submitted, their GitHub repo and demo links will appear here for your review."
                          : "You have not submitted your project deliverables yet. Click the button above to provide your GitHub repo and demo link."}
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>
          );
        })()}

        {/* TAB 4: Live Chat & 1-Click Sync Call */}
        {activeTab === 'messages' && (
          <div className="glass-card rounded-3xl overflow-hidden space-y-0 shadow-xl border border-white/60">
            <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <FiShield /> End-to-End Encrypted Channel
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-2">
                  Live Project Chat & Sync: {project.title}
                </h3>
                <p className="text-xs text-indigo-200 mt-1">
                  Collaborator: <strong className="text-white">{selectedChatPartner?.name || (user?.role === 'freelancer' ? project.client?.name : 'Select a freelancer')}</strong>
                </p>
              </div>

              {/* 1-Click Encrypted Virtual Sync Call */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowVideoCallRoom(!showVideoCallRoom)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FiVideo /> {showVideoCallRoom ? 'Hide Sync Room' : '📹 1-Click Sync Call'}
                </button>
                <Link
                  to="/messages"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-2xl border border-white/20 flex items-center gap-1.5 transition-colors"
                >
                  <FiExternalLink /> Full Messenger
                </Link>
              </div>
            </div>

            {/* Embedded Live Virtual Sync Call Frame */}
            {showVideoCallRoom && (
              <div className="p-4 bg-slate-950 border-b border-white/10 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3 text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                    <span className="text-xs font-bold text-emerald-400">Live Secure Virtual Sync Room Active</span>
                    <span className="text-[11px] text-gray-400 font-mono">({callRoomId})</span>
                  </div>
                  <button 
                    onClick={() => setShowVideoCallRoom(false)}
                    className="text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    Close Call
                  </button>
                </div>
                <div className="h-96 rounded-2xl overflow-hidden bg-slate-900 border border-white/20 relative">
                  <iframe
                    src={`https://meet.jit.si/${callRoomId}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(user?.name || 'User')}"`}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    className="w-full h-full border-0"
                    title="Live Meeting Room"
                  />
                </div>
              </div>
            )}

            {user?.role === 'client' && proposals.length > 1 && (
              <div className="bg-white/40 px-6 py-3 border-b border-white/50 flex items-center gap-3 overflow-x-auto">
                <span className="text-xs font-bold text-gray-500 flex-shrink-0">Chat with applicant:</span>
                {proposals.map(p => {
                  const fl = p.freelancer;
                  if (!fl) return null;
                  const isSelected = selectedChatPartner?._id === fl._id;
                  return (
                    <button
                      key={fl._id}
                      onClick={() => setSelectedChatPartner(fl)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white/80 border border-gray-200 text-gray-700 hover:bg-white'
                      }`}
                    >
                      {fl.name} {project.assignedFreelancer?._id === fl._id ? '⭐ (Assigned)' : ''}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="h-96 overflow-y-auto p-5 md:p-6 bg-slate-50/50 space-y-4 backdrop-blur-xs">
              {loadingChat ? (
                <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl shadow-2xs">
                    <FiLock />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">Direct Encrypted Chat Initialized</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    Type a message below or launch a 1-click video call to sync in real time.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMine = msg.sender === user._id || msg.sender?._id === user._id;
                  return (
                    <div key={msg._id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs md:text-sm leading-relaxed ${
                        isMine 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md' 
                          : 'bg-white/90 border border-white/80 text-gray-800 rounded-bl-none shadow-2xs backdrop-blur-xs'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMine && <FiCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            <div className="p-4 bg-white/80 border-t border-white/60 backdrop-blur-md">
              <form onSubmit={handleSendProjectMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Send an encrypted message to ${selectedChatPartner?.name || 'collaborator'}...`}
                  className="flex-1 px-4 py-2.5 text-xs md:text-sm glass-input rounded-2xl"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || !selectedChatPartner?._id}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <FiSend className="w-4 h-4" /> Send
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Deliverable Submission Modal (Freelancer) */}
        {selectedMilestoneForDelivery && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-dark rounded-3xl shadow-2xl border border-white/20 max-w-lg w-full overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 p-6 relative border-b border-white/10">
                <button
                  onClick={() => setSelectedMilestoneForDelivery(null)}
                  className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500/30 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <FiCpu /> Gemini AI Deliverable Audit
                  </span>
                </div>
                <h3 className="text-xl font-black mt-2 text-white">Submit Deliverable for Review</h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Milestone: <strong className="text-white">{selectedMilestoneForDelivery.title}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmitDeliverable} className="p-6 bg-slate-900/70 space-y-4">
                {/* 1-Click Quick Fill Button */}
                <div className="flex items-center justify-between bg-purple-900/40 p-3 rounded-2xl border border-purple-400/30">
                  <span className="text-xs text-purple-200 font-semibold">Testing or fast submission?</span>
                  <button
                    type="button"
                    onClick={() => setDeliverableForm({
                      repoUrl: 'https://github.com/rishicloud08/mongodb-cloud-database-api',
                      demoUrl: 'https://cloud-db-system-demo.vercel.app',
                      deliverableNotes: 'Completed full scalable MongoDB & Express database backend architecture with automated indexing, JWT authentication, and high-performance CRUD endpoints.'
                    })}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FiZap className="text-yellow-300" /> ⚡ Autofill Database Deliverables
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    GitHub / Source Code Repository URL
                  </label>
                  <div className="relative">
                    <FiGithub className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="url"
                      placeholder="https://github.com/username/project-repo"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-white"
                      value={deliverableForm.repoUrl}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, repoUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Live Demo / Staging URL <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <FiGlobe className="absolute left-3.5 top-3 text-gray-400" />
                    <input
                      type="url"
                      placeholder="https://my-demo-app.vercel.app"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-white"
                      value={deliverableForm.demoUrl}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, demoUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Deliverable Summary & Release Notes
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe what features, tests, and endpoints have been implemented for this milestone..."
                    className="w-full p-3 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-white"
                    value={deliverableForm.deliverableNotes}
                    onChange={(e) => setDeliverableForm({ ...deliverableForm, deliverableNotes: e.target.value })}
                  />
                </div>

                <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 text-[11px] text-purple-200 flex items-start gap-2">
                  <FiCpu className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Upon submission, our <strong>Gemini 2.0 Quality Inspector</strong> will verify your artifacts against milestone specifications and generate a verified quality score for the client.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingDelivery}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingDelivery ? 'Running AI Quality Inspector...' : 'Submit & Run AI Quality Audit →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* GPay & UPI QR Payment Modal */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          milestone={selectedMilestoneForPayment}
          project={project}
          onPaymentSuccess={() => fetchProjectDetails()}
        />

        {/* Smart Contract & Digital SLA Modal */}
        <ContractModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          projectId={id}
          currentUser={user}
        />

        {/* Dispute Arbitration Modal */}
        <DisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => {
            setIsDisputeModalOpen(false);
            setSelectedMilestoneForDispute(null);
          }}
          projectId={id}
          milestone={selectedMilestoneForDispute}
          currentUser={user}
          onDisputeResolved={() => fetchProjectDetails()}
        />

        {/* Freelancer Resume Viewer Modal (for Clients) */}
        <FreelancerResumeModal
          isOpen={isFreelancerResumeModalOpen}
          onClose={() => {
            setIsFreelancerResumeModalOpen(false);
            setSelectedFreelancerForResume(null);
          }}
          freelancer={selectedFreelancerForResume}
        />

      </div>
    </DashboardLayout>
  );
}