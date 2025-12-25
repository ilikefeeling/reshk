import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/reviewController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createReview);
router.get('/user/:userId', getUserReviews);

export default router;
