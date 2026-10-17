import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Project from '../models/Project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, '../data/persistent_state.json');

const defaultFreelancer = {
  name: 'Rishi kesh.V',
  email: 'rishikesh2006.gr@gmail.com',
  password: 'password123',
  role: 'freelancer',
  skills: ['React', 'Node.js', 'JavaScript', 'Python', 'Cloud Architecture', 'MongoDB', 'Git', 'Tailwind CSS', 'REST APIs', 'Express.js'],
  hourlyRate: 750,
  bio: 'Full-Stack Software Engineer with expertise in React, Node.js, Python, Cloud Architecture, and modern web application development.',
  githubUsername: 'rishicloud08',
  githubUrl: 'https://github.com/rishicloud08',
  balance: 15000,
  portfolioProjects: [
    { 
      title: 'Freelancer AI Marketplace', 
      description: 'Real-time AI matching, escrow milestones, and dynamic proposal enhancements.', 
      techStack: ['React', 'Node.js', 'MongoDB', 'Socket.IO', 'Gemini AI'] 
    },
    { 
      title: 'Cloud Infrastructure & Microservices', 
      description: 'Scalable cloud deployment architecture with automated pipelines.', 
      techStack: ['Docker', 'Cloud Architecture', 'Node.js'] 
    }
  ],
  resumeData: {
    summary: 'Full-Stack Software Engineer with expertise in React, Node.js, Python, Cloud Architecture, and modern web application development.',
    skills: ['React', 'Node.js', 'JavaScript', 'Python', 'Cloud Architecture', 'MongoDB', 'Git', 'Tailwind CSS', 'REST APIs', 'Express.js'],
    hourlyRate: 750,
    education: [
      { institution: 'Department of Computer Science & Engineering', degree: 'Bachelor of Technology in Computer Science', year: '2020 - 2024' }
    ],
    experience: [
      { role: 'Full-Stack Software Engineer', company: 'Software Engineering & Cloud Projects', duration: '2023 - Present', description: 'Engineered web applications and cloud solutions.' }
    ],
    certifications: ['Full Stack Web Developer Certification', 'Cloud & Software Engineering'],
    fileName: 'Rishikesh_Resume.pdf'
  }
};

const defaultClient = {
  name: 'John Client',
  email: 'john@example.com',
  password: 'password123',
  role: 'client',
  balance: 50000,
  bio: 'Founder and Technical Product Lead hiring top software engineering talent.'
};

const defaultProjects = [
  {
    title: 'Full-Stack React & Node.js Web Application',
    description: 'Looking for an expert full-stack developer to build a modern responsive web application with real-time updates and cloud deployment.',
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
    budgetMin: 30000,
    budgetMax: 60000,
    duration: '3-4 weeks',
    status: 'open'
  },
  {
    title: 'Cloud Architecture & API Integration',
    description: 'Need a skilled engineer to build secure RESTful APIs, integrate external cloud services, and optimize database queries.',
    skills: ['Node.js', 'Python', 'Cloud Architecture', 'REST APIs'],
    budgetMin: 25000,
    budgetMax: 50000,
    duration: '2-3 weeks',
    status: 'open'
  }
];

// Read state from JSON file
export const getPersistentState = () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading persistent state file:', err.message);
  }
  return {
    users: [defaultFreelancer, defaultClient],
    projects: defaultProjects
  };
};

// Write state to JSON file
export const savePersistentState = (state) => {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing persistent state file:', err.message);
  }
};

// Save a specific user's updated data to persistent state file
export const saveUserToPersistentState = (userDoc) => {
  try {
    if (!userDoc || !userDoc.email) return;
    const state = getPersistentState();
    const cleanEmail = userDoc.email.trim().toLowerCase();
    const existingIdx = state.users.findIndex(u => u.email.trim().toLowerCase() === cleanEmail);

    const userObj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete userObj._id;
    delete userObj.__v;

    if (existingIdx >= 0) {
      state.users[existingIdx] = { ...state.users[existingIdx], ...userObj };
    } else {
      state.users.push(userObj);
    }

    savePersistentState(state);
  } catch (err) {
    console.error('Error in saveUserToPersistentState:', err.message);
  }
};

// Ensure users and projects exist in MongoDB
export const ensurePersistentDataInDB = async () => {
  try {
    const state = getPersistentState();
    const usersToEnsure = state.users && state.users.length > 0 ? state.users : [defaultFreelancer, defaultClient];

    let clientUserDoc = null;

    for (const userData of usersToEnsure) {
      const cleanEmail = userData.email.trim().toLowerCase();
      let user = await User.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

      if (!user) {
        console.log(`📦 Restoring persistent account: ${userData.name} (${cleanEmail})`);
        user = await User.create({
          ...userData,
          email: cleanEmail
        });
      }

      if (user.role === 'client') {
        clientUserDoc = user;
      }
    }

    // Ensure sample projects exist for Client
    if (clientUserDoc) {
      const projectCount = await Project.countDocuments();
      if (projectCount === 0) {
        console.log('📦 Restoring persistent projects for Client...');
        for (const proj of defaultProjects) {
          await Project.create({
            ...proj,
            client: clientUserDoc._id
          });
        }
      }
    }

    console.log('✅ Persistent user accounts and projects verified in database.');
  } catch (err) {
    console.error('Error ensuring persistent data in DB:', err.message);
  }
};
