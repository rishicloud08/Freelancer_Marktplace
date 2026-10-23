import mongoose from 'mongoose';
import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { saveUserToPersistentState } from '../services/persistenceService.js';
import * as geminiService from '../services/geminiService.js';

export const getMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find({ project: req.params.projectId });
    res.json(milestones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMilestone = async (req, res) => {
  try {
    const { projectId, project: pId, title, description, amount, dueDate } = req.body;
    const targetProjectId = projectId || pId;
    
    const project = await Project.findById(targetProjectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const milestone = new Milestone({
      project: targetProjectId,
      title,
      description,
      amount,
      dueDate: dueDate || new Date()
    });

    const createdMilestone = await milestone.save();
    res.status(201).json(createdMilestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMilestoneStatus = async (req, res) => {
  try {
    const { status, repoUrl, demoUrl, deliverableNotes, projectId, project: pId, amount, title } = req.body;
    let milestone;
    
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      milestone = await Milestone.findById(req.params.id).populate('project');
    }

    if (!milestone) {
      const targetProjectId = projectId || pId || req.query.projectId;
      if (targetProjectId) {
        milestone = await Milestone.findOne({ project: targetProjectId }).populate('project');
        if (!milestone) {
          const prj = await Project.findById(targetProjectId);
          if (prj) {
            milestone = await Milestone.create({
              project: targetProjectId,
              title: `${prj.title} - Main Deliverable`,
              amount: prj.budgetMax || 10,
              status: 'pending'
            });
            await milestone.populate('project');
          }
        }
      }
    }

    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
    
    const project = milestone.project;
    const isClient = project.client.toString() === req.user._id.toString();
    const isFreelancer = project.assignedFreelancer && project.assignedFreelancer.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (isClient && amount !== undefined && !isNaN(Number(amount))) {
      milestone.amount = Number(amount);
    }
    if (isClient && title) {
      milestone.title = title;
    }

    if (isFreelancer && (status === 'completed' || repoUrl || deliverableNotes)) {
      milestone.status = 'completed';
      milestone.completedAt = new Date();
      milestone.submittedAt = new Date();
      if (repoUrl !== undefined) milestone.repoUrl = repoUrl;
      if (demoUrl !== undefined) milestone.demoUrl = demoUrl;
      if (deliverableNotes !== undefined) milestone.deliverableNotes = deliverableNotes;

      // Automatically run AI Deliverable Quality Audit
      try {
        const audit = await geminiService.inspectMilestoneDeliverable(project, milestone, {
          repoUrl: milestone.repoUrl,
          demoUrl: milestone.demoUrl,
          deliverableNotes: milestone.deliverableNotes
        });
        milestone.aiReviewScore = audit.score;
        milestone.aiReviewScoreOutOfTen = audit.scoreOutOfTen || Number((audit.score / 10).toFixed(1));
        milestone.aiReviewFeedback = audit.feedback;
        milestone.aiReviewVerdict = audit.verdict;
        milestone.aiReviewSecurityPassed = audit.securityPassed;
        milestone.aiReviewBreakdown = audit.breakdown;
        milestone.aiReviewChecklist = audit.checklist;
      } catch (e) {
        console.log('Auto audit note:', e.message);
      }

    } else if (isClient && status === 'approved') {
      milestone.status = 'approved';

      // Release any escrow payment funded for this milestone to the freelancer
      try {
        const payment = await Payment.findOne({ 
          $or: [
            { milestone: milestone._id, status: 'funded' },
            { project: project._id, status: 'funded' }
          ]
        });
        if (payment) {
          payment.status = 'released';
          await payment.save();
          const payeeId = payment.payee || project.assignedFreelancer;
          if (payeeId) {
            const freelancer = await User.findById(payeeId);
            if (freelancer) {
              freelancer.balance = (freelancer.balance || 0) + payment.amount;
              await freelancer.save();
              saveUserToPersistentState(freelancer);
            }
          }
        }
      } catch (payErr) {
        console.log('Payment auto-release note:', payErr.message);
      }
    } else if (isClient && (status === 'in-progress' || status === 'pending')) {
       milestone.status = status;
    } else if (isClient && (amount !== undefined || title)) {
       // Handled: Client updated milestone amount/title
    } else {
       return res.status(400).json({ message: 'Invalid status update for this role' });
    }

    await milestone.save();
    res.json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Milestone Submission & Clear Deliverables
export const resetMilestoneSubmission = async (req, res) => {
  try {
    const { projectId } = req.body;
    let milestone;
    
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      milestone = await Milestone.findById(req.params.id).populate('project');
    }

    if (!milestone && projectId) {
      milestone = await Milestone.findOne({ project: projectId }).populate('project');
    }

    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    milestone.status = 'in-progress';
    milestone.repoUrl = '';
    milestone.demoUrl = '';
    milestone.deliverableNotes = '';
    milestone.aiReviewFeedback = '';
    milestone.aiReviewScore = 0;
    milestone.completedAt = null;
    milestone.submittedAt = null;

    await milestone.save();
    res.json({ message: 'Project submission reset successfully!', milestone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
