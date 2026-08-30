import express from 'express';
import { 
  matchFreelancers, 
  recommendProjects, 
  recommendFreelancers, 
  enhanceProposal,
  generateMilestones,
  inspectDeliverable,
  getSkillQuiz,
  verifySkill,
  parseResume,
  parseResumeFile,
  extractGitHub
} from '../controllers/aiController.js';
import { protect, roleCheck } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/match/:projectId', roleCheck('client'), matchFreelancers);
router.get('/recommend-projects', roleCheck('freelancer'), recommendProjects);
router.get('/recommend-freelancers/:projectId', roleCheck('client'), recommendFreelancers);
router.post('/enhance-proposal', roleCheck('freelancer'), enhanceProposal);

// Innovations
router.post('/generate-milestones', roleCheck('client'), generateMilestones);
router.post('/inspect-deliverable', inspectDeliverable);
router.get('/skill-quiz/:skill', getSkillQuiz);
router.post('/verify-skill', verifySkill);
router.post('/parse-profile', parseResume);
router.post('/parse-resume-file', parseResumeFile);
router.post('/extract-github', extractGitHub);

export default router;
