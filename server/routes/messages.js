import express from 'express';
import { 
  getConversation, 
  sendMessage, 
  getConversations, 
  markAsRead,
  getUnreadCount
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/unread/total', getUnreadCount);
router.post('/', sendMessage);
router.put('/read/:userId', markAsRead);
router.get('/:userId', getConversation);

export default router;
