import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiBriefcase, FiUser } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null); // null = selection screen
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Role selection screen
  if (!role) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <Link to="/" className="flex justify-center mb-6">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">FreelanceHub</span>
          </Link>
          <h2 className="text-center text-2xl font-bold text-white">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-slate-400">Choose how you want to sign in</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
            {/* Client Card */}
            <button
              onClick={() => setRole('client')}
              className="group glass-card bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-indigo-500/50 shadow-xl transition-all duration-300 p-8 text-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-500/30 transition-colors">
                <FiBriefcase className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Client</h3>
              <p className="text-sm text-slate-400">I want to hire freelancers for my projects</p>
              <div className="mt-4 inline-flex items-center text-indigo-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                Sign in as Client →
              </div>
            </button>

            {/* Freelancer Card */}
            <button
              onClick={() => setRole('freelancer')}
              className="group glass-card bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-emerald-500/50 shadow-xl transition-all duration-300 p-8 text-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 transition-colors">
                <FiUser className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Freelancer</h3>
              <p className="text-sm text-slate-400">I want to find projects and offer my skills</p>
              <div className="mt-4 inline-flex items-center text-emerald-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                Sign in as Freelancer →
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">Register here</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login form (role-specific)
  const isClient = role === 'client';
  const accentColor = isClient ? 'primary' : 'green';
  const Icon = isClient ? FiBriefcase : FiUser;

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-4">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">FreelanceHub</span>
        </Link>

        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 ${isClient ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'} rounded-full flex items-center justify-center`}>
            <Icon className="w-7 h-7" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-white">
          {isClient ? 'Client' : 'Freelancer'} Sign In
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          {isClient ? 'Hire top talent for your projects' : 'Find great projects that match your skills'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card bg-slate-900/90 py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white ${
                  isClient
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer`}
              >
                {loading ? 'Signing in...' : `Sign in as ${isClient ? 'Client' : 'Freelancer'}`}
              </button>
            </div>
          </form>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setRole(null)}
              className="text-sm text-slate-400 hover:text-white font-medium cursor-pointer"
            >
              ← Switch role
            </button>
            <Link
              to={isClient ? '/register/client' : '/register/freelancer'}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;