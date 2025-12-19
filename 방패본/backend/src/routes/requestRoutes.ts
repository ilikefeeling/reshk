import { Router } from 'express';
import { createRequest, getRequests, getRequestById, acceptRequest, completeRequest, cancelRequest, getNearbyRequests, getPendingRequests, approveRequest, getAdminStats, bulkApproveRequests } from '../controllers/requestController';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createRequest);
router.get('/', getRequests);
router.get('/nearby', getNearbyRequests);

// Admin routes
router.get('/admin/pending', authenticateToken, isAdmin, getPendingRequests);
router.get('/admin/stats', authenticateToken, isAdmin, getAdminStats);
router.post('/admin/bulk-approve', authenticateToken, isAdmin, bulkApproveRequests);
router.post('/admin/:id/approve', authenticateToken, isAdmin, approveRequest);

router.get('/:id', getRequestById);
router.post('/:id/accept', authenticateToken, isAdmin, acceptRequest); // Optional: keep or remove isAdmin here
router.post('/:id/complete', authenticateToken, completeRequest);
router.post('/:id/cancel', authenticateToken, cancelRequest);

export default router;
