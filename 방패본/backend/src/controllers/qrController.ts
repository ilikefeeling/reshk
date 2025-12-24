import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import crypto from 'crypto';

/**
 * Generate a verification token (QR Code content) for a report.
 * Only the reporter (finder) can generate this.
 */
export const generateDeliveryQR = async (req: AuthRequest, res: Response) => {
    try {
        const { reportId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const report = await prisma.report.findUnique({
            where: { id: Number(reportId) },
            include: { request: true }
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.request.status === 'PENDING_DEPOSIT') {
            return res.status(400).json({
                message: '사례금 입금이 아직 관리자에 의해 확인되지 않았습니다. 입금 확인 후 QR 생성이 가능합니다.'
            });
        }

        if (report.reporterId !== userId) {
            return res.status(403).json({ message: 'Only the reporter can generate a QR code' });
        }

        // Generate a random secure token
        const token = crypto.randomBytes(32).toString('hex');

        await prisma.report.update({
            where: { id: Number(reportId) },
            data: { verificationToken: token } as any,
        });

        res.status(200).json({ token });
    } catch (error) {
        console.error('Generate QR error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Verify the delivery using the token.
 * Only the request owner (loser) can call this after scanning the QR.
 */
export const verifyDelivery = async (req: AuthRequest, res: Response) => {
    try {
        const { reportId, token } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const report = await prisma.report.findUnique({
            where: { id: Number(reportId) },
            include: { request: true },
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.request.userId !== userId) {
            return res.status(403).json({ message: 'Only the request owner can verify delivery' });
        }

        if ((report as any).verificationToken !== token) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        // Update report status and timestamp
        const updatedReport = await prisma.report.update({
            where: { id: Number(reportId) },
            data: {
                status: 'DELIVERED',
                deliveredAt: new Date(),
                verificationToken: null, // Clear token after use
            } as any,
        });

        // Update request status to COMPLETED
        await prisma.request.update({
            where: { id: report.requestId },
            data: { status: 'COMPLETED' },
        });

        // Trigger Transaction (Simplified: assuming payment logic will handle the actual transfer)
        // In a real escrow, this would trigger the PortOne payout API call.
        await prisma.transaction.create({
            data: {
                requestId: report.requestId,
                reportId: report.id,
                userId: report.reporterId, // Payout to finder
                amount: report.request.rewardAmount,
                type: 'REWARD',
                status: 'COMPLETED',
            }
        });

        res.status(200).json({ message: 'Delivery verified and reward processed', report: updatedReport });
    } catch (error) {
        console.error('Verify delivery error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
