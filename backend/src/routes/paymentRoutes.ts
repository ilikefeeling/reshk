import { Router } from 'express';
import { verifyPayment, getMyTransactions } from '../controllers/paymentController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/verify', authenticateToken, verifyPayment);
router.get('/me', authenticateToken, getMyTransactions);

export default router;
