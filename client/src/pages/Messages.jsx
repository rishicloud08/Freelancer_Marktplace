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

      if (setInitialActive && list.length > 0) {
        if (targetUserIdParam) {
          const target = list.find(c => (c._id === targetUserIdParam || c.user?._id === targetUserIdParam));
          if (target) {
            setActiveChat(target);
            return;
          }
        }
        
        if (!activeChat) {
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
      <div className="glass-card rounded-3xl shadow-xl border border-white/70 h-[calc(100vh-8.5rem)] flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Conversations Contacts Glass Panel */}
        <div className={`w-full md:w-88 border-r border-white/60 flex flex-col bg-white/40 backdrop-blur-md ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header */}
          <div className="p-4 border-b border-white/50 bg-white/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <FiMessageSquare className="text-indigo-600" /> Messages
              </h2>
              <span className="text-[10px] bg-emerald-100/90 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300/50 shadow-2xs">
                <FiShield /> End-to-End Encrypted
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search clients & freelancers..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400 text-sm" />
            </div>
          </div>
          
          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/40">
            {loading ? (
              <div className="flex justify-center p-8"><LoadingSpinner /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center p-8 text-gray-400 text-xs">
                <FiLock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-gray-700 mb-1">No Conversations Yet</p>
                <p>Submit a proposal to a project or post a project to start chatting with clients and freelancers.</p>
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
                        ? 'bg-white/90 shadow-xs border-l-4 border-indigo-600' 
                        : 'hover:bg-white/50'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm relative">
                      {cName.charAt(0).toUpperCase()}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className={`text-xs font-bold truncate ${isActive ? 'text-indigo-950' : 'text-gray-900'}`}>{cName}</h4>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-semibold uppercase ${
                            cRole === 'client' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {cRole}
                          </span>
                        </div>

                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[11px] truncate max-w-[150px] ${unread > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                          {lastMsg ? lastMsg.content : <span className="text-indigo-600 font-medium">Say Hello 👋</span>}
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
        <div className={`flex-1 flex flex-col bg-white/50 backdrop-blur-sm ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Top Header */}
              <div className="p-4 md:p-5 border-b border-white/60 flex items-center justify-between bg-white/70 shadow-2xs backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button 
                    className="md:hidden text-indigo-600 text-xs font-bold px-2 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 cursor-pointer"
                    onClick={() => setActiveChat(null)}
                  >
                    ← All Chats
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {activeUserName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm">{activeUserName}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        activeUserRole === 'client' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {activeUserRole}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold mt-0.5">
                      <FiShield className="w-3 h-3" /> End-to-End Encrypted Communication Channel
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 px-3 py-1 rounded-full text-xs text-emerald-800 font-semibold shadow-2xs">
                  <FiLock className="w-3 h-3 text-emerald-600" /> Verified Project Chat
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs border border-emerald-100">
                      <FiShield />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">Encrypted Conversation with {activeUserName}</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
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
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md shadow-indigo-500/10' 
                            : 'glass border border-white/80 text-gray-800 rounded-bl-none shadow-xs'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${isSent ? 'text-indigo-200' : 'text-gray-400'}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isSent && <FiCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-white/60 bg-white/70 backdrop-blur-md">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Type an encrypted message to ${activeUserName}...`}
                    className="flex-1 px-4 py-3 text-xs md:text-sm glass-input rounded-2xl"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    <FiSend className="w-4 h-4" /> Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 glass rounded-3xl shadow-sm flex items-center justify-center mb-3 border border-white/80">
                <FiMessageSquare className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Select a Conversation</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Choose a client or freelancer from the left panel to read and send messages.
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}