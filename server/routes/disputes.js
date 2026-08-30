import express from 'express';
import { getProjectDisputes, fileDispute, resolveDispute } from '../controllers/disputeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', getProjectDisputes);
router.post('/', fileDispute);
router.put('/:id/resolve', resolveDispute);

export default router;
