import express from 'express';
import { 
  fundMilestone, 
  releasePayment, 
  getProjectPayments,
  createGatewayOrder,
  verifyGatewayPayment
} from '../controllers/paymentController.js';
import { protect, roleCheck } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/fund', roleCheck('client'), fundMilestone);
router.post('/create-order', roleCheck('client'), createGatewayOrder);
router.post('/verify-payment', roleCheck('client'), verifyGatewayPayment);
router.put('/release/:id', roleCheck('client'), releasePayment);
router.get('/project/:projectId', getProjectPayments);

export default router;
