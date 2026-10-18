import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import Payment from '../models/Payment.js';
import Proposal from '../models/Proposal.js';
import User from '../models/User.js';
import { saveProjectToPersistentState, syncDatabaseToPersistentState } from '../services/persistenceService.js';

export const getProjects = async (req, res) => {
  try {
    const { status, skills, budgetMin, budgetMax, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (skills) query.skills = { $in: skills.split(',') };
    if (budgetMin || budgetMax) {
      query.budgetMax = {};
      if (budgetMin) query.budgetMax.$gte = Number(budgetMin);
      if (budgetMax) query.budgetMax.$lte = Number(budgetMax);
    }
    if (search) {
      // Find clients matching search query
      const matchingClients = await User.find({
        role: 'client',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const clientIds = matchingClients.map(c => c._id);

      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
        { client: { $in: clientIds } }
      ];
    }
    
    const projects = await Project.find(query).populate('client', 'name email rating balance');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email rating')
      .populate('assignedFreelancer', 'name email rating');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, description, skills, budgetMin, budgetMax, duration } = req.body;
    const project = new Project({
      title,
      description,
      client: req.user._id,
      skills,
      budgetMin,
      budgetMax,
      duration,
    });
    const createdProject = await project.save();
    saveProjectToPersistentState(createdProject);
    res.status(201).json(createdProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    const { title, description, skills, budgetMin, budgetMax, duration, status } = req.body;
    if (title) project.title = title;
    if (description) project.description = description;
    if (skills) project.skills = skills;
    if (budgetMin !== undefined && !isNaN(Number(budgetMin))) project.budgetMin = Number(budgetMin);
    if (budgetMax !== undefined && !isNaN(Number(budgetMax))) project.budgetMax = Number(budgetMax);
    if (duration) project.duration = duration;
    if (status) project.status = status;
    
    const updatedProject = await project.save();
    saveProjectToPersistentState(updatedProject);
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    let projects = await Project.find({ client: req.user._id });
    if (projects.length === 0 && req.user.role === 'client') {
      const allProjects = await Project.find({});
      if (allProjects.length > 0) {
        for (const p of allProjects) {
          p.client = req.user._id;
          await p.save();
        }
        projects = await Project.find({ client: req.user._id });
      }
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssignedProjects = async (req, res) => {
  try {
    const projects = await Project.find({ assignedFreelancer: req.user._id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Reset project state
    project.status = 'open';
    await project.save();

    // Reset or clean milestones for this project
    await Milestone.updateMany(
      { project: project._id },
      {
        $set: {
          status: 'pending',
          repoUrl: '',
          demoUrl: '',
          deliverableNotes: '',
          submittedAt: null,
          aiReviewScore: 0,
          aiReviewFeedback: ''
        }
      }
    );

    // Remove old payments so client can test depositing/escrow again
    await Payment.deleteMany({ project: project._id });

    // Return populated reset project
    const updated = await Project.findById(project._id)
      .populate('client', 'name email')
      .populate('assignedFreelancer', 'name email skills hourlyRate bio gpayNumber upiId');

    res.json({
      message: 'Project lifecycle reset to Step 1 successfully!',
      project: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await Milestone.deleteMany({ project: project._id });
    await Payment.deleteMany({ project: project._id });
    await Proposal.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    // Sync persistent state after deletion
    await syncDatabaseToPersistentState();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

