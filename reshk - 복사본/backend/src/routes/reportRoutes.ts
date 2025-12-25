import { Router } from 'express';
import { createReport, getReportsByRequestId, updateReportStatus } from '../controllers/reportController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createReport);
router.get('/request/:requestId', authenticateToken, getReportsByRequestId);
router.patch('/:id/status', authenticateToken, updateReportStatus);

export default router;
