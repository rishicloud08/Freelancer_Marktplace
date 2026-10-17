import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut, FiChevronDown, FiBriefcase, FiMessageSquare, FiShield } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import NotificationDrawer from './NotificationDrawer';
import ProposalPopupModal from './ProposalPopupModal';
import soundPlayer from '../utils/sound';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [receivedProposalPopup, setReceivedProposalPopup] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (user) {
      fetchUnread();
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (socket) {
      // 1. Incoming Real-Time Chat Message
      socket.on('messageReceived', (msg) => {
        fetchUnread();
        soundPlayer.playMessagePing();
        toast((t) => (
          <div 
            onClick={() => {
              toast.dismiss(t.id);
              navigate('/messages');
            }} 
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-md">
              💬
            </div>
            <div>
              <p className="font-bold text-xs text-slate-100">New Message</p>
              <p className="text-xs text-slate-400 line-clamp-1">{msg.content}</p>
            </div>
          </div>
        ), { duration: 4000, position: 'top-right' });
      });

      // 2. Incoming Real-Time Proposal Received Alert
      socket.on('proposalReceived', (data) => {
        fetchUnread();
        setUnreadCount(prev => prev + 1);
        
        // 🔔 Play real-time notification sound
        soundPlayer.playProposalChime();

        // 🌟 Open rich popup modal
        setReceivedProposalPopup(data);

        // 🍞 Show interactive top toast
        toast((t) => (
          <div 
            onClick={() => {
              toast.dismiss(t.id);
              if (data.project?._id) {
                navigate(`/projects/${data.project._id}`);
              }
            }} 
            className="flex items-center gap-3 cursor-pointer p-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow-md">
              🚀
            </div>
            <div>
              <p className="font-black text-xs text-slate-100">New Proposal Received!</p>
              <p className="text-xs text-emerald-400 font-bold">
                {data.freelancer?.name || 'A freelancer'} bid ₹{Number(data.proposal?.bidAmount || 10).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 line-clamp-1">{data.project?.title}</p>
            </div>
          </div>
        ), { duration: 7000, position: 'top-right' });
      });
    }

    return () => {
      if (socket) {
        socket.off('messageReceived');
        socket.off('proposalReceived');
      }
    };
  }, [socket]);

  const fetchUnread = async () => {
    try {
      const res = await api.messages.getUnreadCount();
      setUnreadCount(res.data?.totalUnread || 0);
    } catch (err) {
      // Fallback
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
      ? 'text-indigo-400 font-black border-b-2 border-indigo-500 bg-indigo-500/15 rounded-t-xl' 
      : 'text-slate-300 hover:text-indigo-400 font-semibold hover:bg-slate-800/50 rounded-t-xl';
  };

  const clientLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'My Projects', path: '/projects' },
    { name: 'Messages', path: '/messages', badge: unreadCount },
    { name: 'Billing & Receipts', path: '/wallet' }
  ];

  const freelancerLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Browse Projects', path: '/projects' },
    { name: 'My Proposals', path: '/my-proposals' },
    { name: 'Messages', path: '/messages', badge: unreadCount },
    { name: 'Earnings & Invoices', path: '/wallet' }
  ];

  const navLinks = user ? (user.role === 'client' ? clientLinks : freelancerLinks) : [];

  return (
    <>
      <nav className="glass-dark sticky top-0 z-40 border-b border-slate-800/80 shadow-md backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Left side: Logo & Links */}
            <div className="flex items-center">
              <Link to={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <FiBriefcase className="text-xl" />
                </div>
                <span className="font-black text-2xl tracking-tight text-white">
                  Freelance<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Hub</span>
                </span>
              </Link>
              
              {/* Desktop Nav Links */}
              {user && (
                <div className="hidden md:ml-10 md:flex md:space-x-4 h-full items-center">
                  {navLinks.map(link => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm transition-all ${isActive(link.path)}`}
                    >
                      <span>{link.name}</span>
                      {link.badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Auth / Profile */}
            <div className="hidden md:flex items-center space-x-5">
              {!user ? (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-slate-200 hover:text-indigo-400 font-bold text-sm transition-colors px-4 py-2 rounded-xl hover:bg-slate-800/60">
                    Login
                  </Link>
                  <Link to="/register/client" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition-all hover:scale-102">
                    Get Started
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  {/* Notification Center Trigger */}
                  <button 
                    onClick={() => setIsNotificationDrawerOpen(true)}
                    className="text-slate-400 hover:text-indigo-400 transition-colors relative p-2 rounded-xl hover:bg-slate-800/60 cursor-pointer"
                  >
                    <FiBell className="text-xl" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Profile Dropdown with Glass styling */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-2.5 p-1.5 rounded-2xl hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-700/60 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center shadow-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <FiChevronDown className="text-slate-400 text-sm" />
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl py-1.5 glass-dark ring-1 ring-white/10 z-20 overflow-hidden border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-4 py-3 border-b border-slate-700/60 bg-slate-800/50">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-[11px] font-semibold text-indigo-400 capitalize">{user.role}</p>
                          </div>
                          <Link to="/wallet" className="flex items-center px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                            <FiShield className="mr-2.5 text-sm text-emerald-400" /> Payments & Billing (₹)
                          </Link>
                          <Link to="/profile" className="flex items-center px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                            <FiUser className="mr-2.5 text-sm text-indigo-400" /> Profile & QR Settings
                          </Link>
                          <button onClick={() => { setIsDropdownOpen(false); handleLogout(); }} className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer">
                            <FiLogOut className="mr-2.5 text-sm" /> Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-indigo-400 hover:bg-slate-800/60 focus:outline-none transition-colors"
              >
                {isMobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-dark border-b border-slate-800 shadow-2xl absolute w-full left-0 animate-in slide-in-from-top-2">
            {user ? (
              <>
                <div className="pt-3 pb-3 space-y-1.5 px-3">
                  {navLinks.map(link => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-800/80 hover:text-indigo-400 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{link.name}</span>
                      {link.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="pt-4 pb-4 border-t border-slate-800 px-4 bg-slate-900/80">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-bold text-white">{user.name}</div>
                      <div className="text-xs font-medium text-slate-400 capitalize">{user.role}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Link to="/wallet" className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/60 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Billing & Receipts</Link>
                    <Link to="/profile" className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/60 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                    <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors">Sign Out</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="pt-3 pb-5 px-4 space-y-3">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 text-slate-200 font-bold bg-slate-800 rounded-2xl shadow-xs hover:bg-slate-700">Login</Link>
                <Link to="/register/client" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 text-white font-bold bg-indigo-600 rounded-2xl shadow-md hover:bg-indigo-500">Get Started</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        unreadCount={unreadCount}
      />

      {/* Real-Time Proposal Received Alert Modal */}
      <ProposalPopupModal
        isOpen={!!receivedProposalPopup}
        onClose={() => setReceivedProposalPopup(null)}
        proposalData={receivedProposalPopup}
      />
    </>
  );
}