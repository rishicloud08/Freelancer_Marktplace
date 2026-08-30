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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <Link to="/" className="flex justify-center mb-6">
            <span className="text-3xl font-extrabold text-primary-600">FreelanceHub</span>
          </Link>
          <h2 className="text-center text-2xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Choose how you want to sign in</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
            {/* Client Card */}
            <button
              onClick={() => setRole('client')}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-primary-500 transition-all duration-300 p-8 text-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                <FiBriefcase className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Client</h3>
              <p className="text-sm text-gray-500">I want to hire freelancers for my projects</p>
              <div className="mt-4 inline-flex items-center text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                Sign in as Client →
              </div>
            </button>

            {/* Freelancer Card */}
            <button
              onClick={() => setRole('freelancer')}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-green-500 transition-all duration-300 p-8 text-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <FiUser className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Freelancer</h3>
              <p className="text-sm text-gray-500">I want to find projects and offer my skills</p>
              <div className="mt-4 inline-flex items-center text-green-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                Sign in as Freelancer →
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">Register here</Link>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-4">
          <span className="text-3xl font-extrabold text-primary-600">FreelanceHub</span>
        </Link>

        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 ${isClient ? 'bg-primary-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
            <Icon className={`w-7 h-7 ${isClient ? 'text-primary-600' : 'text-green-600'}`} />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-gray-900">
          {isClient ? 'Client' : 'Freelancer'} Sign In
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          {isClient ? 'Hire top talent for your projects' : 'Find great projects that match your skills'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isClient ? 'alice@example.com' : 'diana@example.com'}
                className={`mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-${accentColor}-500`}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white ${
                  isClient
                    ? 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors`}
              >
                {loading ? 'Signing in...' : `Sign in as ${isClient ? 'Client' : 'Freelancer'}`}
              </button>
            </div>
          </form>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setRole(null)}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Switch role
            </button>
            <Link
              to={isClient ? '/register/client' : '/register/freelancer'}
              className={`text-sm font-medium ${isClient ? 'text-primary-600 hover:text-primary-500' : 'text-green-600 hover:text-green-500'}`}
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Demo credentials hint & 1-Click Fill */}
        <div className="mt-4 mx-4 sm:mx-0 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-700">Quick Demo {isClient ? 'Client' : 'Freelancer'} Account:</p>
            <button
              type="button"
              onClick={() => {
                setEmail(isClient ? 'kesh@gmail.com' : 'freelancer@example.com');
                setPassword('password123');
              }}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                isClient ? 'bg-primary-50 text-primary-700 hover:bg-primary-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
              } transition-colors cursor-pointer`}
            >
              ⚡ 1-Click Autofill
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Email: <code className="bg-gray-100 font-bold px-1.5 py-0.5 rounded text-gray-900">{isClient ? 'kesh@gmail.com' : 'freelancer@example.com'}</code> &nbsp;
            Password: <code className="bg-gray-100 font-bold px-1.5 py-0.5 rounded text-gray-900">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;