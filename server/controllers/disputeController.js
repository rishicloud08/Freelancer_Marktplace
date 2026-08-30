import Dispute from '../models/Dispute.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import * as geminiService from '../services/geminiService.js';

export const getProjectDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ project: req.params.projectId })
      .populate('initiator', 'name email')
      .populate('respondent', 'name email')
      .populate('milestone', 'title amount');

    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fileDispute = async (req, res) => {
  try {
    const { projectId, milestoneId, reason, disputeNotes } = req.body;
    
    const project = await Project.findById(projectId)
      .populate('client', 'name email')
      .populate('assignedFreelancer', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    const isClient = project.client._id.toString() === req.user._id.toString();
    const respondent = isClient ? project.assignedFreelancer : project.client;

    const disputeDetails = {
      reason,
      disputeNotes,
      disputedAmount: milestone.amount,
      filedBy: req.user.name
    };

    // Run Gemini AI Dispute Arbitration
    const arbitration = await geminiService.arbitrateDispute(project, milestone, disputeDetails);

    const dispute = new Dispute({
      project: projectId,
      milestone: milestoneId,
      initiator: req.user._id,
      respondent: respondent._id,
      reason,
      disputeNotes,
      disputedAmount: milestone.amount,
      aiVerdict: arbitration.verdict,
      aiFreelancerShare: arbitration.freelancerShare,
      aiClientRefundShare: arbitration.clientRefundShare,
      aiArbitrationSummary: arbitration.summary,
      aiConfidenceScore: arbitration.confidenceScore,
      status: 'under_ai_review'
    });

    const savedDispute = await dispute.save();
    res.status(201).json(savedDispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    dispute.status = 'resolved';
    dispute.resolvedAt = new Date();
    await dispute.save();

    res.json({ message: 'Dispute concluded successfully according to AI Arbitration recommendations', dispute });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
