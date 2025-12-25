import { Router } from 'express';
import { createOrGetChatRoom, getMyChatRooms, getChatMessages } from '../controllers/chatController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, createOrGetChatRoom);
router.get('/', authenticateToken, getMyChatRooms);
router.get('/:roomId/messages', authenticateToken, getChatMessages);

export default router;
