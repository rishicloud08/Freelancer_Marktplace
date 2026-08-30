import express from 'express';
import { createReview, getUserReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);

export default router;
