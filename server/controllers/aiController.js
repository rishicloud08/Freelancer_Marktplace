import Project from '../models/Project.js';
import User from '../models/User.js';
import Milestone from '../models/Milestone.js';
import * as geminiService from '../services/geminiService.js';

export const matchFreelancers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const freelancers = await User.find({ role: 'freelancer' }).select('-password');
    const matches = await geminiService.matchFreelancersToProject(project, freelancers);
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recommendProjects = async (req, res) => {
  try {
    const freelancer = await User.findById(req.user._id).select('-password');
    const projects = await Project.find({ status: 'open' });
    
    const recommendations = await geminiService.getProjectRecommendations(freelancer, projects);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recommendFreelancers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const freelancers = await User.find({ role: 'freelancer' }).select('-password');
    const recommendations = await geminiService.getFreelancerRecommendations(project, freelancers);
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const enhanceProposal = async (req, res) => {
  try {
    const { coverLetter, projectDescription, freelancerSkills } = req.body;
    const enhanced = await geminiService.enhanceProposal(coverLetter, projectDescription, freelancerSkills);
    res.json({ enhancedCoverLetter: enhanced });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate AI Milestones
export const generateMilestones = async (req, res) => {
  try {
    const { title, description, budgetMin, budgetMax } = req.body;
    if (!title) return res.status(400).json({ message: 'Project title is required' });

    const milestones = await geminiService.generateProjectMilestones(title, description, budgetMin, budgetMax);
    res.json({ milestones });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Inspect Milestone Deliverables
export const inspectDeliverable = async (req, res) => {
  try {
    const { milestoneId, deliverableNotes, repoUrl, demoUrl } = req.body;
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    const project = await Project.findById(milestone.project);
    const deliverable = { deliverableNotes, repoUrl, demoUrl };

    const audit = await geminiService.inspectMilestoneDeliverable(project, milestone, deliverable);
    
    milestone.aiReviewScore = audit.score;
    milestone.aiReviewFeedback = audit.feedback;
    milestone.aiReviewSecurityPassed = audit.securityPassed;
    await milestone.save();

    res.json({ audit, milestone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Skill Quiz Generation & Verification
export const getSkillQuiz = async (req, res) => {
  try {
    const { skill } = req.params;
    const questions = await geminiService.generateSkillQuiz(skill);
    const clientQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));
    res.json({ skill, questions: clientQuestions, rawQuestions: questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifySkill = async (req, res) => {
  try {
    const { skill, rawQuestions, userAnswers } = req.body;
    const evaluation = await geminiService.evaluateSkillQuiz(skill, rawQuestions, userAnswers);

    if (evaluation.passed) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.verifiedBadges = (user.verifiedBadges || []).filter(b => b.skill.toLowerCase() !== skill.toLowerCase());
        user.verifiedBadges.push({
          skill,
          score: evaluation.score,
          title: 'Verified AI Expert',
          verifiedAt: new Date()
        });
        await user.save();
      }
    }

    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GITHUB PROFILE EXTRACTOR
export const extractGitHub = async (req, res) => {
  try {
    const { githubUsername } = req.body;
    if (!githubUsername) return res.status(400).json({ message: 'GitHub username or link is required' });

    const extracted = await geminiService.extractGitHubDetails(githubUsername);
    res.json(extracted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// STRUCTURED RESUME PARSER TO EDITABLE SECTIONS
export const parseResume = async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ message: 'Input text is required' });

    const parsedData = await geminiService.parseResumeToSections(rawText);
    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MULTIMODAL RESUME PDF UPLOAD PARSER
export const parseResumeFile = async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;
    if (!fileBase64) return res.status(400).json({ message: 'File data is required' });

    const parsedData = await geminiService.parseResumePDF(fileBase64, mimeType, fileName);
    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

