import { Router } from 'express';
import { createRequest, getRequests, getRequestById } from '../controllers/requestController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createRequest);
router.get('/', getRequests); // Publicly accessible list? Or authenticated? Let's make it public for now, or auth optional if needed. For now, open.
router.get('/:id', getRequestById);

export default router;
