import { Router } from 'express';
import { register, login, getProfile, updatePushToken, updateProfile, getMyRequests, getMyReports } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getProfile);
router.post('/push-token', authenticateToken, updatePushToken);
router.put('/profile', authenticateToken, updateProfile);
router.get('/my-requests', authenticateToken, getMyRequests);
router.get('/my-reports', authenticateToken, getMyReports);

export default router;
