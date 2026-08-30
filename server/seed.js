import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Project from './models/Project.js';
import Proposal from './models/Proposal.js';
import Milestone from './models/Milestone.js';
import connectDB from './config/db.js';

dotenv.config();

export const runSeed = async () => {
  await User.deleteMany();
  await Project.deleteMany();
  await Proposal.deleteMany();
  await Milestone.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const users = [
    { name: 'Alice Client', email: 'alice@example.com', password: hashedPassword, role: 'client', balance: 10000 },
    { name: 'Bob Client', email: 'bob@example.com', password: hashedPassword, role: 'client', balance: 5000 },
    { name: 'Charlie Client', email: 'charlie@example.com', password: hashedPassword, role: 'client', balance: 8000 },
    { name: 'Diana Freelancer', email: 'diana@example.com', password: hashedPassword, role: 'freelancer', skills: ['React', 'Node.js', 'TypeScript'], hourlyRate: 50, bio: 'Full-stack JavaScript developer with 5 years of experience.' },
    { name: 'Eve Freelancer', email: 'eve@example.com', password: hashedPassword, role: 'freelancer', skills: ['Python', 'Django', 'AI', 'Machine Learning'], hourlyRate: 75, bio: 'AI/ML engineer specializing in NLP and computer vision.' },
    { name: 'Frank Freelancer', email: 'frank@example.com', password: hashedPassword, role: 'freelancer', skills: ['UI/UX', 'Figma', 'CSS', 'Tailwind'], hourlyRate: 40, bio: 'Product designer creating beautiful and intuitive interfaces.' },
    { name: 'Grace Freelancer', email: 'grace@example.com', password: hashedPassword, role: 'freelancer', skills: ['Java', 'Spring Boot', 'Microservices'], hourlyRate: 60, bio: 'Backend engineer building scalable enterprise systems.' },
    { name: 'Henry Freelancer', email: 'henry@example.com', password: hashedPassword, role: 'freelancer', skills: ['React Native', 'Mobile', 'Flutter'], hourlyRate: 55, bio: 'Mobile developer shipping cross-platform apps.' },
  ];

  const createdUsers = await User.insertMany(users);
  console.log('  ✓ Users created');

  const clients = createdUsers.filter(u => u.role === 'client');
  const freelancers = createdUsers.filter(u => u.role === 'freelancer');

  const projects = [
    { title: 'E-Commerce React Dashboard', description: 'Build a modern admin dashboard for an e-commerce platform with analytics, order management, and inventory tracking.', client: clients[0]._id, skills: ['React', 'Node.js', 'TypeScript'], budgetMin: 2000, budgetMax: 4000, duration: '4-6 weeks', status: 'open' },
    { title: 'AI-Powered Chatbot', description: 'Develop an intelligent customer support chatbot using Python and NLP. Must handle FAQs, ticket creation, and human handoff.', client: clients[1]._id, skills: ['Python', 'AI', 'Machine Learning'], budgetMin: 3000, budgetMax: 5000, duration: '6-8 weeks', status: 'open' },
    { title: 'Mobile App UI Redesign', description: 'Complete redesign of a fitness tracking mobile app. Need modern UI with smooth animations and intuitive navigation.', client: clients[2]._id, skills: ['UI/UX', 'Figma'], budgetMin: 800, budgetMax: 1500, duration: '2-3 weeks', status: 'open' },
    { title: 'Microservices Backend', description: 'Architect and implement a microservices backend for a fintech platform. Includes payment processing, user auth, and audit logging.', client: clients[0]._id, skills: ['Java', 'Spring Boot', 'Microservices'], budgetMin: 5000, budgetMax: 8000, duration: '8-12 weeks', status: 'open' },
    { title: 'Cross-Platform Social App', description: 'Build a social networking app for React Native with real-time messaging, stories, and media sharing.', client: clients[1]._id, skills: ['React Native', 'Mobile'], budgetMin: 3000, budgetMax: 6000, duration: '8-10 weeks', status: 'open' },
    { title: 'Landing Page for SaaS Product', description: 'Design and develop a beautiful, high-converting landing page for a B2B SaaS product. Must be responsive and SEO-optimized.', client: clients[2]._id, skills: ['React', 'CSS', 'Tailwind'], budgetMin: 500, budgetMax: 1000, duration: '1-2 weeks', status: 'open' },
    { title: 'Django REST API', description: 'Build a full-featured REST API for a healthcare platform. Includes patient records, appointments, and billing.', client: clients[0]._id, skills: ['Python', 'Django'], budgetMin: 2000, budgetMax: 3500, duration: '4-6 weeks', status: 'open' },
    { title: 'Data Visualization Dashboard', description: 'Create interactive data visualization dashboards using D3.js and React for a marketing analytics platform.', client: clients[1]._id, skills: ['React', 'Node.js'], budgetMin: 1500, budgetMax: 2500, duration: '3-4 weeks', status: 'open' },
  ];

  const createdProjects = await Project.insertMany(projects);
  console.log('  ✓ Projects created');

  const proposals = [
    { project: createdProjects[0]._id, freelancer: freelancers[0]._id, coverLetter: 'I have extensive experience building React dashboards and admin panels. I can deliver a modern, responsive dashboard with all the requested features within the timeline.', bidAmount: 3000, estimatedDuration: '5 weeks', status: 'pending', aiMatchScore: 92 },
    { project: createdProjects[1]._id, freelancer: freelancers[1]._id, coverLetter: 'As an AI/ML specialist, I have built multiple chatbot systems using NLP. I can implement intent recognition, entity extraction, and seamless human handoff.', bidAmount: 4500, estimatedDuration: '7 weeks', status: 'pending', aiMatchScore: 95 },
    { project: createdProjects[2]._id, freelancer: freelancers[2]._id, coverLetter: 'I specialize in mobile app UI/UX design and can deliver beautiful Figma mockups with a complete design system and interactive prototypes.', bidAmount: 1200, estimatedDuration: '3 weeks', status: 'pending', aiMatchScore: 88 },
  ];

  await Proposal.insertMany(proposals);
  console.log('  ✓ Proposals created');

  const milestones = [
    { project: createdProjects[0]._id, title: 'Setup & Architecture', description: 'Project scaffolding, component architecture, and database schema design', amount: 800, status: 'pending', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { project: createdProjects[0]._id, title: 'Core Dashboard Features', description: 'Analytics charts, order management table, and inventory views', amount: 1200, status: 'pending', dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
    { project: createdProjects[0]._id, title: 'Testing & Deployment', description: 'Unit tests, integration tests, and production deployment', amount: 1000, status: 'pending', dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) },
  ];

  await Milestone.insertMany(milestones);
  console.log('  ✓ Milestones created');
};

// Allow running directly: node seed.js
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isDirectRun) {
  try {
    await connectDB();
    await runSeed();
    console.log('\nSeed completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('┌──────────────┬─────────────────────┬──────────────┐');
    console.log('│ Role         │ Email               │ Password     │');
    console.log('├──────────────┼─────────────────────┼──────────────┤');
    console.log('│ Client       │ alice@example.com   │ password123  │');
    console.log('│ Client       │ bob@example.com     │ password123  │');
    console.log('│ Client       │ charlie@example.com │ password123  │');
    console.log('│ Freelancer   │ diana@example.com   │ password123  │');
    console.log('│ Freelancer   │ eve@example.com     │ password123  │');
    console.log('│ Freelancer   │ frank@example.com   │ password123  │');
    console.log('│ Freelancer   │ grace@example.com   │ password123  │');
    console.log('│ Freelancer   │ henry@example.com   │ password123  │');
    console.log('└──────────────┴─────────────────────┴──────────────┘');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}
