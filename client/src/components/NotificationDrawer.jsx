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
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="fixed inset-y-0 right-0 max-w-sm w-full flex pl-10">
        <div className="w-full glass-dark shadow-2xl border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <FiBell />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Notifications</h3>
                <p className="text-[10px] text-slate-400">{unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}</p>
              </div>
            </div>

            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 text-[11px] font-bold px-3">
            {['all', 'payments', 'proposals'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-2.5 px-3 capitalize transition-colors cursor-pointer ${
                  filter === tab 
                    ? 'border-b-2 border-indigo-500 text-indigo-400' 
                    : 'text-slate-400 hover:text-slate-200'
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
                    ? 'bg-slate-800/80 shadow-sm border-indigo-500/40 hover:border-indigo-500' 
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                    item.type === 'payment' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.type === 'proposal' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {item.type === 'payment' ? <FiDollarSign /> :
                     item.type === 'proposal' ? <FiAward /> : <FiShield />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                      <span className="text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-center">
            <span className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer">
              Mark all notifications as read
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
