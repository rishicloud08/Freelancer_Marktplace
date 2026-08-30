import React, { useState, useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiBriefcase, FiUser, FiCode, FiDollarSign, FiStar } from 'react-icons/fi';
import StarRating from '../components/StarRating';

const Register = () => {
  const { role: urlRole } = useParams();
  const [role, setRole] = useState(urlRole || null); // null = selection screen
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
      };
      if (role === 'freelancer') {
        payload.skills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
        payload.hourlyRate = Number(formData.hourlyRate) || 0;
        payload.bio = formData.bio;
        payload.rating = formData.experienceRating || 5;
      }
      if (role === 'client' && formData.company) {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <Link to="/" className="flex justify-center mb-6">
            <span className="text-3xl font-extrabold text-primary-600">FreelanceHub</span>
          </Link>
          <h2 className="text-center text-2xl font-bold text-gray-900">Join FreelanceHub</h2>
          <p className="mt-2 text-center text-sm text-gray-600">How do you want to use the platform?</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
            {/* Client Card */}
            <button
              onClick={() => setRole('client')}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-primary-500 transition-all duration-300 p-8 text-left cursor-pointer"
            >
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <FiBriefcase className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">I'm a Client</h3>
              <p className="text-sm text-gray-500 mb-4">Hire talented freelancers for your projects</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                  Post projects & get proposals
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                  AI-powered freelancer matching
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                  Milestone-based payments
                </li>
              </ul>
              <div className="mt-5 w-full py-2 text-center bg-primary-50 text-primary-600 rounded-lg font-semibold text-sm group-hover:bg-primary-100 transition-colors">
                Register as Client →
              </div>
            </button>

            {/* Freelancer Card */}
            <button
              onClick={() => setRole('freelancer')}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-green-500 transition-all duration-300 p-8 text-left cursor-pointer"
            >
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <FiCode className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">I'm a Freelancer</h3>
              <p className="text-sm text-gray-500 mb-4">Find projects that match your skills</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  ⭐ Yellow Star Experience Rating
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  AI-matched project recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Secure encrypted chat & payments
                </li>
              </ul>
              <div className="mt-5 w-full py-2 text-center bg-green-50 text-green-600 rounded-lg font-semibold text-sm group-hover:bg-green-100 transition-colors">
                Register as Freelancer →
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  const isClient = role === 'client';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-4">
          <span className="text-3xl font-extrabold text-primary-600">FreelanceHub</span>
        </Link>

        <div className="flex justify-center mb-3">
          <div className={`w-12 h-12 ${isClient ? 'bg-primary-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
            {isClient
              ? <FiBriefcase className="w-6 h-6 text-primary-600" />
              : <FiCode className="w-6 h-6 text-green-600" />
            }
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-gray-900">
          {isClient ? 'Client' : 'Freelancer'} Registration
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          {isClient ? 'Start hiring talented freelancers today' : 'Showcase your skills and find great projects'}
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Common fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleChange('name')}
                placeholder={isClient ? 'John Smith' : 'Jane Developer'}
                className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="Min 6 chars"
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="Re-enter"
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Client-specific fields */}
            {isClient && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Company / Organization <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={handleChange('company')}
                  placeholder="Your company name"
                  className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {/* Freelancer-specific fields */}
            {!isClient && (
              <>
                {/* Yellow Star Experience Level Selector */}
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    ⭐ Select Your Professional Experience Level:
                  </label>
                  <p className="text-[11px] text-amber-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700">
                    Skills <span className="text-gray-400">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.skills}
                    onChange={handleChange('skills')}
                    placeholder="React, Node.js, Python, UI/UX"
                    className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hourly Rate (₹/hr)
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      required
                      value={formData.hourlyRate}
                      onChange={handleChange('hourlyRate')}
                      placeholder="500"
                      className="block w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm">/hr</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bio <span className="text-gray-400">(tell clients about yourself)</span>
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={handleChange('bio')}
                    rows={3}
                    placeholder="I'm a full-stack developer with 5 years of experience specializing in..."
                    className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white ${
                  isClient
                    ? 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors`}
              >
                {loading ? 'Creating account...' : `Create ${isClient ? 'Client' : 'Freelancer'} Account`}
              </button>
            </div>
          </form>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setRole('null')}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Switch role
            </button>
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Already registered? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;