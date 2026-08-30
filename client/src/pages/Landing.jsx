import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiCpu, 
  FiMessageCircle, 
  FiCheckCircle, 
  FiShield, 
  FiZap, 
  FiStar, 
  FiArrowRight, 
  FiCheck,
  FiUser,
  FiLock,
  FiMail,
  FiLogIn,
  FiSmartphone,
  FiBriefcase
} from 'react-icons/fi';

export default function Landing() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const handleQuickLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter your email and password');
    }
    setLoadingLogin(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleOneClickLogin = async (role) => {
    setLoadingLogin(true);
    try {
      if (role === 'client') {
        // Try user's client account first, fallback to demo client
        try {
          await login('kesh@gmail.com', 'password123');
        } catch (e) {
          await login('client@example.com', 'password123');
        }
      } else {
        // Try user's freelancer account first, fallback to demo freelancer
        try {
          await login('freelancer@example.com', 'password123');
        } catch (e) {
          await login('rishi@example.com', 'password123');
        }
      }
      toast.success(`Signed in as ${role === 'client' ? 'Client' : 'Freelancer'}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error('Quick login failed. Please enter credentials below.');
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white pt-32 pb-24 lg:pt-36 lg:pb-32">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Where Talent Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Opportunity</span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
              Experience the future of work. Our AI-powered matching reduces hiring time by 40% and connects you with the perfect fit.
            </p>
            
            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
              <Link to="/register" className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-full shadow-lg hover:bg-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                Hire Freelancers
              </Link>
              <Link to="/register" className="px-8 py-4 bg-indigo-700 text-white font-bold rounded-full shadow-lg border border-indigo-500 hover:bg-indigo-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                Find Work
              </Link>
            </div>

            {/* CENTERED EASY 1-CLICK LOGIN & QUICK ACCESS MODULE */}
            <div className="max-w-xl mx-auto glass-dark p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl text-left animate-in fade-in zoom-in-95 duration-300">
              {user ? (
                /* Already Logged In Card */
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-bold">
                    <FiCheckCircle className="text-emerald-400" /> Active Session
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Logged in as <span className="text-emerald-300">{user.name}</span>
                  </h3>
                  <p className="text-xs text-gray-300">
                    Role: <strong className="uppercase text-white tracking-wider">{user.role}</strong> ({user.email})
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FiZap className="text-yellow-300" /> Go to Your Dashboard →
                    </button>
                    <button
                      onClick={logout}
                      className="bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-semibold py-3 px-5 rounded-2xl border border-white/10 transition-all text-xs cursor-pointer"
                    >
                      Switch Account
                    </button>
                  </div>
                </div>
              ) : (
                /* Instant 1-Click Login Form */
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        <FiLogIn className="text-purple-400" /> Quick Sign In
                      </h3>
                      <p className="text-[11px] text-gray-300 mt-0.5">
                        1-Click instant demo login or enter your account credentials.
                      </p>
                    </div>
                    <span className="bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                      Fast Access
                    </span>
                  </div>

                  {/* 1-Click Instant Demo Login Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOneClickLogin('client')}
                      disabled={loadingLogin}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-emerald-400/50 p-3.5 rounded-2xl text-left transition-all cursor-pointer group shadow-sm flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform flex-shrink-0">
                        <FiBriefcase />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">1-Click Sign In</span>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">Client Account</h4>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOneClickLogin('freelancer')}
                      disabled={loadingLogin}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-purple-400/50 p-3.5 rounded-2xl text-left transition-all cursor-pointer group shadow-sm flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform flex-shrink-0">
                        <FiUser />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider block">1-Click Sign In</span>
                        <h4 className="text-xs font-bold text-white group-hover:text-purple-300">Freelancer Account</h4>
                      </div>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-3 text-[11px] text-gray-400 font-semibold uppercase">Or Sign In with Email</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  {/* Inline Email / Password Form */}
                  <form onSubmit={handleQuickLogin} className="space-y-3">
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-3 text-gray-400 text-sm" />
                      <input
                        type="email"
                        required
                        placeholder="Your email address (e.g. kesh@gmail.com)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-white placeholder-gray-400"
                      />
                    </div>

                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-3 text-gray-400 text-sm" />
                      <input
                        type="password"
                        required
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-white placeholder-gray-400"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="submit"
                        disabled={loadingLogin}
                        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <FiLogIn />
                        {loadingLogin ? 'Signing In...' : 'Sign In to Account →'}
                      </button>
                    </div>
                  </form>

                  <div className="text-center pt-1 border-t border-white/10 text-[11px] text-gray-300">
                    Don't have an account yet?{' '}
                    <Link to="/register" className="text-purple-300 font-bold hover:underline">
                      Create Free Account
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Trusted By */}
        <section className="bg-gray-50 py-10 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm font-semibold text-gray-400 tracking-widest uppercase mb-6">Trusted by innovative teams worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-2xl font-bold font-serif text-gray-800">Google</span>
              <span className="text-2xl font-bold font-sans text-gray-800">Microsoft</span>
              <span className="text-2xl font-bold font-sans tracking-tighter text-gray-800">Meta</span>
              <span className="text-2xl font-bold font-sans lowercase text-gray-800">amazon</span>
              <span className="text-2xl font-bold font-sans text-red-600 uppercase tracking-widest">Netflix</span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">How It Works</h2>
              <p className="text-xl text-gray-500">Seamless process for both clients and freelancers</p>
            </div>

            <div className="grid md:grid-cols-2 gap-16">
              {/* For Clients */}
              <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 relative">
                <div className="absolute -top-4 -left-4 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">FOR CLIENTS</div>
                <h3 className="text-2xl font-bold mb-8 text-indigo-900">Hire top talent easily</h3>
                <div className="space-y-8">
                  {[
                    { title: "Post Your Project", desc: "Share your requirements and goals in minutes." },
                    { title: "AI Matches Top Talent", desc: "Our algorithm finds the best fit instantly." },
                    { title: "Collaborate & Pay Directly", desc: "Manage work and pay directly via Google Pay." }
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-indigo-600 text-xl shadow-sm border border-indigo-100 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h4>
                        <p className="text-gray-600">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* For Freelancers */}
              <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 relative">
                <div className="absolute -top-4 -left-4 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">FOR FREELANCERS</div>
                <h3 className="text-2xl font-bold mb-8 text-emerald-900">Find work you love</h3>
                <div className="space-y-8">
                  {[
                    { title: "Create Your Profile", desc: "Highlight your skills, experience, and portfolio." },
                    { title: "Get AI-Matched Projects", desc: "Receive curated project recommendations." },
                    { title: "Deliver & Get Paid", desc: "Submit work and get paid securely and on time." }
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-emerald-600 text-xl shadow-sm border border-emerald-100 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h4>
                        <p className="text-gray-600">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">Why Choose FreelanceHub?</h2>
              <p className="text-xl text-gray-500">Built with modern technology to ensure a safe, efficient, and productive environment for everyone.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <FiCpu />, title: "AI-Powered Matching", desc: "Our smart algorithms ensure clients find the perfect freelancers and vice versa." },
                { icon: <FiMessageCircle />, title: "Real-time Messaging", desc: "Communicate seamlessly with built-in chat for quick alignment." },
                { icon: <FiCheckCircle />, title: "Milestone Tracking", desc: "Break projects into manageable chunks and track progress easily." },
                { icon: <FiShield />, title: "Direct Google Pay & UPI", desc: "0% commission fees with direct payments straight to your bank account." },
                { icon: <FiZap />, title: "Smart Recommendations", desc: "Get AI insights on how to improve proposals or project descriptions." },
                { icon: <FiStar />, title: "Transparent Reviews", desc: "Build a reputation based on verified feedback from completed projects." }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-indigo-950 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "40%", label: "Faster Hiring" },
                { value: "10k+", label: "Projects Completed" },
                { value: "5k+", label: "Verified Freelancers" },
                { value: "98%", label: "Client Satisfaction" }
              ].map((stat, idx) => (
                <div key={idx} className="p-4">
                  <div className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">{stat.value}</div>
                  <div className="text-indigo-200 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-white text-center relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">Ready to Get Started?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6 max-w-2xl mx-auto">
              <Link to="/register/client" className="flex-1 px-8 py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-lg">
                I'm a Client <FiArrowRight />
              </Link>
              <Link to="/register/freelancer" className="flex-1 px-8 py-5 bg-white text-gray-900 font-bold rounded-2xl shadow-lg border-2 border-gray-100 hover:border-indigo-100 hover:bg-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-lg">
                I'm a Freelancer <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm shadow-lg">FH</span>
            FreelanceHub
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} FreelanceHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}