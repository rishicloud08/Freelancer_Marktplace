import express from 'express';
import { getProjectContract, generateContract, signContract } from '../controllers/contractController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', getProjectContract);
router.post('/generate', generateContract);
router.post('/sign', signContract);

export default router;
