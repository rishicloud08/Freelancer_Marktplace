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

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
}
