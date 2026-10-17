import React, { useState, useContext } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiBriefcase, FiUser, FiCode, FiDollarSign, FiStar } from 'react-icons/fi';
import StarRating from '../components/StarRating';

const Register = () => {
  const { role: urlRole } = useParams();
  const location = useLocation();
  const normalizedUrlRole = (urlRole === 'client' || urlRole === 'freelancer') ? urlRole : null;
  const [role, setRole] = useState(normalizedUrlRole); // null = selection screen
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    password: '',
    confirmPassword: '',
    skills: '',
    hourlyRate: '',
    bio: '',
    company: '',
    experienceRating: 5 // 1-5 yellow stars
  });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const effectiveRole = (role === 'client' || role === 'freelancer') ? role : 'freelancer';
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: effectiveRole,
      };
      if (effectiveRole === 'freelancer') {
        payload.skills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        payload.hourlyRate = Number(formData.hourlyRate) || 0;
        payload.bio = formData.bio;
        payload.rating = formData.experienceRating || 5;
      }
      if (effectiveRole === 'client' && formData.company) {
        payload.bio = formData.company;
      }
      await register(payload);
      toast.success('Account created successfully! 🎉');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
          <h2 className="text-center text-2xl font-bold text-white">Join FreelanceHub</h2>
          <p className="mt-2 text-center text-sm text-slate-400">How do you want to use the platform?</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
            {/* Client Card */}
            <button
              onClick={() => setRole('client')}
              className="group glass-card bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-indigo-500/50 shadow-xl transition-all duration-300 p-8 text-left cursor-pointer"
            >
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-500/30 transition-colors">
                <FiBriefcase className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">I'm a Client</h3>
              <p className="text-sm text-slate-400 mb-4">Hire talented freelancers for your projects</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  Post projects & get proposals
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  AI-powered freelancer matching
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  Milestone-based payments
                </li>
              </ul>
              <div className="mt-5 w-full py-2.5 text-center bg-indigo-500/20 text-indigo-300 rounded-xl font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                Register as Client →
              </div>
            </button>

            {/* Freelancer Card */}
            <button
              onClick={() => setRole('freelancer')}
              className="group glass-card bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-emerald-500/50 shadow-xl transition-all duration-300 p-8 text-left cursor-pointer"
            >
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition-colors">
                <FiCode className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">I'm a Freelancer</h3>
              <p className="text-sm text-slate-400 mb-4">Find projects that match your skills</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  ⭐ Yellow Star Experience Rating
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  AI-matched project recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  Direct Google Pay (0% Fee)
                </li>
              </ul>
              <div className="mt-5 w-full py-2.5 text-center bg-emerald-500/20 text-emerald-300 rounded-xl font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                Register as Freelancer →
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  const isClient = role === 'client';

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-4">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">FreelanceHub</span>
        </Link>

        <div className="flex justify-center mb-3">
          <div className={`w-12 h-12 ${isClient ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'} rounded-full flex items-center justify-center`}>
            {isClient
              ? <FiBriefcase className="w-6 h-6" />
              : <FiCode className="w-6 h-6" />
            }
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-white">
          {isClient ? 'Client' : 'Freelancer'} Registration
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          {isClient ? 'Start hiring talented freelancers today' : 'Showcase your skills and find great projects'}
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card bg-slate-900/90 py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Common fields */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                required
                autoComplete="off"
                value={formData.name}
                onChange={handleChange('name')}
                placeholder={isClient ? 'Your Name or Company' : 'Your Full Name'}
                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                required
                autoComplete="off"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="Min 6 chars"
                  className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Confirm</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Re-enter"
                  className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Client-specific fields */}
            {isClient && (
              <div>
                <label className="block text-sm font-medium text-slate-300">Company / Organization <span className="text-slate-500">(optional)</span></label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={handleChange('company')}
                  placeholder="Your company name"
                  className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Freelancer-specific fields */}
            {!isClient && (
              <>
                {/* Yellow Star Experience Level Selector */}
                <div className="bg-amber-950/30 p-4 rounded-xl border border-amber-500/30">
                  <label className="block text-xs font-bold text-amber-400 mb-1">
                    ⭐ Select Your Professional Experience Level:
                  </label>
                  <p className="text-[11px] text-amber-300/80 mb-2">
                    Click yellow stars (1 = Beginner, 5 = Expert)
                  </p>
                  <StarRating
                    value={formData.experienceRating}
                    onChange={(stars) => setFormData({ ...formData, experienceRating: stars })}
                    size="lg"
                    showLabel={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Skills <span className="text-slate-500">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.skills}
                    onChange={handleChange('skills')}
                    placeholder="React, Node.js, Python, UI/UX"
                    className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Hourly Rate (₹/hr)
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-emerald-400 font-bold text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      required
                      value={formData.hourlyRate}
                      onChange={handleChange('hourlyRate')}
                      placeholder="500"
                      className="block w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-sm">/hr</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Bio <span className="text-slate-500">(tell clients about yourself)</span>
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={handleChange('bio')}
                    rows={3}
                    placeholder="I'm a full-stack developer with 5 years of experience specializing in..."
                    className="mt-1 block w-full px-3.5 py-2.5 bg-slate-800/80 text-white border border-slate-700 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white ${
                  isClient
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer`}
              >
                {loading ? 'Creating account...' : `Create ${isClient ? 'Client' : 'Freelancer'} Account`}
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
            <Link to="/login" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
              Already registered? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;