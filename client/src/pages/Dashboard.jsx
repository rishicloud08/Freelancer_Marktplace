import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import AIMatchBadge from '../components/AIMatchBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiBriefcase, FiFileText, FiTrendingUp, FiPlus, FiArrowRight, FiClock, FiStar, FiZap, FiSearch, FiUser } from 'react-icons/fi';

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl md:text-3xl font-black text-white mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.role === 'client') {
          const res = await api.projects.getMyProjects();
          setProjects(Array.isArray(res.data) ? res.data : []);
        } else {
          const projRes = await api.projects.getAssignedProjects();
          setProjects(Array.isArray(projRes.data) ? projRes.data : []);
          
          try {
            const aiRes = await api.ai.recommendProjects();
            setRecommendations(Array.isArray(aiRes.data) ? aiRes.data : []);
          } catch {
            const openRes = await api.projects.getProjects({ status: 'open' });
            const openProjects = Array.isArray(openRes.data) ? openRes.data : (openRes.data?.projects || []);
            setRecommendations(openProjects.slice(0, 6).map(p => ({ project: p, score: null })));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDashboardData();
  }, [user]);

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  const activeProjects = projects.filter(p => p.status === 'in-progress');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const openProjects = projects.filter(p => p.status === 'open');

  return (
    <DashboardLayout>
      {/* Welcome Glass Header */}
      <div className="mb-8 glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              {user?.role === 'client' ? 'Client Command Center' : 'Freelancer Workspace'}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-2">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-xl">
              {user?.role === 'client'
                ? 'Manage your posted projects, fund milestones via GPay, and discover talent.'
                : 'Explore client projects, submit proposals with your yellow star rating, and collaborate in Rupees (₹).'}
            </p>
          </div>
          {user?.role === 'client' ? (
            <div className="flex items-center gap-2">
              <Link to="/projects?tab=freelancers" className="inline-flex items-center gap-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer">
                <FiSearch className="w-4 h-4" /> Find Freelancers
              </Link>
              <Link to="/projects" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer">
                <FiPlus className="w-4 h-4" /> Post New Project
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/projects?tab=clients" className="inline-flex items-center gap-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer">
                <FiUser className="w-4 h-4" /> Search Clients
              </Link>
              <Link to="/projects" className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-2xl text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all cursor-pointer">
                <FiZap className="w-4 h-4" /> Browse Projects
              </Link>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'client' ? (
        <>
          {/* Client Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={FiBriefcase} label="Total Projects" value={projects.length} color="text-indigo-400" bgColor="bg-indigo-500/20" />
            <StatCard icon={FiTrendingUp} label="Active In Progress" value={activeProjects.length} color="text-emerald-400" bgColor="bg-emerald-500/20" />
            <StatCard icon={FiFileText} label="Open for Bids" value={openProjects.length} color="text-blue-400" bgColor="bg-blue-500/20" />
            <StatCard icon={FiBriefcase} label="Billing Spent" value={`₹${(user?.balance || 0).toLocaleString()}`} color="text-indigo-400" bgColor="bg-indigo-500/20" />
          </div>

          {/* Quick Search Freelancers Widget */}
          <div className="glass-card rounded-3xl p-6 mb-8 border border-purple-500/20 bg-gradient-to-r from-purple-900/20 via-slate-900/60 to-indigo-900/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                  ⚡ Talent Search Engine
                </span>
                <h3 className="text-lg font-black text-white mt-2">Search Registered Freelancers</h3>
                <p className="text-xs text-slate-400 mt-0.5">Find developers by technical skills (React, Python, Node, Cloud) and inspect their resumes.</p>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(`/projects?tab=freelancers&q=${encodeURIComponent(quickSearch)}`);
                }}
                className="flex items-center gap-2 max-w-md w-full"
              >
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Search by skill (React, Python...) or name..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer whitespace-nowrap"
                >
                  Search Talent
                </button>
              </form>
            </div>
          </div>
          
          {/* Recent Projects */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Client Projects</h2>
            <Link to="/projects" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          {projects.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <FiBriefcase className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">No projects posted yet</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">Post your first project in Rupees and let AI match top freelancers.</p>
              <Link to="/projects" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-indigo-500 transition-colors">
                <FiPlus /> Post a Project
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map(project => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="glass-card rounded-2xl p-5 flex items-center justify-between group block border border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate text-sm">{project.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-bold text-slate-200">
                        ₹{(project.budgetMin ?? 5000).toLocaleString()} - ₹{(project.budgetMax ?? 25000).toLocaleString()}
                      </span>
                      {project.duration && <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" />{project.duration}</span>}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ml-4 whitespace-nowrap ${
                    project.status === 'open' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    project.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    project.status === 'completed' ? 'bg-slate-800 text-slate-300' :
                    'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>{project.status}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Freelancer Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={FiBriefcase} label="Active Gigs" value={activeProjects.length} color="text-emerald-400" bgColor="bg-emerald-500/20" />
            <StatCard icon={FiFileText} label="Completed Projects" value={completedProjects.length} color="text-blue-400" bgColor="bg-blue-500/20" />
            <StatCard icon={FiTrendingUp} label="Total Earnings" value={`₹${(user?.balance || 0).toLocaleString()}`} color="text-amber-400" bgColor="bg-amber-500/20" />
            <StatCard icon={FiStar} label="Rating Tier" value={user?.rating ? `${user.rating.toFixed(1)} ★` : '5.0 ★'} color="text-purple-400" bgColor="bg-purple-500/20" />
          </div>

          {/* Quick Search Projects & Clients Widget */}
          <div className="glass-card rounded-3xl p-6 mb-8 border border-emerald-500/20 bg-gradient-to-r from-emerald-900/20 via-slate-900/60 to-teal-900/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  ⚡ Client & Project Discovery
                </span>
                <h3 className="text-lg font-black text-white mt-2">Search Open Projects & Registered Clients</h3>
                <p className="text-xs text-slate-400 mt-0.5">Explore open contracts with budgets in Rupees (₹) or search registered clients directly.</p>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(`/projects?q=${encodeURIComponent(quickSearch)}`);
                }}
                className="flex items-center gap-2 max-w-md w-full"
              >
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="text"
                    placeholder="Search by project title, skill or client..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer whitespace-nowrap"
                >
                  Search Work
                </button>
              </form>
            </div>
          </div>

          {/* Recommended Projects */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {recommendations.some(r => r.score !== null) ? '🧠 AI Recommended Projects for You' : '📋 Open Client Projects'}
            </h2>
            <Link to="/projects" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Browse All <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          {recommendations.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <FiZap className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">No projects available right now</h3>
              <p className="text-xs text-slate-400 mt-1">Check back later when clients post new opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((rec, idx) => {
                const project = rec.project || rec;
                return (
                  <Link
                    key={project?._id || idx}
                    to={`/projects/${project?._id}`}
                    className="glass-card rounded-3xl flex flex-col group border border-slate-800"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 text-sm">{project?.title}</h3>
                        {rec.score !== null && <AIMatchBadge score={rec.score} />}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{project?.description}</p>
                      {project?.skills && (
                        <div className="flex flex-wrap gap-1.5">
                          {project.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800/80 text-emerald-300 rounded-md text-[11px] font-semibold border border-emerald-500/20">{skill}</span>
                          ))}
                        </div>
                      )}
                      {rec.reason && <p className="mt-2 text-xs text-emerald-400 italic">💡 {rec.reason}</p>}
                    </div>
                    <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/60 rounded-b-3xl">
                      <span className="text-xs font-black text-white">₹{(project?.budgetMin ?? 5000).toLocaleString()} - ₹{(project?.budgetMax ?? 25000).toLocaleString()}</span>
                      <span className="text-xs text-emerald-400 font-bold group-hover:translate-x-1 transition-transform">Apply Now →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};
export default Dashboard;