import { Router } from 'express';
import { blockUser, unblockUser, reportUser, getBlockedUsers } from '../controllers/safetyController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/block', authenticateToken, blockUser);
router.post('/unblock', authenticateToken, unblockUser);
router.post('/report', authenticateToken, reportUser);
router.get('/blocks', authenticateToken, getBlockedUsers);

export default router;
