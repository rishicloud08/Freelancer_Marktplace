import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
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
  FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import AIMatchBadge from '../components/AIMatchBadge';

export default function Projects() {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters for freelancer view
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  
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

  useEffect(() => {
    fetchProjects();
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

  // INNOVATION 1: AI Project Architect - Auto Generate Scope & Milestones
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

  const filteredProjects = projects.filter(p => {
    if (user?.role === 'client') return true;
    const titleMatch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSkill = !skillFilter || (p.skills && p.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase())));
    return (titleMatch || descMatch) && matchSkill;
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
        
        {/* Top Glass Header */}
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
              {user?.role === 'client' ? 'My Posted Projects' : 'Explore Open Projects'}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              {user?.role === 'client' 
                ? 'Create projects, auto-generate milestones with AI, and review proposals.'
                : 'Browse client projects, view budget in Rupees (₹), and apply with your custom experience rating.'}
            </p>
          </div>

          {/* Client: Post Project CTA */}
          {user?.role === 'client' && (
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <FiPlus className="text-lg" />
              {showCreateForm ? 'Close Project Form' : 'Post New Project'}
            </button>
          )}
        </div>

        {/* Client: Post Project Form Glass Card */}
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
                      <div key={index} className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-white">{ms.title}</strong>
                          <p className="text-slate-400 text-[11px] mt-0.5">{ms.description}</p>
                        </div>
                        <span className="font-black text-indigo-400 text-sm whitespace-nowrap ml-4">
                          ₹{Number(ms.amount).toLocaleString()}
                        </span>
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

        {/* Filters (Freelancer View) */}
        {user?.role === 'freelancer' && (
          <div className="flex flex-col sm:flex-row gap-3 glass-card p-4 rounded-2xl">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input 
                type="text" 
                placeholder="Search projects by title, keywords or requirements..." 
                className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="w-full sm:w-72 relative">
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input 
                type="text" 
                placeholder="Filter by skill (e.g. React)..." 
                className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium" 
                value={skillFilter} 
                onChange={(e) => setSkillFilter(e.target.value)} 
              />
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
                : "No client projects matching your search criteria. Check back soon for new opportunities posted by clients."}
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
            {filteredProjects.map(project => (
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
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}