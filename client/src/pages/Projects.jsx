import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FiSearch, 
  FiFilter, 
  FiPlus, 
  FiBriefcase, 
  FiClock, 
  FiUser, 
  FiCalendar, 
  FiCheckCircle,
  FiZap,
  FiAward,
  FiCpu,
  FiList,
  FiTrash2,
  FiMessageSquare,
  FiFileText,
  FiStar,
  FiExternalLink,
  FiGithub,
  FiShield,
  FiMail,
  FiDollarSign,
  FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import AIMatchBadge from '../components/AIMatchBadge';
import StarRating from '../components/StarRating';
import FreelancerResumeModal from '../components/FreelancerResumeModal';

export default function Projects() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active view tab
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === 'freelancers' || tabParam === 'clients' ? tabParam : 'projects'
  );

  const [projects, setProjects] = useState([]);
  const [registeredFreelancers, setRegisteredFreelancers] = useState([]);
  const [registeredClients, setRegisteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Resume Modal State
  const [selectedFreelancerForResume, setSelectedFreelancerForResume] = useState(null);

  // Filters for Project view (Freelancers)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [skillFilter, setSkillFilter] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('all');

  // Filters for Freelancers search view (Clients)
  const [freelancerSearch, setFreelancerSearch] = useState('');
  const [freelancerSkillTag, setFreelancerSkillTag] = useState('All');
  const [minRatingFilter, setMinRatingFilter] = useState(0);

  // Filters for Clients search view (Freelancers)
  const [clientSearch, setClientSearch] = useState('');

  // Create project form state for client view
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [generatingMilestones, setGeneratingMilestones] = useState(false);
  const [aiGeneratedMilestones, setAiGeneratedMilestones] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    budgetMin: '',
    budgetMax: '',
    duration: '1 to 3 months'
  });

  // Popular tech skill filter tags
  const popularSkills = [
    'All', 'React', 'Node.js', 'Python', 'Flutter', 'AI / ML', 
    'Tailwind CSS', 'MongoDB', 'Cloud / AWS', 'UI / UX', 'TypeScript'
  ];

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    fetchProjects();
    fetchRegisteredUsers();
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      if (user?.role === 'client') {
        const res = await api.projects.getMyProjects();
        setProjects(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await api.projects.getProjects();
        setProjects(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.auth.getUsers();
      const allUsers = Array.isArray(res.data) ? res.data : [];
      setRegisteredFreelancers(allUsers.filter(u => u.role === 'freelancer'));
      setRegisteredClients(allUsers.filter(u => u.role === 'client'));
    } catch (error) {
      console.log('User directory note:', error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', newTab);
      return p;
    });
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to permanently delete this project?')) return;
    try {
      await api.projects.deleteProject(projectId);
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  // AI Project Architect - Auto Generate Scope & Milestones
  const handleAutoGenerateMilestones = async () => {
    if (!formData.title.trim()) {
      return toast.error('Please enter a project title first');
    }
    setGeneratingMilestones(true);
    try {
      const res = await api.ai.generateMilestones({
        title: formData.title,
        description: formData.description || formData.title,
        budgetMin: Number(formData.budgetMin) || 5000,
        budgetMax: Number(formData.budgetMax) || 25000
      });
      const generated = res.data?.milestones || [];
      setAiGeneratedMilestones(generated);
      toast.success('✨ Gemini AI decomposed your project into 3 phased milestones!');
    } catch (err) {
      toast.error('AI milestone architect service busy');
    } finally {
      setGeneratingMilestones(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      return toast.error('Please enter a project title and description');
    }
    try {
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : ['General Development'];

      const projectData = {
        title: formData.title,
        description: formData.description,
        skills: skillsArray,
        budgetMin: Number(formData.budgetMin) || 5000,
        budgetMax: Number(formData.budgetMax) || 25000,
        duration: formData.duration
      };
      
      const createdRes = await api.projects.createProject(projectData);
      const createdProj = createdRes.data;

      // Automatically create AI milestones if generated
      if (aiGeneratedMilestones.length > 0 && createdProj?._id) {
        for (const ms of aiGeneratedMilestones) {
          try {
            await api.milestones.createMilestone({
              projectId: createdProj._id,
              title: ms.title,
              description: ms.description,
              amount: ms.amount,
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            });
          } catch (e) {
            console.log('Milestone auto-create note:', e.message);
          }
        }
      }

      toast.success('Project posted with AI Milestones! AI is now matching talent.');
      setShowCreateForm(false);
      setFormData({ title: '', description: '', skills: '', budgetMin: '', budgetMax: '', duration: '1 to 3 months' });
      setAiGeneratedMilestones([]);
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  // Filtered projects for freelancer
  const filteredProjects = projects.filter(p => {
    if (user?.role === 'client') return true;
    const query = searchTerm.toLowerCase();
    const titleMatch = (p.title || '').toLowerCase().includes(query);
    const descMatch = (p.description || '').toLowerCase().includes(query);
    const clientMatch = (p.client?.name || '').toLowerCase().includes(query) || (p.client?.email || '').toLowerCase().includes(query);
    const skillKeywordMatch = (p.skills || []).some(s => s.toLowerCase().includes(query));
    
    const matchesSearch = !searchTerm || titleMatch || descMatch || clientMatch || skillKeywordMatch;
    const matchesSkillFilter = !skillFilter || (p.skills && p.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase())));
    
    let matchesBudget = true;
    if (budgetFilter === 'under10k') {
      matchesBudget = (p.budgetMax || 0) <= 10000;
    } else if (budgetFilter === '10k-50k') {
      matchesBudget = (p.budgetMax || 0) >= 10000 && (p.budgetMin || 0) <= 50000;
    } else if (budgetFilter === 'above50k') {
      matchesBudget = (p.budgetMax || 0) >= 50000;
    }

    return matchesSearch && matchesSkillFilter && matchesBudget;
  });

  // Filtered registered freelancers for clients
  const filteredFreelancers = registeredFreelancers.filter(f => {
    const q = freelancerSearch.toLowerCase();
    const nameMatch = (f.name || '').toLowerCase().includes(q);
    const emailMatch = (f.email || '').toLowerCase().includes(q);
    const bioMatch = (f.bio || '').toLowerCase().includes(q);
    const skillsTextMatch = (f.skills || []).some(s => s.toLowerCase().includes(q));
    const githubMatch = (f.githubUsername || '').toLowerCase().includes(q);

    const matchesQuery = !freelancerSearch || nameMatch || emailMatch || bioMatch || skillsTextMatch || githubMatch;

    const matchesSkillTag = freelancerSkillTag === 'All' || (f.skills || []).some(s => 
      s.toLowerCase().includes(freelancerSkillTag.toLowerCase())
    );

    const matchesRating = !minRatingFilter || (f.rating || 5) >= minRatingFilter;

    return matchesQuery && matchesSkillTag && matchesRating;
  });

  // Filtered registered clients for freelancers
  const filteredClients = registeredClients.filter(c => {
    const q = clientSearch.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const emailMatch = (c.email || '').toLowerCase().includes(q);
    const bioMatch = (c.bio || '').toLowerCase().includes(q);
    return !clientSearch || nameMatch || emailMatch || bioMatch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30 shadow-xs">Open for Proposals</span>;
      case 'in-progress':
        return <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-blue-500/30 shadow-xs">In Progress</span>;
      case 'completed':
        return <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-slate-700">Completed</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 md:p-8 rounded-3xl">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                user?.role === 'client' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {user?.role === 'client' ? 'Client Workspace' : 'Freelancer Marketplace'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-2">
              {user?.role === 'client' 
                ? (activeTab === 'freelancers' ? '🔍 Search Registered Freelancers' : '📂 My Posted Projects')
                : (activeTab === 'clients' ? '🏢 Registered Clients Directory' : '💼 Explore Client Projects')
              }
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              {user?.role === 'client' 
                ? 'Search all registered talent by skills, ratings, and view verified resumes or chat directly.'
                : 'Search client listings, discover registered employers, and submit bids in Rupees (₹).'}
            </p>
          </div>

          {/* Action Button: Post Project (Client) or Browse Projects */}
          <div className="flex items-center gap-3">
            {user?.role === 'client' && (
              <button 
                onClick={() => {
                  setActiveTab('projects');
                  setShowCreateForm(!showCreateForm);
                }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <FiPlus className="text-lg" />
                {showCreateForm ? 'Close Project Form' : 'Post New Project'}
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs (For both Clients & Freelancers) */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
          {user?.role === 'client' ? (
            <>
              <button
                onClick={() => handleTabChange('projects')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'projects'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FiBriefcase className="text-base" />
                <span>My Posted Projects</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  {projects.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('freelancers')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'freelancers'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FiSearch className="text-base" />
                <span>🔍 Search Registered Freelancers</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  {registeredFreelancers.length}
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleTabChange('projects')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'projects'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FiBriefcase className="text-base" />
                <span>💼 Explore Client Projects</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  {projects.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('clients')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === 'clients'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FiUser className="text-base" />
                <span>🏢 Registered Clients Directory</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  {registeredClients.length}
                </span>
              </button>
            </>
          )}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: SEARCH REGISTERED FREELANCERS (FOR CLIENTS)            */}
        {/* ============================================================== */}
        {activeTab === 'freelancers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search and Filter Bar */}
            <div className="glass-card p-6 rounded-3xl space-y-4 border border-purple-500/20">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Search freelancers by name, skills (e.g. React, Python), bio or GitHub..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-xs md:text-sm font-medium text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                    value={freelancerSearch}
                    onChange={(e) => setFreelancerSearch(e.target.value)}
                  />
                  {freelancerSearch && (
                    <button 
                      onClick={() => setFreelancerSearch('')} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Min Rating Dropdown */}
                <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700">
                  <FiStar className="text-yellow-400" />
                  <span className="text-xs text-slate-300 font-bold whitespace-nowrap">Rating:</span>
                  <select
                    value={minRatingFilter}
                    onChange={(e) => setMinRatingFilter(Number(e.target.value))}
                    className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={0} className="bg-slate-900">All Ratings</option>
                    <option value={4} className="bg-slate-900">4.0 ★ & Above</option>
                    <option value={4.5} className="bg-slate-900">4.5 ★ & Above</option>
                    <option value={5} className="bg-slate-900">5.0 ★ Only</option>
                  </select>
                </div>
              </div>

              {/* Quick Skill Tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-none">
                <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <FiFilter className="text-purple-400" /> Skills:
                </span>
                {popularSkills.map(skill => (
                  <button
                    key={skill}
                    onClick={() => setFreelancerSkillTag(skill)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      freelancerSkillTag === skill
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Freelancer Cards Grid */}
            {loadingUsers ? (
              <div className="flex justify-center p-16 glass-card rounded-3xl">
                <LoadingSpinner />
              </div>
            ) : filteredFreelancers.length === 0 ? (
              <div className="text-center p-16 glass-card rounded-3xl border border-slate-800">
                <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                  <FiUser className="text-4xl text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No freelancers found</h3>
                <p className="text-slate-400 max-w-md mx-auto text-xs">
                  No registered freelancers match your search query "{freelancerSearch || freelancerSkillTag}". Try searching for another skill or keyword.
                </p>
                <button
                  onClick={() => {
                    setFreelancerSearch('');
                    setFreelancerSkillTag('All');
                    setMinRatingFilter(0);
                  }}
                  className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFreelancers.map((f) => (
                  <div
                    key={f._id}
                    className="glass-card rounded-3xl p-6 flex flex-col justify-between group border border-slate-800 hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-500/10"
                  >
                    <div>
                      {/* Top Avatar & Badges */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white font-black text-base shadow-md flex-shrink-0">
                            {f.name ? f.name.slice(0, 2).toUpperCase() : 'FL'}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                              {f.name}
                              <FiCheckCircle className="text-emerald-400 w-4 h-4 flex-shrink-0" title="Verified Freelancer" />
                            </h3>
                            <p className="text-slate-400 text-[11px] truncate">{f.email}</p>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-1 rounded-xl shrink-0">
                          <FiStar className="text-yellow-400 w-3.5 h-3.5 fill-yellow-400" />
                          <span className="text-yellow-300 font-black text-xs">{(f.rating || 5.0).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-slate-300 text-xs line-clamp-3 mb-4 leading-relaxed">
                        {f.bio || 'Experienced verified freelancer ready to build web and mobile applications.'}
                      </p>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {(f.skills || ['Full Stack', 'Web Development']).slice(0, 5).map((skill, i) => (
                          <span
                            key={i}
                            className="bg-slate-800 text-purple-300 text-xs px-2.5 py-0.5 rounded-xl font-bold border border-purple-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                        {(f.skills?.length > 5) && (
                          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-xl">
                            +{f.skills.length - 5}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Info & Actions */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800 mb-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Rate:</span>
                          <span className="font-black text-emerald-400 text-sm">₹{f.hourlyRate || 500}</span>
                          <span className="text-slate-400 text-[10px]">/hr</span>
                        </div>
                        {f.githubUsername && (
                          <a
                            href={f.githubUrl || `https://github.com/${f.githubUsername}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-slate-300 hover:text-purple-400 font-bold"
                          >
                            <FiGithub className="w-3.5 h-3.5" />
                            <span>@{f.githubUsername}</span>
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Direct Chat CTA */}
                        <button
                          type="button"
                          onClick={() => navigate(`/messages?userId=${f._id}`)}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                        >
                          <FiMessageSquare className="w-3.5 h-3.5" />
                          <span>Chat Now</span>
                        </button>

                        {/* View Resume Modal CTA */}
                        <button
                          type="button"
                          onClick={() => setSelectedFreelancerForResume(f)}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-purple-500/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                          <FiFileText className="w-3.5 h-3.5" />
                          <span>View Resume</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SEARCH REGISTERED CLIENTS (FOR FREELANCERS)             */}
        {/* ============================================================== */}
        {activeTab === 'clients' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search Bar */}
            <div className="glass-card p-6 rounded-3xl border border-indigo-500/20">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg" />
                <input
                  type="text"
                  placeholder="Search registered clients by name, company, or email..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-xs md:text-sm font-medium text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                {clientSearch && (
                  <button 
                    onClick={() => setClientSearch('')} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Client Cards Grid */}
            {loadingUsers ? (
              <div className="flex justify-center p-16 glass-card rounded-3xl">
                <LoadingSpinner />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center p-16 glass-card rounded-3xl border border-slate-800">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <FiBriefcase className="text-4xl text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No registered clients found</h3>
                <p className="text-slate-400 max-w-md mx-auto text-xs">
                  No clients match "{clientSearch}". Clear your search term to see all active clients and employers.
                </p>
                <button
                  onClick={() => setClientSearch('')}
                  className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Show All Clients
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((c) => {
                  const clientProjectCount = projects.filter(p => p.client?._id === c._id || p.client === c._id).length;
                  return (
                    <div
                      key={c._id}
                      className="glass-card rounded-3xl p-6 flex flex-col justify-between group border border-slate-800 hover:border-indigo-500/40 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
                    >
                      <div>
                        {/* Top Info */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-md flex-shrink-0">
                              {c.name ? c.name.slice(0, 2).toUpperCase() : 'CL'}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                                {c.name}
                                <FiShield className="text-indigo-400 w-4 h-4 flex-shrink-0" title="Verified Client" />
                              </h3>
                              <p className="text-slate-400 text-[11px] truncate">{c.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-1 rounded-xl shrink-0">
                            <FiStar className="text-yellow-400 w-3.5 h-3.5 fill-yellow-400" />
                            <span className="text-yellow-300 font-black text-xs">{(c.rating || 5.0).toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Bio */}
                        <p className="text-slate-300 text-xs line-clamp-3 mb-4 leading-relaxed">
                          {c.bio || 'Verified client commissioning custom web, mobile, and software development projects.'}
                        </p>

                        <div className="flex items-center gap-2 mb-4">
                          <span className="bg-indigo-500/15 text-indigo-300 text-xs px-3 py-1 rounded-xl font-bold border border-indigo-500/30">
                            🏢 Employer
                          </span>
                          {clientProjectCount > 0 && (
                            <span className="bg-emerald-500/15 text-emerald-300 text-xs px-3 py-1 rounded-xl font-bold border border-emerald-500/30">
                              📂 {clientProjectCount} {clientProjectCount === 1 ? 'Project' : 'Projects'} Posted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/messages?userId=${c._id}`)}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                        >
                          <FiMessageSquare className="w-3.5 h-3.5" />
                          <span>Message</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('projects');
                            setSearchTerm(c.name);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
                        >
                          <FiBriefcase className="w-3.5 h-3.5" />
                          <span>View Projects</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PROJECTS VIEW (CLIENT POSTED PROJECTS / FREELANCER OPEN) */}
        {/* ============================================================== */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Client: Post Project Form Card */}
            {user?.role === 'client' && showCreateForm && (
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-indigo-200/80 animate-in fade-in duration-200 shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Post New Client Project</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Use the AI Project Architect to auto-generate phased milestones and budgets.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerateMilestones}
                    disabled={generatingMilestones}
                    className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-4 py-2 rounded-2xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FiZap className="text-yellow-300" />
                    {generatingMilestones ? 'Decomposing Project...' : '✨ AI Project Architect (Auto-Milestones)'}
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1.5">Project Title</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full rounded-2xl glass-input p-3 text-gray-900 text-sm font-medium" 
                      placeholder="e.g. MERN Stack E-Commerce Platform with AI Recommendations" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1.5">Detailed Project Requirements & Scope</label>
                    <textarea 
                      required 
                      rows={4} 
                      className="w-full rounded-2xl glass-input p-3 text-gray-900 text-sm font-medium" 
                      placeholder="Explain all features, deliverables, tech stack requirements, and target timeline in detail..." 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1.5">Required Skills (comma separated)</label>
                    <input 
                      type="text" 
                      className="w-full rounded-2xl glass-input p-3 text-gray-900 text-sm font-medium" 
                      placeholder="React, Node.js, MongoDB, Tailwind CSS, REST APIs" 
                      value={formData.skills} 
                      onChange={e => setFormData({...formData, skills: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1.5">Minimum Budget in Rupees (₹)</label>
                      <input 
                        required 
                        type="number" 
                        min="10" 
                        className="w-full rounded-2xl glass-input p-3 text-gray-900 text-sm font-medium" 
                        placeholder="10" 
                        value={formData.budgetMin} 
                        onChange={e => setFormData({...formData, budgetMin: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1.5">Maximum Budget in Rupees (₹)</label>
                      <input 
                        required 
                        type="number" 
                        min="10" 
                        className="w-full rounded-2xl glass-input p-3 text-gray-900 text-sm font-medium" 
                        placeholder="100" 
                        value={formData.budgetMax} 
                        onChange={e => setFormData({...formData, budgetMax: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1.5">Estimated Duration</label>
                      <select 
                        className="w-full rounded-2xl glass-input p-3 text-gray-900 text-sm font-medium" 
                        value={formData.duration} 
                        onChange={e => setFormData({...formData, duration: e.target.value})}
                      >
                        <option>Less than 1 month</option>
                        <option>1 to 3 months</option>
                        <option>3 to 6 months</option>
                        <option>More than 6 months</option>
                      </select>
                    </div>
                  </div>

                  {/* AI Generated Milestones Preview */}
                  {aiGeneratedMilestones.length > 0 && (
                    <div className="p-5 bg-indigo-950/40 rounded-3xl border border-indigo-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <FiCpu className="text-indigo-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          Auto-Generated Milestones (Will be created automatically upon posting)
                        </h4>
                      </div>
                      <div className="space-y-2.5">
                        {aiGeneratedMilestones.map((ms, index) => (
                          <div key={index} className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center justify-between text-xs gap-3">
                            <div className="flex-1 min-w-0">
                              <strong className="text-white block">{ms.title}</strong>
                              <p className="text-slate-400 text-[11px] mt-0.5">{ms.description}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 border border-slate-600 px-2.5 py-1 rounded-xl">
                              <span className="font-bold text-indigo-400 text-xs">₹</span>
                              <input
                                type="number"
                                min="10"
                                value={ms.amount}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setAiGeneratedMilestones(prev => prev.map((item, i) => i === index ? { ...item, amount: val } : item));
                                }}
                                className="w-20 bg-transparent text-white font-black text-xs focus:outline-none text-right"
                                title="Edit milestone budget estimation"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setShowCreateForm(false)} 
                      className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold border border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-xl shadow-md font-bold text-xs transition-colors cursor-pointer"
                    >
                      Post Project & Enable AI Match
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filters Bar for Freelancers (Search by Title, Skills, Budget & Client) */}
            {user?.role === 'freelancer' && (
              <div className="flex flex-col sm:flex-row gap-3 glass-card p-4 rounded-2xl">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input 
                    type="text" 
                    placeholder="Search projects by title, client name, skills, or requirements..." 
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-60 relative">
                  <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input 
                    type="text" 
                    placeholder="Filter by skill (e.g. React)..." 
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium" 
                    value={skillFilter} 
                    onChange={(e) => setSkillFilter(e.target.value)} 
                  />
                </div>

                <div className="w-full sm:w-48">
                  <select
                    value={budgetFilter}
                    onChange={(e) => setBudgetFilter(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl glass-input text-xs font-bold bg-slate-900 text-white cursor-pointer"
                  >
                    <option value="all">All Budgets (₹)</option>
                    <option value="under10k">Under ₹10,000</option>
                    <option value="10k-50k">₹10,000 - ₹50,000</option>
                    <option value="above50k">Above ₹50,000</option>
                  </select>
                </div>
              </div>
            )}

            {/* Project List */}
            {loading ? (
              <div className="flex justify-center p-16 glass-card rounded-3xl">
                <LoadingSpinner />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center p-16 glass-card rounded-3xl border border-slate-800">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <FiBriefcase className="text-4xl text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
                <p className="text-slate-400 max-w-md mx-auto text-xs">
                  {user?.role === 'client' 
                    ? "You haven't posted any projects yet. Click 'Post New Project' to create your first listing and receive AI matches."
                    : "No client projects match your search criteria. Check back soon or search registered clients above."}
                </p>
                {user?.role === 'client' && (
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <FiPlus /> Create Project Now
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => {
                  const clientUser = project.client;
                  const clientId = clientUser?._id || clientUser;
                  const clientName = clientUser?.name || 'Client';

                  return (
                    <div 
                      key={project._id} 
                      className="glass-card rounded-3xl p-6 flex flex-col justify-between group border border-slate-800 hover:border-indigo-500/40"
                    >
                      <div>
                        {/* Top Status & Date */}
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                            <FiCalendar className="w-3.5 h-3.5 text-indigo-400" />
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                          {getStatusBadge(project.status || 'open')}
                        </div>

                        {/* Client details (Freelancer view) */}
                        {user?.role === 'freelancer' && clientName && (
                          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                                {clientName.slice(0, 1).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-slate-300">{clientName}</span>
                            </div>
                            {clientId && (
                              <button
                                type="button"
                                onClick={() => navigate(`/messages?userId=${clientId}`)}
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                                title="Send direct message to client"
                              >
                                <FiMessageSquare className="w-3 h-3" />
                                <span>Message</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
                          {project.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-slate-300 text-xs mb-4 line-clamp-3 leading-relaxed">
                          {project.description}
                        </p>
                        
                        {/* Skills badges */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {(project.skills || []).slice(0, 4).map((skill, i) => (
                            <span key={i} className="bg-slate-800 text-indigo-300 text-xs px-2.5 py-1 rounded-xl font-bold border border-indigo-500/20 shadow-2xs">
                              {skill}
                            </span>
                          ))}
                          {(project.skills?.length > 4) && (
                            <span className="bg-slate-800/80 text-slate-400 text-xs px-2 py-1 rounded-xl font-medium">
                              +{project.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Details & CTA in Rupees */}
                      <div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4 pt-3 border-t border-slate-800">
                          <div className="flex items-center gap-1">
                            <span className="font-black text-emerald-400 text-sm">₹</span>
                            <span className="font-black text-white text-xs">
                              {(project.budgetMin ?? 5000).toLocaleString()} - {(project.budgetMax ?? 25000).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <FiClock className="text-slate-400" />
                            <span className="truncate">{project.duration || '1-3 months'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/projects/${project._id}`}
                            className={`flex-1 text-center py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-sm ${
                              user?.role === 'client'
                                ? 'bg-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20'
                            }`}
                          >
                            {user?.role === 'client' ? 'Manage & AI Match →' : 'View Details & Apply →'}
                          </Link>

                          {user?.role === 'client' && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteProject(e, project._id)}
                              title="Delete project listing"
                              className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-xl border border-slate-700 hover:border-red-500/30 transition-colors cursor-pointer"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal: View Verified Freelancer Resume */}
        <FreelancerResumeModal
          freelancer={selectedFreelancerForResume}
          isOpen={!!selectedFreelancerForResume}
          onClose={() => setSelectedFreelancerForResume(null)}
        />

      </div>
    </DashboardLayout>
  );
}