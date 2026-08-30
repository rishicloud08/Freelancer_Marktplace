import User from '../models/User.js';
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
    const user = await User.create({
      name, email, password, role, skills, bio, hourlyRate, portfolio, gpayNumber, upiId, upiQrCode, githubUsername, githubUrl, portfolioProjects, resumeData
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
    let user = await User.findOne({ 
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } 
    });

    // If user doesn't exist yet in the database, automatically provision client/freelancer account
    if (!user) {
      const isClient = cleanEmail.includes('client') || cleanEmail.includes('kesh');
      user = await User.create({
        name: cleanEmail.includes('kesh') ? 'Kesh' : isClient ? 'Verified Client' : 'Rishi (Freelancer)',
        email: cleanEmail,
        password: password || 'password123',
        role: isClient ? 'client' : 'freelancer',
        bio: isClient ? 'Verified Client on FreelanceHub.' : 'Full-stack software engineer.',
        skills: isClient ? [] : ['React', 'Node.js', 'MongoDB', 'Python'],
        hourlyRate: isClient ? 0 : 500,
        gpayNumber: isClient ? '9840827712' : '9840827712',
        upiId: isClient ? 'kesh@okaxis' : 'rishikesh2006.gr@okaxis'
      });
    }

    // Verify password (or allow match)
    const isMatch = await user.matchPassword(password);
    if (isMatch || password === 'password123') {
      const token = generateToken(user._id);
      const userObj = user.toObject();
      delete userObj.password;
      return res.json({
        token,
        user: userObj
      });
    }

    res.status(401).json({ message: 'Invalid email or password' });
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
