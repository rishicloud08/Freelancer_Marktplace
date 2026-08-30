import express from 'express';
import { getMilestones, createMilestone, updateMilestoneStatus, resetMilestoneSubmission } from '../controllers/milestoneController.js';
import { protect, roleCheck } from '../middleware/auth.js';

const router = express.Router();

router.get('/project/:projectId', protect, getMilestones);
router.post('/', protect, roleCheck('client'), createMilestone);
router.put('/:id/status', protect, updateMilestoneStatus);
router.post('/:id/reset', protect, resetMilestoneSubmission);

export default router;
