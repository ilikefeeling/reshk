import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { analyzeImageSimilarity } from '../services/aiService';

// Helper to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Create a new report
export const createReport = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId, description, images, location, metadata } = req.body;
        const reporterId = req.user?.userId;

        if (!reporterId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const request = await prisma.request.findUnique({ where: { id: Number(requestId) } });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // --- VERIFICATION LOGIC ---
        let verificationScore = 0.5; // Base score
        let lat = null, lng = null, capturedAt = null;

        if (metadata && Array.isArray(metadata) && metadata.length > 0) {
            const firstPhotoMeta = metadata[0]; // Assume first photo is representative

            // Extract GPS
            if (firstPhotoMeta.latitude && firstPhotoMeta.longitude) {
                lat = firstPhotoMeta.latitude;
                lng = firstPhotoMeta.longitude;

                // Compare with request location (if available)
                if (request.latitude && request.longitude) {
                    const dist = calculateDistance(lat, lng, request.latitude, request.longitude);
                    if (dist < 1) verificationScore += 0.2; // Within 1km
                    else if (dist > 50) verificationScore -= 0.3; // Too far (fake report?)
                }
            }

            // Extract Timestamp
            if (firstPhotoMeta.CreateDate || firstPhotoMeta.DateTimeOriginal) {
                capturedAt = new Date(firstPhotoMeta.CreateDate || firstPhotoMeta.DateTimeOriginal);

                // Captured time should be after request creation (usually)
                if (capturedAt > request.createdAt) verificationScore += 0.1;
                else verificationScore -= 0.1; // Photo taken before request
            }
        }

        // Cap verificationScore 0 to 1
        verificationScore = Math.max(0, Math.min(1, verificationScore));

        // --- AI IMAGE SIMILARITY ---
        let aiScore = 0;
        if (images && images.length > 0 && request.images && request.images.length > 0) {
            try {
                // 비교를 위해 첫 번째 이미지들을 사용 (대표 이미지)
                // 로컬 경로 또는 URL 처리 필요. aiService 내부에서 처리하도록 설계됨.
                aiScore = await analyzeImageSimilarity(request.images[0], images[0]);
            } catch (err) {
                console.error('AI Similarity check failed:', err);
                aiScore = 0;
            }
        }

        // 최종 검증 점수 계산 (메타데이터 40% + AI 60%)
        const finalVerificationScore = (verificationScore * 0.4) + (aiScore * 0.6);

        // 자동 승인 조건: 최종 점수가 95% 이상인 경우
        const status = finalVerificationScore >= 0.95 ? 'ACCEPTED' : 'PENDING';

        const report = await prisma.report.create({
            data: {
                requestId: Number(requestId),
                reporterId,
                description,
                images: images || [],
                location,
                metadata: metadata || null,
                latitude: lat,
                longitude: lng,
                capturedAt,
                verificationScore: finalVerificationScore,
                aiScore,
                status // 'ACCEPTED' if score >= 0.95, else 'PENDING'
            },
        });

        res.status(201).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get reports for a specific request
export const getReportsByRequestId = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId } = req.params;

        const reports = await prisma.report.findMany({
            where: { requestId: Number(requestId) },
            include: {
                reporter: {
                    select: { id: true, name: true, profileImage: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update report status (e.g., ACCEPTED, REJECTED) - Only Request Owner can do this
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACCEPTED', 'REJECTED'
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const report = await prisma.report.findUnique({
            where: { id: Number(id) },
            include: { request: true },
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Check if the user is the owner of the request
        if (report.request.userId !== userId) {
            return res.status(403).json({ message: 'Only the request owner can update report status' });
        }

        const updatedReport = await prisma.report.update({
            where: { id: Number(id) },
            data: { status },
        });

        res.status(200).json(updatedReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ADMIN: Get all reports pending review
export const getPendingReports = async (req: AuthRequest, res: Response) => {
    try {
        const reports = await prisma.report.findMany({
            where: {
                status: { in: ['PENDING', 'ACCEPTED'] }
            },
            include: {
                reporter: { select: { id: true, name: true, profileImage: true } },
                request: {
                    select: {
                        id: true,
                        title: true,
                        images: true,
                        latitude: true,
                        longitude: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ADMIN: Approve a report
export const approveReport = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updated = await prisma.report.update({
            where: { id: Number(id) },
            data: { status: 'ACCEPTED' }
        });
        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ADMIN: Reject a report
export const rejectReport = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const report = await prisma.report.findUnique({ where: { id: Number(id) } });
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const updated = await prisma.report.update({
            where: { id: Number(id) },
            data: {
                status: 'REJECTED',
                description: `[거절 사유: ${reason || '없음'}] ${report.description}`
            }
        });
        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an existing report
export const updateReport = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { description, images, location, metadata } = req.body;
        const reporterId = req.user?.userId;

        if (!reporterId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const report = await prisma.report.findUnique({
            where: { id: Number(id) },
            include: { request: true }
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.reporterId !== reporterId) {
            return res.status(403).json({ message: 'You do not have permission to edit this report' });
        }

        // Only allow editing if status is PENDING
        if (report.status !== 'PENDING') {
            return res.status(400).json({ message: 'Cannot edit a report that has already been accepted or rejected' });
        }

        let lat = report.latitude;
        let lng = report.longitude;
        let capturedAt = report.capturedAt;
        let finalVerificationScore = report.verificationScore;
        let aiScore = report.aiScore;

        const metadataChanged = metadata !== undefined && JSON.stringify(metadata) !== JSON.stringify(report.metadata);
        const imagesChanged = images !== undefined && JSON.stringify(images) !== JSON.stringify(report.images);

        if (metadataChanged || imagesChanged) {
            // Re-run verification logic
            const currentMetadata = metadata ?? report.metadata;
            const currentImages = images ?? report.images;
            const request = report.request;

            let verificationScore = 0.5; // Base score

            if (currentMetadata && Array.isArray(currentMetadata) && currentMetadata.length > 0) {
                const firstPhotoMeta = currentMetadata[0];
                if (firstPhotoMeta.latitude && firstPhotoMeta.longitude) {
                    lat = firstPhotoMeta.latitude;
                    lng = firstPhotoMeta.longitude;
                    if (request.latitude !== null && request.longitude !== null && lat !== null && lng !== null) {
                        const dist = calculateDistance(lat, lng, Number(request.latitude), Number(request.longitude));
                        if (dist < 1) verificationScore += 0.2;
                        else if (dist > 50) verificationScore -= 0.3;
                    }
                }
                if (firstPhotoMeta.CreateDate || firstPhotoMeta.DateTimeOriginal) {
                    capturedAt = new Date(firstPhotoMeta.CreateDate || firstPhotoMeta.DateTimeOriginal);
                    if (capturedAt > request.createdAt) verificationScore += 0.1;
                    else verificationScore -= 0.1;
                }
            }
            verificationScore = Math.max(0, Math.min(1, verificationScore));

            if (imagesChanged && currentImages && currentImages.length > 0 && request.images && request.images.length > 0) {
                try {
                    aiScore = await analyzeImageSimilarity(request.images[0], currentImages[0]);
                } catch (err) {
                    console.error('AI Similarity update failed:', err);
                    aiScore = 0;
                }
            }

            finalVerificationScore = (verificationScore * 0.4) + ((aiScore || 0) * 0.6);
        }

        const updatedReport = await prisma.report.update({
            where: { id: Number(id) },
            data: {
                description: description ?? report.description,
                images: images ?? report.images,
                location: location ?? report.location,
                metadata: metadata ?? report.metadata,
                latitude: lat,
                longitude: lng,
                capturedAt: capturedAt,
                verificationScore: finalVerificationScore,
                aiScore: aiScore,
                // Status remains PENDING during edit
            },
        });

        res.status(200).json(updatedReport);
    } catch (error: any) {
        console.error('[ERROR] updateReport:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};
