import Proposal from '../models/Proposal.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Milestone from '../models/Milestone.js';
import { matchFreelancersToProject } from '../services/geminiService.js';
import { syncDatabaseToPersistentState } from '../services/persistenceService.js';

export const submitProposal = async (req, res) => {
  try {
    const projectId = req.body.projectId || req.body.project;
    const { coverLetter, bidAmount, estimatedDuration, experienceRating } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const existingProposal = await Proposal.findOne({ project: projectId, freelancer: req.user._id });
    if (existingProposal) return res.status(400).json({ message: 'You have already submitted a proposal for this project' });

    // Calculate AI Match Score
    const matchResults = await matchFreelancersToProject(project, [req.user]);
    const aiMatchScore = (matchResults && matchResults.length > 0 && matchResults[0].score) ? matchResults[0].score : 85;

    const proposal = new Proposal({
      project: projectId,
      freelancer: req.user._id,
      coverLetter,
      bidAmount: Number(bidAmount) || project.budgetMin || 0,
      estimatedDuration: estimatedDuration || '2-4 weeks',
      experienceRating: Number(experienceRating) || 5,
      aiMatchScore
    });
    
    const createdProposal = await proposal.save();

    // Real-time socket notification to client
    try {
      const io = req.app.get('io');
      if (io && project.client) {
        const populatedProposal = await Proposal.findById(createdProposal._id)
          .populate('freelancer', 'name email skills bio rating hourlyRate gpayNumber upiId');
        
        io.to(project.client.toString()).emit('proposalReceived', {
          proposal: populatedProposal,
          project: {
            _id: project._id,
            title: project.title,
            budgetMin: project.budgetMin,
            budgetMax: project.budgetMax
          },
          freelancer: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            rating: req.user.rating || 5
          }
        });
      }
    } catch (socketErr) {
      console.error('Socket emission error for proposalReceived:', socketErr.message);
    }

    syncDatabaseToPersistentState();
    res.status(201).json(createdProposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectProposals = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Allow both client of project and freelancers to view (freelancer will only see own or general count)
    const isOwner = project.client.toString() === req.user._id.toString();
    
    let proposals;
    if (isOwner) {
      proposals = await Proposal.find({ project: req.params.projectId })
        .populate('freelancer', 'name email skills bio rating hourlyRate portfolio totalReviews resumeData portfolioProjects githubUsername githubUrl verifiedBadges upiQrCode gpayNumber upiId');
    } else {
      proposals = await Proposal.find({ project: req.params.projectId, freelancer: req.user._id })
        .populate('freelancer', 'name email skills bio rating hourlyRate portfolio totalReviews resumeData portfolioProjects githubUsername githubUrl verifiedBadges upiQrCode gpayNumber upiId');
    }
    
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate('project', 'title status budgetMin budgetMax duration client')
      .sort({ createdAt: -1 });
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('project');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    
    if (proposal.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept proposal for this project' });
    }

    proposal.status = 'accepted';
    await proposal.save();

    // Update project
    proposal.project.assignedFreelancer = proposal.freelancer;
    proposal.project.status = 'in-progress';
    await proposal.project.save();

    // Reject other proposals
    await Proposal.updateMany(
      { project: proposal.project._id, _id: { $ne: proposal._id } },
      { $set: { status: 'rejected' } }
    );

    // Ensure escrow milestone exists for immediate funding
    const existingMilestone = await Milestone.findOne({ project: proposal.project._id });
    if (!existingMilestone) {
      await Milestone.create({
        project: proposal.project._id,
        title: `${proposal.project.title} - Main Project Deliverable`,
        description: `Full project development, source code, and live demo delivery.`,
        amount: proposal.bidAmount || proposal.project.budgetMax || 5000,
        status: 'pending'
      });
    }

    syncDatabaseToPersistentState();
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('project');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    
    if (proposal.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    proposal.status = 'rejected';
    await proposal.save();

    res.json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    if (proposal.freelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this proposal' });
    }

    await Proposal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Proposal withdrawn and deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
