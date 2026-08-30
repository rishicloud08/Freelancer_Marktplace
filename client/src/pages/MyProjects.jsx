import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiBriefcase, FiPlus, FiClock, FiDollarSign } from 'react-icons/fi';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

const MyProjects = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.projects.getMyProjects();
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your posted projects</p>
        </div>
        <Link
          to="/projects"
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <FiPlus className="w-4 h-4" /> Create New Project
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'open', 'in-progress', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            {status === 'all' && ` (${projects.length})`}
            {status !== 'all' && ` (${projects.filter(p => p.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FiBriefcase className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {filter === 'all' ? 'Create your first project to start hiring talented freelancers.' : 'Try a different filter.'}
          </p>
          {filter === 'all' && (
            <Link to="/projects" className="mt-4 inline-flex items-center gap-2 text-primary-600 font-medium text-sm hover:text-primary-700">
              <FiPlus /> Create a project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(project => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all p-6 group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${statusColors[project.status] || 'bg-gray-100 text-gray-600'}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {project.skills?.slice(0, 4).map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">{skill}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><FiDollarSign className="w-3.5 h-3.5" />${project.budgetMin} - ${project.budgetMax}</span>
                  {project.duration && <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" />{project.duration}</span>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
export default MyProjects;