import { Router } from 'express';
import { verifyPayment, getMyTransactions, refundPayment } from '../controllers/paymentController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/verify', authenticateToken, verifyPayment);
router.get('/my-transactions', authenticateToken, getMyTransactions);
router.post('/refund', authenticateToken, refundPayment);

export default router;
