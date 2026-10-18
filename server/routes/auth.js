import express from 'express';
import { register, login, getMe, updateProfile, resetDatabase, getRegisteredUsers } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, getRegisteredUsers);
router.put('/profile', protect, updateProfile);
router.all('/reset-database', resetDatabase);

export default router;
