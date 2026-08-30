import express from 'express';
import { 
  getWalletSummary, 
  requestWithdrawal, 
  depositFunds,
  deleteTransaction,
  clearAllTransactions,
  resetBalance,
  adjustBalance
} from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getWalletSummary);
router.post('/withdraw', requestWithdrawal);
router.post('/deposit', depositFunds);
router.post('/reset-balance', resetBalance);
router.post('/adjust-balance', adjustBalance);
router.delete('/transactions/:id', deleteTransaction);
router.delete('/transactions/clear/all', clearAllTransactions);

export default router;


