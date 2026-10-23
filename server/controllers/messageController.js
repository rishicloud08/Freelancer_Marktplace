import Message from '../models/Message.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Proposal from '../models/Proposal.js';

export const getConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .sort({ createdAt: 1 });

    // Mark received messages as read
    await Message.updateMany(
      { sender: otherUserId, receiver: userId, read: false },
      { $set: { read: true } }
    );
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const receiverId = req.body.receiverId || req.body.receiver;
    const { projectId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      project: projectId || null,
      content,
      read: false
    });
    const createdMessage = await message.save();

    // Populate sender info for instant UI delivery
    const populated = await Message.findById(createdMessage._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    // If socket.io is available on req.app, emit real-time event to receiver and sender
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('messageReceived', populated);
      io.to(req.user._id.toString()).emit('messageSent', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const isFreelancer = req.user.role === 'freelancer';
    const userIds = new Set();
    
    // 1. ALL users who have ANY message history with this user (sent or received)
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    });
    messages.forEach(msg => {
      const s = msg.sender?.toString();
      const r = msg.receiver?.toString();
      const otherId = s === userId.toString() ? r : s;
      if (otherId && otherId !== userId.toString()) {
        userIds.add(otherId);
      }
    });

    // 2. Project Connections (proposals, assigned projects, client owners)
    if (isFreelancer) {
      const myProposals = await Proposal.find({ freelancer: userId }).populate('project');
      myProposals.forEach(pr => {
        if (pr.project?.client) {
          userIds.add(pr.project.client.toString());
        }
      });

      const assignedProjects = await Project.find({ assignedFreelancer: userId });
      assignedProjects.forEach(p => {
        if (p.client) userIds.add(p.client.toString());
      });

      // Always make registered clients discoverable
      const allClients = await User.find({ role: 'client', _id: { $ne: userId } });
      allClients.forEach(c => userIds.add(c._id.toString()));
    } else {
      const clientProjects = await Project.find({ client: userId });
      const projectIds = clientProjects.map(p => p._id);
      
      clientProjects.forEach(p => {
        if (p.assignedFreelancer) userIds.add(p.assignedFreelancer.toString());
      });

      const projectProposals = await Proposal.find({ project: { $in: projectIds } });
      projectProposals.forEach(pr => {
        if (pr.freelancer) userIds.add(pr.freelancer.toString());
      });

      // Always make registered freelancers discoverable
      const allFreelancers = await User.find({ role: 'freelancer', _id: { $ne: userId } });
      allFreelancers.forEach(f => userIds.add(f._id.toString()));
    }

    // Fallback: If still empty, include all other registered users
    if (userIds.size === 0) {
      const allUsers = await User.find({ _id: { $ne: userId } });
      allUsers.forEach(u => userIds.add(u._id.toString()));
    }

    if (userIds.size === 0) {
      return res.json([]);
    }

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name email role rating skills hourlyRate');
    
    // Enrich each user with last message and unread count
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const lastMsg = await Message.findOne({
          $or: [
            { sender: userId, receiver: u._id },
            { sender: u._id, receiver: userId }
          ]
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          sender: u._id,
          receiver: userId,
          read: false
        });

        return {
          ...u.toObject(),
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            createdAt: lastMsg.createdAt,
            sender: lastMsg.sender
          } : null,
          unreadCount
        };
      })
    );

    // Sort: users with unread messages first, then latest messages, then alphabetical
    enrichedUsers.sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return (a.name || '').localeCompare(b.name || '');
    });

    res.json(enrichedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const totalUnread = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });
    res.json({ totalUnread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const senderId = req.params.userId;
    await Message.updateMany(
      { sender: senderId, receiver: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
