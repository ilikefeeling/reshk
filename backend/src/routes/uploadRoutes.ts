import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware';
import { uploadImages } from '../controllers/uploadController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * POST /api/upload
 * 다중 이미지 업로드 (최대 5개)
 * 인증 필요
 */
router.post('/', authenticateToken, upload.array('images', 5), uploadImages);

export default router;
