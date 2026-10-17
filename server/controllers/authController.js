import User from '../models/User.js';
import Project from '../models/Project.js';
import Proposal from '../models/Proposal.js';
import Milestone from '../models/Milestone.js';
import Payment from '../models/Payment.js';
import Message from '../models/Message.js';
import Review from '../models/Review.js';
import Contract from '../models/Contract.js';
import Dispute from '../models/Dispute.js';
import Task from '../models/Task.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, skills, bio, hourlyRate, portfolio, gpayNumber, upiId, upiQrCode, githubUsername, githubUrl, portfolioProjects, resumeData } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Ensure role is always valid enum ('client' or 'freelancer')
    let validRole = role;
    if (!validRole || (validRole !== 'client' && validRole !== 'freelancer')) {
      validRole = (skills && skills.length > 0) ? 'freelancer' : 'client';
    }

    const user = await User.create({
      name, email, password, role: validRole, skills, bio, hourlyRate, portfolio, gpayNumber, upiId, upiQrCode, githubUsername, githubUrl, portfolioProjects, resumeData
    });
    if (user) {
      const token = generateToken(user._id);
      const userObj = user.toObject();
      delete userObj.password;
      res.status(201).json({
        token,
        user: userObj
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } 
    });

    if (!user) {
      return res.status(404).json({ 
        message: `No account found with "${cleanEmail}". Please click "Create account" below to register.` 
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    return res.json({
      token,
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      if (req.body.name !== undefined) user.name = req.body.name;
      if (req.body.bio !== undefined) user.bio = req.body.bio;
      if (req.body.skills !== undefined) user.skills = req.body.skills;
      if (req.body.hourlyRate !== undefined) user.hourlyRate = req.body.hourlyRate;
      if (req.body.portfolio !== undefined) user.portfolio = req.body.portfolio;
      if (req.body.gpayNumber !== undefined) user.gpayNumber = req.body.gpayNumber;
      if (req.body.upiId !== undefined) user.upiId = req.body.upiId;
      if (req.body.upiQrCode !== undefined) user.upiQrCode = req.body.upiQrCode;
      if (req.body.rating !== undefined) user.rating = req.body.rating;
      if (req.body.githubUsername !== undefined) user.githubUsername = req.body.githubUsername;
      if (req.body.githubUrl !== undefined) user.githubUrl = req.body.githubUrl;
      if (req.body.portfolioProjects !== undefined) user.portfolioProjects = req.body.portfolioProjects;
      if (req.body.resumeData !== undefined) user.resumeData = req.body.resumeData;

      if (req.body.password) {
        user.password = req.body.password;
      }
      const updatedUser = await user.save();
      const userObj = updatedUser.toObject();
      delete userObj.password;

      res.json({
        ...userObj,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetDatabase = async (req, res) => {
  try {
    const { confirm } = req.query;
    if (confirm !== 'yes' && req.body?.confirm !== 'yes') {
      return res.status(400).json({ 
        message: 'Please provide query parameter confirm=yes to clear all database collections.' 
      });
    }

    const resUser = await User.deleteMany({});
    const resProj = await Project.deleteMany({});
    const resProp = await Proposal.deleteMany({});
    const resMile = await Milestone.deleteMany({});
    const resPay = await Payment.deleteMany({});
    const resMsg = await Message.deleteMany({});
    const resRev = await Review.deleteMany({});
    const resCont = await Contract.deleteMany({});
    const resDisp = await Dispute.deleteMany({});
    const resTask = await Task.deleteMany({});

    return res.json({
      success: true,
      message: 'All data of email, saved clients, freelancers, and projects removed successfully. Ready for fresh registrations!',
      deletedCounts: {
        users: resUser.deletedCount,
        projects: resProj.deletedCount,
        proposals: resProp.deletedCount,
        milestones: resMile.deletedCount,
        payments: resPay.deletedCount,
        messages: resMsg.deletedCount,
        reviews: resRev.deletedCount,
        contracts: resCont.deletedCount,
        disputes: resDisp.deletedCount,
        tasks: resTask.deletedCount
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

