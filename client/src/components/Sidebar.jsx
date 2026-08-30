import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiBriefcase, FiPlusCircle, 
  FiMessageSquare, FiUser, FiSearch, 
  FiFileText, FiLogOut, FiX, FiShield 
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useSocket from '../hooks/useSocket';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const socket = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnread();
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (socket) {
      socket.on('messageReceived', () => {
        fetchUnread();
      });
    }
    return () => {
      if (socket) socket.off('messageReceived');
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

  const clientLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'My Projects', path: '/projects', icon: FiBriefcase },
    { name: 'Messages', path: '/messages', icon: FiMessageSquare, badge: unreadCount },
    { name: 'Billing & Receipts', path: '/wallet', icon: FiShield },
    { name: 'Profile & Payment', path: '/profile', icon: FiUser },
  ];

  const freelancerLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'Browse Projects', path: '/projects', icon: FiSearch },
    { name: 'My Proposals', path: '/my-proposals', icon: FiFileText },
    { name: 'Messages', path: '/messages', icon: FiMessageSquare, badge: unreadCount },
    { name: 'Earnings & Invoices', path: '/wallet', icon: FiShield },
    { name: 'Profile & GPay QR', path: '/profile', icon: FiUser },
  ];

  const links = user?.role === 'client' ? clientLinks : freelancerLinks;

  const NavLink = ({ link }) => {
    const isActive = location.pathname === link.path;
    const Icon = link.icon;
    const badgeCount = link.badge || 0;

    return (
      <Link
        to={link.path}
        className={`flex items-center justify-between px-4 py-3 mb-2 rounded-2xl transition-all ${
          isActive 
            ? 'bg-white text-indigo-700 font-extrabold shadow-md border border-indigo-100/80 scale-102' 
            : 'text-gray-600 hover:bg-white/60 hover:text-indigo-600 font-semibold'
        }`}
        onClick={() => setIsOpen && setIsOpen(false)}
      >
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100/70 text-gray-500'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs">{link.name}</span>
        </div>

        {badgeCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
            {badgeCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Glass Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 glass border-r border-white/60 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/50 bg-white/30">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <FiBriefcase className="text-lg" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Freelance<span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Hub</span></span>
          </Link>
          <button className="lg:hidden text-gray-400 hover:text-gray-700 p-1" onClick={() => setIsOpen(false)}>
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <nav>
            {links.map((link) => (
              <NavLink key={link.name} link={link} />
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/50 bg-white/40 backdrop-blur-md">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-3 truncate">
              <p className="text-xs font-extrabold text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] font-bold text-indigo-600 capitalize">{user?.role || 'Guest'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center w-full px-3 py-2.5 text-xs font-bold text-red-600 rounded-xl hover:bg-red-50/80 transition-colors border border-transparent hover:border-red-100 cursor-pointer"
          >
            <FiLogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}