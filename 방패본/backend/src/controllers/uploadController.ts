import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
// Removed static import of exifr to avoid ESM conflict in CommonJS
import path from 'path';

/**
 * 다중 이미지 업로드 처리 및 메타데이터 추출
 * 업로드된 파일들의 URL과 메타데이터(EXIF) 반환
 */
export const uploadImages = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        const uploadResults = await Promise.all(req.files.map(async (file: Express.Multer.File) => {
            const url = `${baseUrl}/uploads/${file.filename}`;
            let metadata = null;

            try {
                // EXIF 메타데이터 추출 (GPS, 날짜 등)
                // Dynamic import for ESM-only exifr package
                const exifr = await import('exifr');
                metadata = await exifr.default.parse(file.path);
            } catch (err) {
                console.warn(`Failed to extract metadata for ${file.filename}:`, err);
            }

            return {
                url,
                filename: file.filename,
                metadata
            };
        }));

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: uploadResults,
            count: uploadResults.length
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
