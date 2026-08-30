import React, { useState } from 'react';
import { 
  FiBell, 
  FiX, 
  FiCheck, 
  FiDollarSign, 
  FiBriefcase, 
  FiMessageSquare, 
  FiAward,
  FiShield
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function NotificationDrawer({ isOpen, onClose, unreadCount = 0 }) {
  if (!isOpen) return null;

  const [filter, setFilter] = useState('all');

  const notifications = [
    {
      id: 1,
      type: 'payment',
      title: 'Milestone Payment Confirmed',
      description: '₹12,000 INR direct Google Pay transfer sent for Phase 1.',
      time: '10m ago',
      unread: true,
      link: '/wallet'
    },
    {
      id: 2,
      type: 'proposal',
      title: 'New AI-Matched Proposal',
      description: 'Senior Full-Stack Freelancer submitted a proposal (96% AI Match).',
      time: '1h ago',
      unread: true,
      link: '/projects'
    },
    {
      id: 3,
      type: 'contract',
      title: 'SLA Smart Contract Generated',
      description: 'Cryptographic IP Service Agreement ready for digital signature.',
      time: '3h ago',
      unread: false,
      link: '/projects'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      <div className="fixed inset-y-0 right-0 max-w-sm w-full flex pl-10">
        <div className="w-full glass shadow-2xl border-l border-white/60 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-5 border-b border-white/60 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FiBell />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
                <p className="text-[10px] text-gray-500">{unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}</p>
              </div>
            </div>

            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-white/40 bg-white/30 text-[11px] font-bold px-3">
            {['all', 'payments', 'proposals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-2.5 px-3 capitalize transition-colors cursor-pointer ${
                  filter === tab 
                    ? 'border-b-2 border-indigo-600 text-indigo-600' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                onClick={onClose}
                className={`block p-3.5 rounded-2xl border transition-all ${
                  item.unread 
                    ? 'bg-white shadow-xs border-indigo-100 hover:border-indigo-300' 
                    : 'bg-white/40 border-white/60 hover:bg-white/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                    item.type === 'payment' ? 'bg-emerald-50 text-emerald-600' :
                    item.type === 'proposal' ? 'bg-purple-50 text-purple-600' :
                    'bg-indigo-50 text-indigo-600'
                  }`}>
                    {item.type === 'payment' ? <FiDollarSign /> :
                     item.type === 'proposal' ? <FiAward /> : <FiShield />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-gray-900 truncate">{item.title}</h4>
                      <span className="text-[10px] text-gray-400">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/60 bg-white/40 text-center">
            <span className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer">
              Mark all notifications as read
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
