import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Proposal from '../models/Proposal.js';
import Milestone from '../models/Milestone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.join(__dirname, '../data/persistent_state.json');

export const defaultFreelancer = {
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
  rating: 5,
  totalReviews: 6,
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
    name: 'Rishi kesh.V',
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

export const defaultClientKesh = {
  name: 'Kesh',
  email: 'kesh@gmail.com',
  password: 'password123',
  role: 'client',
  balance: 50000,
  rating: 5,
  totalReviews: 5,
  bio: 'Founder and Technical Product Lead at Tech Innovations Ltd. Hiring top full-stack and cloud software engineering talent.'
};

export const defaultClient = {
  name: 'John Client',
  email: 'john@example.com',
  password: 'password123',
  role: 'client',
  balance: 50000,
  rating: 5,
  totalReviews: 4,
  bio: 'Founder and Technical Product Lead at Tech Innovations Ltd. Hiring top full-stack and cloud software engineering talent.'
};

export const defaultClientGmail = {
  name: 'John Client',
  email: 'john@gmail.com',
  password: 'password123',
  role: 'client',
  balance: 50000,
  rating: 5,
  totalReviews: 4,
  bio: 'Founder and Technical Product Lead at Tech Innovations Ltd. Hiring top full-stack and cloud software engineering talent.'
};

export const defaultProjects = [
  {
    title: 'Full-Stack React & Node.js Web Application',
    description: 'Looking for an expert full-stack developer to build a modern responsive web application with real-time updates and cloud deployment.',
    clientEmail: 'kesh@gmail.com',
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
    budgetMin: 30000,
    budgetMax: 60000,
    duration: '3-4 weeks',
    status: 'open'
  },
  {
    title: 'Cloud Architecture & API Integration',
    description: 'Need a skilled engineer to build secure RESTful APIs, integrate external cloud services, and optimize database queries.',
    clientEmail: 'kesh@gmail.com',
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
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading persistent state file:', err.message);
  }
  return {
    users: [defaultFreelancer, defaultClient],
    projects: defaultProjects,
    proposals: []
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

// Save a project to persistent state
export const saveProjectToPersistentState = async (projectDoc) => {
  try {
    if (!projectDoc) return;
    const state = getPersistentState();
    if (!Array.isArray(state.projects)) state.projects = [];

    let clientEmail = 'john@example.com';
    if (projectDoc.client) {
      if (typeof projectDoc.client === 'object' && projectDoc.client.email) {
        clientEmail = projectDoc.client.email;
      } else {
        const clientUser = await User.findById(projectDoc.client);
        if (clientUser) clientEmail = clientUser.email;
      }
    }

    const projObj = {
      title: projectDoc.title,
      description: projectDoc.description,
      clientEmail,
      skills: projectDoc.skills,
      budgetMin: projectDoc.budgetMin,
      budgetMax: projectDoc.budgetMax,
      duration: projectDoc.duration,
      status: projectDoc.status || 'open'
    };

    const existingIdx = state.projects.findIndex(p => 
      (p.title === projObj.title && (!p.clientEmail || p.clientEmail === clientEmail)) ||
      (p.title === projObj.title)
    );
    if (existingIdx >= 0) {
      state.projects[existingIdx] = { ...state.projects[existingIdx], ...projObj };
    } else {
      state.projects.push(projObj);
    }

    savePersistentState(state);
  } catch (err) {
    console.error('Error in saveProjectToPersistentState:', err.message);
  }
};

// Synchronize entire DB state to persistent file
export const syncDatabaseToPersistentState = async () => {
  try {
    const users = await User.find({}).lean();
    const projects = await Project.find({}).populate('client', 'email').populate('assignedFreelancer', 'email').lean();
    const proposals = await Proposal.find({}).populate('freelancer', 'email').populate('project', 'title').lean();

    const cleanUsers = users.map(u => {
      const copy = { ...u };
      delete copy._id;
      delete copy.__v;
      return copy;
    });

    const cleanProjects = projects.map(p => ({
      title: p.title,
      description: p.description,
      clientEmail: p.client?.email || 'john@example.com',
      assignedFreelancerEmail: p.assignedFreelancer?.email || null,
      skills: p.skills,
      budgetMin: p.budgetMin,
      budgetMax: p.budgetMax,
      duration: p.duration,
      status: p.status
    }));

    const cleanProposals = proposals.map(pr => ({
      projectTitle: pr.project?.title,
      freelancerEmail: pr.freelancer?.email,
      coverLetter: pr.coverLetter,
      bidAmount: pr.bidAmount,
      estimatedDuration: pr.estimatedDuration,
      status: pr.status,
      aiMatchScore: pr.aiMatchScore
    }));

    savePersistentState({
      users: cleanUsers,
      projects: cleanProjects,
      proposals: cleanProposals
    });
  } catch (err) {
    console.error('Error syncing DB to persistent state:', err.message);
  }
};

// Ensure users and projects exist in MongoDB
export const ensurePersistentDataInDB = async () => {
  try {
    const state = getPersistentState();
    const rawUsers = [
      ...(Array.isArray(state.users) ? state.users : []),
      defaultFreelancer,
      defaultClientKesh,
      defaultClient,
      defaultClientGmail
    ];

    const seenEmails = new Set();
    const usersToEnsure = [];
    for (const u of rawUsers) {
      const em = (u.email || '').trim().toLowerCase();
      if (em && !seenEmails.has(em)) {
        seenEmails.add(em);
        usersToEnsure.push({ ...u, email: em });
      }
    }

    const emailToUserMap = {};

    for (const userData of usersToEnsure) {
      const cleanEmail = userData.email.trim().toLowerCase();
      let user = await User.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });

      if (!user) {
        console.log(`📦 Restoring persistent account: ${userData.name} (${cleanEmail})`);
        user = await User.create({
          ...userData,
          email: cleanEmail
        });
      } else {
        // Sync any updated fields like bio, balance, or rating
        if (userData.balance !== undefined && (user.balance === undefined || user.balance === 0)) {
          user.balance = userData.balance;
        }
        if (userData.bio && !user.bio) {
          user.bio = userData.bio;
        }
        await user.save();
      }

      emailToUserMap[cleanEmail] = user;
    }

    // Ensure sample projects exist for Client
    const projectsToEnsure = Array.isArray(state.projects) && state.projects.length > 0 ? state.projects : defaultProjects;

    for (const projData of projectsToEnsure) {
      const existingProj = await Project.findOne({ title: projData.title });
      if (!existingProj) {
        const clientEmail = (projData.clientEmail || 'kesh@gmail.com').trim().toLowerCase();
        let clientDoc = emailToUserMap[clientEmail] || await User.findOne({ email: clientEmail });
        if (!clientDoc) {
          clientDoc = emailToUserMap['kesh@gmail.com'] || emailToUserMap['john@gmail.com'] || emailToUserMap['john@example.com'] || await User.findOne({ role: 'client' });
        }

        if (clientDoc) {
          console.log(`📦 Restoring persistent project: "${projData.title}" for client ${clientDoc.name}`);
          let assignedFreelancerId = null;
          if (projData.assignedFreelancerEmail) {
            const fDoc = emailToUserMap[projData.assignedFreelancerEmail.trim().toLowerCase()];
            if (fDoc) assignedFreelancerId = fDoc._id;
          }

          await Project.create({
            title: projData.title,
            description: projData.description,
            client: clientDoc._id,
            skills: projData.skills,
            budgetMin: projData.budgetMin,
            budgetMax: projData.budgetMax,
            duration: projData.duration,
            status: projData.status || 'open',
            assignedFreelancer: assignedFreelancerId
          });
        }
      } else if (!existingProj.client) {
        const defaultOwner = emailToUserMap['kesh@gmail.com'] || emailToUserMap['john@gmail.com'];
        if (defaultOwner) {
          existingProj.client = defaultOwner._id;
          await existingProj.save();
        }
      }
    }

    // Ensure existing projects with no client or john get assigned to kesh if kesh has none
    const keshUser = emailToUserMap['kesh@gmail.com'] || await User.findOne({ email: 'kesh@gmail.com' });
    if (keshUser) {
      const keshProjects = await Project.find({ client: keshUser._id });
      if (keshProjects.length === 0) {
        const otherProjects = await Project.find({});
        for (const op of otherProjects) {
          op.client = keshUser._id;
          await op.save();
        }
      }
    }

    console.log('✅ Persistent user accounts (Rishi, Kesh & John Client) and projects verified in database.');
  } catch (err) {
    console.error('Error ensuring persistent data in DB:', err.message);
  }
};
