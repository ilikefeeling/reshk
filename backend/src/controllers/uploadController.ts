import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';

/**
 * 다중 이미지 업로드 처리
 * 업로드된 파일들의 URL을 반환
 */
export const uploadImages = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // 업로드된 파일들의 URL 생성
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        const imageUrls = req.files.map((file: Express.Multer.File) =>
            `${baseUrl}/uploads/${file.filename}`
        );

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            urls: imageUrls,
            count: imageUrls.length
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
