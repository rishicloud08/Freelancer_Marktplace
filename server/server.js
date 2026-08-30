import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import proposalRoutes from './routes/proposals.js';
import messageRoutes from './routes/messages.js';
import milestoneRoutes from './routes/milestones.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import aiRoutes from './routes/ai.js';
import walletRoutes from './routes/wallet.js';
import contractRoutes from './routes/contracts.js';
import disputeRoutes from './routes/disputes.js';
import taskRoutes from './routes/tasks.js';
import socketHandler from './socket/socketHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Attach socket.io to app and pass to handler
app.set('io', io);
socketHandler(io);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/tasks', taskRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
