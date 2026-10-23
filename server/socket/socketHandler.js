import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';

export default function socketHandler(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected via socket: ${socket.userId}`);
    socket.join(socket.userId);

    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, content, projectId } = data;
        
        // Save to DB
        const message = new Message({
          sender: socket.userId,
          receiver: receiverId,
          content,
          project: projectId || null
        });
        await message.save();

        // Emit to receiver
        io.to(receiverId).emit('messageReceived', message);
        // Also emit back to sender to confirm
        socket.emit('messageSent', message);
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    socket.on('typing', (data) => {
      const { receiverId } = data;
      io.to(receiverId).emit('userTyping', { senderId: socket.userId });
    });

    // ==========================================
    // Live Virtual Meeting Room (WebRTC Signaling)
    // ==========================================
    socket.on('meeting:join', ({ roomId, userInfo }) => {
      const fullRoom = `meeting:${roomId}`;
      socket.join(fullRoom);
      socket.currentMeetingRoom = fullRoom;
      socket.meetingUserInfo = userInfo || { id: socket.userId, name: 'Participant' };

      // Get existing sockets in this meeting room
      const roomSockets = io.sockets.adapter.rooms.get(fullRoom);
      const existingUsers = [];
      if (roomSockets) {
        for (const sid of roomSockets) {
          if (sid !== socket.id) {
            const clientSocket = io.sockets.sockets.get(sid);
            if (clientSocket) {
              existingUsers.push({
                socketId: sid,
                userInfo: clientSocket.meetingUserInfo || { id: clientSocket.userId, name: 'Participant' }
              });
            }
          }
        }
      }

      // Send the list of existing users in the room to the joiner
      socket.emit('meeting:all-users', existingUsers);

      // Notify others in the room that a new user joined
      socket.to(fullRoom).emit('meeting:user-joined', {
        socketId: socket.id,
        userInfo: socket.meetingUserInfo
      });
    });

    socket.on('meeting:signal', ({ to, signal }) => {
      io.to(to).emit('meeting:signal', {
        from: socket.id,
        signal
      });
    });

    socket.on('meeting:leave', ({ roomId }) => {
      const fullRoom = `meeting:${roomId}`;
      socket.leave(fullRoom);
      socket.to(fullRoom).emit('meeting:user-left', {
        socketId: socket.id,
        userInfo: socket.meetingUserInfo
      });
      socket.currentMeetingRoom = null;
    });

    socket.on('disconnect', () => {
      if (socket.currentMeetingRoom) {
        socket.to(socket.currentMeetingRoom).emit('meeting:user-left', {
          socketId: socket.id,
          userInfo: socket.meetingUserInfo
        });
      }
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
}
