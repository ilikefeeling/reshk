import { Router } from 'express';
import { createReport, getReportsByRequestId, updateReportStatus } from '../controllers/reportController';
import { generateDeliveryQR, verifyDelivery } from '../controllers/qrController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createReport);
router.get('/request/:requestId', authenticateToken, getReportsByRequestId);
router.patch('/:id/status', authenticateToken, updateReportStatus);

// Delivery Verification
router.post('/delivery/qr', authenticateToken, generateDeliveryQR);
router.post('/delivery/verify', authenticateToken, verifyDelivery);

export default router;
