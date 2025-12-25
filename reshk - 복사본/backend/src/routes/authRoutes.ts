import { Router } from 'express';
import { register, login, kakaoLogin, kakaoCallback, getProfile, updatePushToken, updateProfile, getMyRequests, getMyReports, getUserPublicProfile } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/kakao', kakaoLogin);
router.get('/kakao/callback', kakaoCallback);
router.get('/me', authenticateToken, getProfile);
router.post('/push-token', authenticateToken, updatePushToken);
router.put('/profile', authenticateToken, updateProfile);
router.get('/my-requests', authenticateToken, getMyRequests);
router.get('/my-reports', authenticateToken, getMyReports);
router.get('/public/:id', getUserPublicProfile);

export default router;
