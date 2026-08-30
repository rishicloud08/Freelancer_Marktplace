import Contract from '../models/Contract.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import User from '../models/User.js';
import * as geminiService from '../services/geminiService.js';
import crypto from 'crypto';

export const getProjectContract = async (req, res) => {
  try {
    let contract = await Contract.findOne({ project: req.params.projectId })
      .populate('client', 'name email')
      .populate('freelancer', 'name email');

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateContract = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId)
      .populate('client', 'name email')
      .populate('assignedFreelancer', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.assignedFreelancer) {
      return res.status(400).json({ message: 'Please assign a freelancer before creating an SLA contract' });
    }

    const milestones = await Milestone.find({ project: projectId });

    const contractData = await geminiService.generateContractAgreement(
      project,
      project.client,
      project.assignedFreelancer,
      milestones
    );

    const hash = crypto.createHash('sha256').update(`${projectId}-${Date.now()}`).digest('hex');

    // Create or update contract
    let contract = await Contract.findOne({ project: projectId });
    if (contract) {
      contract.contractTitle = contractData.contractTitle;
      contract.totalBudget = contractData.totalBudget;
      contract.slaTerms = contractData.slaTerms;
      contract.ipClauses = contractData.ipClauses;
      contract.contractHash = hash;
      await contract.save();
    } else {
      contract = new Contract({
        project: projectId,
        client: project.client._id,
        freelancer: project.assignedFreelancer._id,
        contractTitle: contractData.contractTitle,
        totalBudget: contractData.totalBudget,
        slaTerms: contractData.slaTerms,
        ipClauses: contractData.ipClauses,
        contractHash: hash
      });
      await contract.save();
    }

    contract = await Contract.findById(contract._id)
      .populate('client', 'name email')
      .populate('freelancer', 'name email');

    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signContract = async (req, res) => {
  try {
    const { contractId, signatureName } = req.body;
    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const userId = req.user._id.toString();
    const isClient = contract.client.toString() === userId;
    const isFreelancer = contract.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized to sign this agreement' });
    }

    if (isClient) {
      contract.clientSigned = true;
      contract.clientSignatureName = signatureName || req.user.name;
      contract.clientSignedAt = new Date();
    } else {
      contract.freelancerSigned = true;
      contract.freelancerSignatureName = signatureName || req.user.name;
      contract.freelancerSignedAt = new Date();
    }

    if (contract.clientSigned && contract.freelancerSigned) {
      contract.status = 'active';
    }

    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
