import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import { 
  FiSend, 
  FiSearch, 
  FiMessageSquare, 
  FiShield, 
  FiLock, 
  FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Messages() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const targetUserIdParam = searchParams.get('userId');

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  
  const socket = useSocket();

  useEffect(() => {
    fetchConversations();
  }, [targetUserIdParam]);

  useEffect(() => {
    if (activeChat) {
      const activeUserId = activeChat._id || activeChat.user?._id;
      fetchMessages(activeUserId);
      
      // Clear unread in local state and DB
      api.messages.markAsRead(activeUserId).then(() => {
        setConversations(prev => prev.map(c => {
          const cId = c._id || c.user?._id;
          if (cId === activeUserId) {
            return { ...c, unreadCount: 0 };
          }
          return c;
        }));
      }).catch(() => {});
    }
  }, [activeChat]);

  useEffect(() => {
    if (socket) {
      socket.on('messageReceived', (message) => {
        const senderId = message.sender?._id || message.sender;
        const activeUserId = activeChat?._id || activeChat?.user?._id;

        if (activeUserId && (senderId === activeUserId || message.receiver === activeUserId)) {
          setMessages(prev => [...prev, message]);
          api.messages.markAsRead(activeUserId).catch(() => {});
        }
        fetchConversations(false);
      });
    }
    return () => {
      if (socket) socket.off('messageReceived');
    };
  }, [socket, activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (setInitialActive = true) => {
    try {
      const res = await api.messages.getConversations();
      const list = Array.isArray(res.data) ? res.data : [];
      setConversations(list);

      if (setInitialActive) {
        if (targetUserIdParam) {
          const target = list.find(c => (c._id === targetUserIdParam || c.user?._id === targetUserIdParam));
          if (target) {
            setActiveChat(target);
            return;
          } else {
            try {
              const uRes = await api.auth.getUsers();
              const found = (uRes.data || []).find(u => u._id === targetUserIdParam);
              if (found) {
                setActiveChat(found);
                setConversations(prev => [found, ...prev.filter(c => (c._id || c.user?._id) !== targetUserIdParam)]);
                return;
              }
            } catch (err) {
              console.log('Target user lookup note:', err.message);
            }
          }
        }
        
        if (!activeChat && list.length > 0) {
          setActiveChat(list[0]);
        }
      }
    } catch (error) {
      console.log('Conversation load note:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    if (!userId) return;
    setLoadingMessages(true);
    try {
      const res = await api.messages.getConversation(userId);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log('Messages load note:', error.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const targetUserId = activeChat?._id || activeChat?.user?._id;
    if (!inputMessage.trim() || !targetUserId) return;

    const tempMessage = {
      _id: Date.now().toString(),
      sender: { _id: user._id, name: user.name },
      receiver: targetUserId,
      content: inputMessage,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    const messageContent = inputMessage;
    setInputMessage('');

    try {
      await api.messages.sendMessage({
        receiverId: targetUserId,
        receiver: targetUserId,
        content: messageContent
      });
      fetchConversations(false);
    } catch (error) {
      toast.error('Failed to deliver message');
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv => {
    const name = conv.name || conv.user?.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeUserName = activeChat?.name || activeChat?.user?.name || 'Collaborator';
  const activeUserRole = activeChat?.role || activeChat?.user?.role || 'Client';

  return (
    <DashboardLayout>
      <div className="glass-card rounded-3xl shadow-2xl border border-slate-800 h-[calc(100vh-8.5rem)] flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Conversations Contacts Glass Panel */}
        <div className={`w-full md:w-88 border-r border-slate-800 flex flex-col bg-slate-900/60 backdrop-blur-md ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FiMessageSquare className="text-indigo-400" /> Messages
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                <FiShield /> End-to-End Encrypted
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search clients & freelancers..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input border border-slate-700 bg-slate-800/80 text-white placeholder-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-sm" />
            </div>
          </div>
          
          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="flex justify-center p-8"><LoadingSpinner /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-xs">
                <FiLock className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="font-bold text-slate-300 mb-1">No Active Collaborations Yet</p>
                <p className="text-slate-400 leading-relaxed">
                  {user?.role === 'freelancer'
                    ? 'You will be able to chat with clients here once they accept your project proposal.'
                    : 'Accept a freelancer’s proposal on one of your projects to start chatting and collaborating.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv, idx) => {
                const cId = conv._id || conv.user?._id;
                const cName = conv.name || conv.user?.name || 'User';
                const cRole = conv.role || conv.user?.role || 'Client';
                const unread = conv.unreadCount || 0;
                const lastMsg = conv.lastMessage;
                const isActive = (activeChat?._id === cId) || (activeChat?.user?._id === cId);

                return (
                  <div
                    key={cId || idx}
                    onClick={() => setActiveChat(conv)}
                    className={`p-4 cursor-pointer transition-all flex items-center gap-3 relative ${
                      isActive 
                        ? 'bg-slate-800/90 shadow-sm border-l-4 border-indigo-500' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm relative">
                      {cName.charAt(0).toUpperCase()}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className={`text-xs font-bold truncate ${isActive ? 'text-indigo-300' : 'text-white'}`}>{cName}</h4>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold uppercase ${
                            cRole === 'client' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {cRole}
                          </span>
                        </div>

                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[11px] truncate max-w-[150px] ${unread > 0 ? 'font-bold text-slate-100' : 'text-slate-400'}`}>
                          {lastMsg ? lastMsg.content : <span className="text-indigo-400 font-medium">Say Hello 👋</span>}
                        </p>
                        
                        {unread > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs animate-bounce">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Glass Area */}
        <div className={`flex-1 flex flex-col bg-slate-950/70 backdrop-blur-md ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Top Header */}
              <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button 
                    className="md:hidden text-indigo-400 text-xs font-bold px-2 py-1 bg-indigo-500/20 rounded-lg hover:bg-indigo-500/30 cursor-pointer"
                    onClick={() => setActiveChat(null)}
                  >
                    ← All Chats
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {activeUserName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{activeUserName}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        activeUserRole === 'client' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {activeUserRole}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                      <FiShield className="w-3 h-3" /> End-to-End Encrypted Communication Channel
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs text-emerald-300 font-semibold shadow-xs">
                  <FiLock className="w-3 h-3 text-emerald-400" /> Verified Project Chat
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs border border-emerald-500/20">
                      <FiShield />
                    </div>
                    <h4 className="text-sm font-bold text-white">Encrypted Conversation with {activeUserName}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Send a message below to coordinate proposal terms, milestones, and deliverable updates in real time.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const isSent = senderId === user._id;

                    return (
                      <div key={msg._id || idx} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] md:max-w-[70%] rounded-3xl px-5 py-3 text-xs md:text-sm leading-relaxed ${
                          isSent 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-lg shadow-indigo-500/20' 
                            : 'glass-dark border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${isSent ? 'text-indigo-200' : 'text-slate-400'}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isSent && <FiCheck className="w-3 h-3 text-emerald-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Type an encrypted message to ${activeUserName}...`}
                    className="flex-1 px-4 py-3 text-xs md:text-sm glass-input rounded-2xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 font-bold text-xs shadow-lg shadow-indigo-500/25 cursor-pointer"
                  >
                    <FiSend className="w-4 h-4" /> Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 glass-dark rounded-3xl shadow-sm flex items-center justify-center mb-3 border border-slate-800">
                <FiMessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-white">Select a Conversation</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Choose a client or freelancer from the left panel to read and send messages.
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}