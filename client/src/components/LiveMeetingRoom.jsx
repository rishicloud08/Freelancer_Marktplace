import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMic, 
  FiMicOff, 
  FiVideo, 
  FiVideoOff, 
  FiPhoneOff, 
  FiTv, 
  FiShield, 
  FiSend, 
  FiExternalLink, 
  FiUsers, 
  FiMaximize2, 
  FiMinimize2,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export default function LiveMeetingRoom({ 
  roomId, 
  currentUser, 
  collaboratorName = 'Collaborator', 
  collaboratorRole = 'Partner',
  socket, 
  onClose,
  onSendInviteToChat
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [permissionError, setPermissionError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMode, setActiveMode] = useState('webrtc'); // 'webrtc' | 'jitsi_open'

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidates = useRef([]);
  const screenTrackRef = useRef(null);
  const remoteSocketIdRef = useRef(null);

  // Fallback public Jitsi server with ZERO login requirement
  const openJitsiUrl = `https://meet.ffrn.de/${roomId}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(currentUser?.name || 'User')}"`;

  // Timer for active call
  useEffect(() => {
    let interval = null;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  // Format call timer (MM:SS)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Initialize Local Media Stream
  useEffect(() => {
    let stream = null;
    let isCancelled = false;

    const startLocalMedia = async () => {
      try {
        setPermissionError(null);
        // Attempt full video and audio
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: { echoCancellation: true, noiseSuppression: true }
          });
        } catch (videoErr) {
          console.warn('Video stream failed, trying audio-only:', videoErr);
          // Fallback to audio-only if camera is unavailable or denied
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true }
          });
          setIsVideoOff(true);
        }

        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to access media devices:', err);
        setPermissionError('Unable to access camera or microphone. Please check your browser permissions.');
      }
    };

    startLocalMedia();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Update local video element when stream is ready
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 2. WebRTC Signaling via Socket.IO
  useEffect(() => {
    if (!socket || !localStream || activeMode !== 'webrtc') return;

    // Helper to create RTCPeerConnection
    const createPeer = (targetSocketId) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerRef.current = pc;
      remoteSocketIdRef.current = targetSocketId;

      // Add local tracks
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('meeting:signal', {
            to: targetSocketId,
            signal: { candidate: event.candidate }
          });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.streams[0]);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setIsConnected(true);
        setIsConnecting(false);
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Peer connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setIsConnected(false);
        }
      };

      return pc;
    };

    // Join the meeting room
    socket.emit('meeting:join', {
      roomId,
      userInfo: {
        id: currentUser?._id,
        name: currentUser?.name || 'User',
        role: currentUser?.role || 'participant'
      }
    });

    // Handle existing users in the room (I am the caller)
    const handleRoomUsers = async (users) => {
      if (users && users.length > 0) {
        const peer = users[0]; // 1-to-1 project meeting
        setRemoteUser(peer.userInfo);
        setIsConnecting(true);

        const pc = createPeer(peer.socketId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('meeting:signal', {
            to: peer.socketId,
            signal: { offer }
          });
        } catch (err) {
          console.error('Failed to create offer:', err);
          setIsConnecting(false);
        }
      }
    };

    // Handle new user joining (I am the callee or another participant joined)
    const handleUserJoined = ({ socketId, userInfo }) => {
      setRemoteUser(userInfo);
      toast.success(`${userInfo?.name || 'Collaborator'} joined the room!`);
    };

    // Handle incoming signals (offer, answer, candidate)
    const handleSignal = async ({ from, signal }) => {
      try {
        let pc = peerRef.current;
        if (!pc) {
          pc = createPeer(from);
        }

        if (signal.offer) {
          setIsConnecting(true);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          
          // Process queued candidates
          while (pendingCandidates.current.length > 0) {
            const cand = pendingCandidates.current.shift();
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('meeting:signal', {
            to: from,
            signal: { answer }
          });
        } else if (signal.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          // Process queued candidates
          while (pendingCandidates.current.length > 0) {
            const cand = pendingCandidates.current.shift();
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
        } else if (signal.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            pendingCandidates.current.push(signal.candidate);
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    };

    // Handle user leaving
    const handleUserLeft = ({ userInfo }) => {
      toast(`${userInfo?.name || 'Collaborator'} left the meeting.`, { icon: '👋' });
      setIsConnected(false);
      setIsConnecting(false);
      setRemoteUser(null);
      setRemoteStream(null);
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };

    socket.on('meeting:all-users', handleRoomUsers);
    socket.on('meeting:user-joined', handleUserJoined);
    socket.on('meeting:signal', handleSignal);
    socket.on('meeting:user-left', handleUserLeft);

    return () => {
      socket.off('meeting:all-users', handleRoomUsers);
      socket.off('meeting:user-joined', handleUserJoined);
      socket.off('meeting:signal', handleSignal);
      socket.off('meeting:user-left', handleUserLeft);

      socket.emit('meeting:leave', { roomId });

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, [socket, localStream, roomId, currentUser, activeMode]);

  // Toggle Microphone
  const toggleMute = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const willBeMuted = !isMuted;
      audioTracks.forEach(track => {
        track.enabled = !willBeMuted;
      });
      setIsMuted(willBeMuted);
      toast(willBeMuted ? 'Microphone Muted' : 'Microphone Unmuted', {
        icon: willBeMuted ? '🔇' : '🎙️'
      });
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      const willBeOff = !isVideoOff;
      videoTracks.forEach(track => {
        track.enabled = !willBeOff;
      });
      setIsVideoOff(willBeOff);
      toast(willBeOff ? 'Camera Turned Off' : 'Camera Turned On', {
        icon: willBeOff ? '📷' : '📹'
      });
    }
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (!peerRef.current || !isConnected) {
      toast.error('Connect with collaborator first to share screen.');
      return;
    }

    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const senders = peerRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');

        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
        toast.success('Screen sharing started!');
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (peerRef.current && localStream) {
      const cameraTrack = localStream.getVideoTracks()[0];
      const senders = peerRef.current.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(cameraTrack);
      }
    }
    setIsScreenSharing(false);
    toast('Screen sharing stopped.');
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Leave / Close Call
  const handleLeaveCall = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    if (peerRef.current) {
      peerRef.current.close();
    }
    if (socket) {
      socket.emit('meeting:leave', { roomId });
    }
    onClose();
  };

  return (
    <div 
      ref={containerRef}
      className="p-4 bg-slate-950 border-b border-white/10 rounded-3xl overflow-hidden shadow-2xl relative transition-all"
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-white/10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {isConnected ? '🟢 Live P2P Sync Active' : isConnecting ? '🔵 Connecting...' : '🟡 Room Open — Waiting for Collaborator'}
            </span>
          </div>
          {isConnected && (
            <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono text-emerald-300">
              ⏱️ {formatDuration(callDuration)}
            </span>
          )}
          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
            Room: {roomId}
          </span>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2">
          {/* Switch Mode Button */}
          <button
            type="button"
            onClick={() => setActiveMode(prev => prev === 'webrtc' ? 'jitsi_open' : 'webrtc')}
            className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Switch between Direct P2P and Open Community Server"
          >
            <FiRefreshCw className="text-indigo-400" />
            <span className="hidden md:inline">{activeMode === 'webrtc' ? 'Use Open Jitsi Server' : 'Use Native P2P'}</span>
          </button>

          {/* External Window Link */}
          <a
            href={openJitsiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
            title="Open in a dedicated external browser window"
          >
            <FiExternalLink />
            <span className="hidden sm:inline">Pop Out Window</span>
          </a>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>

          {/* Close Call Button */}
          <button
            type="button"
            onClick={handleLeaveCall}
            className="text-xs bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
          >
            Leave Call
          </button>
        </div>
      </div>

      {/* Main Video Presentation Area */}
      {activeMode === 'jitsi_open' ? (
        // Open Jitsi Instance without Login Block
        <div className="h-[480px] rounded-2xl overflow-hidden bg-slate-900 border border-white/20 relative">
          <iframe
            src={openJitsiUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            title="Open Live Meeting Room"
          />
        </div>
      ) : (
        // Native In-App WebRTC Video & Audio Stage
        <div className="relative h-[480px] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-white/15 flex items-center justify-center">
          
          {/* Permission Error Banner */}
          {permissionError && (
            <div className="absolute inset-x-4 top-4 z-30 bg-amber-500/90 text-slate-950 p-3 rounded-2xl text-xs font-semibold shadow-lg flex items-center justify-between">
              <span>⚠️ {permissionError}</span>
              <button
                onClick={() => setActiveMode('jitsi_open')}
                className="bg-slate-950 text-white px-3 py-1 rounded-xl text-xs font-bold cursor-pointer"
              >
                Switch to Open Jitsi
              </button>
            </div>
          )}

          {/* Remote Video Stream or Waiting Screen */}
          {isConnected && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            // Waiting Card when partner hasn't joined
            <div className="text-center p-6 max-w-md space-y-4 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-indigo-500/20 border-2 border-indigo-400/40 rounded-full flex items-center justify-center mx-auto text-3xl text-indigo-400 shadow-inner animate-pulse">
                <FiUsers />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  Waiting for {collaboratorName || 'Collaborator'}
                </h4>
                <p className="text-xs text-indigo-200 mt-1">
                  You are live in the room. As soon as {collaboratorName} clicks "1-Click Sync Call", you will instantly connect via live audio and video!
                </p>
              </div>

              {/* 1-Click Send Invite Button */}
              {onSendInviteToChat && (
                <button
                  type="button"
                  onClick={onSendInviteToChat}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 mx-auto transition-transform hover:scale-105 cursor-pointer"
                >
                  <FiSend /> Send Meeting Invite in Chat
                </button>
              )}

              <div className="pt-2">
                <span className="text-[11px] text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full inline-block">
                  🔒 Peer-to-Peer Encrypted Voice & Video
                </span>
              </div>
            </div>
          )}

          {/* Remote User Name Overlay */}
          {isConnected && (
            <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{remoteUser?.name || collaboratorName}</span>
              <span className="text-[10px] text-indigo-300 uppercase font-mono">({remoteUser?.role || collaboratorRole})</span>
            </div>
          )}

          {/* Local User Preview (Picture-in-Picture) */}
          <div className="absolute bottom-20 right-4 z-20 w-36 h-28 sm:w-44 sm:h-32 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-400/50 shadow-2xl transition-all group">
            {isVideoOff ? (
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-gray-400 text-xs">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-1">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <span>Camera Off</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            )}
            <div className="absolute bottom-1.5 left-1.5 bg-black/70 px-2 py-0.5 rounded-md text-[10px] text-white font-semibold">
              You {isMuted ? '🔇' : '🎙️'}
            </div>
          </div>

          {/* In-Call Controls Dock */}
          <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-3 px-4">
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3">
              
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isVideoOff 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
              >
                {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
              </button>

              {/* Screen Share */}
              <button
                type="button"
                onClick={toggleScreenShare}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isScreenSharing 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <FiTv size={18} />
              </button>

              <div className="w-px h-6 bg-white/20 mx-1" />

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleLeaveCall}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                title="Leave Meeting"
              >
                <FiPhoneOff size={16} />
                <span className="hidden sm:inline">End Meeting</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
