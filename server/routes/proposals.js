import express from 'express';
import { submitProposal, getProjectProposals, getMyProposals, acceptProposal, rejectProposal, deleteProposal } from '../controllers/proposalController.js';
import { protect, roleCheck } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, roleCheck('freelancer'), submitProposal);
router.get('/my/proposals', protect, roleCheck('freelancer'), getMyProposals);
router.get('/project/:projectId', protect, getProjectProposals);

router.put('/:id/accept', protect, roleCheck('client'), acceptProposal);
router.put('/:id/reject', protect, roleCheck('client'), rejectProposal);
router.delete('/:id', protect, deleteProposal);

export default router;
