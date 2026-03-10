import { Response } from 'express';
import prisma from '../utils/prisma';

// Block a user
export const blockUser = async (req: any, res: Response) => {
    try {
        const blockerId = req.user?.userId;
        const { targetUserId } = req.body;

        if (!blockerId) return res.status(401).json({ message: 'Unauthorized' });
        if (blockerId === targetUserId) return res.status(400).json({ message: 'Cannot block yourself' });

        await prisma.block.upsert({
            where: {
                blockerId_blockedUserId: {
                    blockerId,
                    blockedUserId: targetUserId
                }
            },
            update: {},
            create: {
                blockerId,
                blockedUserId: targetUserId
            }
        });

        res.status(200).json({ success: true, message: 'User blocked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Unblock a user
export const unblockUser = async (req: any, res: Response) => {
    try {
        const blockerId = req.user?.userId;
        const { targetUserId } = req.body;

        if (!blockerId) return res.status(401).json({ message: 'Unauthorized' });

        await prisma.block.delete({
            where: {
                blockerId_blockedUserId: {
                    blockerId,
                    blockedUserId: targetUserId
                }
            }
        });

        res.status(200).json({ success: true, message: 'User unblocked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Report a user (신고)
export const reportUser = async (req: any, res: Response) => {
    try {
        const reporterId = req.user?.userId;
        const { targetUserId, reason, details } = req.body;

        if (!reporterId) return res.status(401).json({ message: 'Unauthorized' });

        const complaint = await prisma.complaint.create({
            data: {
                reporterId,
                targetUserId,
                reason,
                details
            }
        });

        res.status(201).json({ success: true, complaintId: complaint.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get blocked users list
export const getBlockedUsers = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const blocked = await prisma.block.findMany({
            where: { blockerId: userId },
            include: {
                blockedUser: {
                    select: { id: true, name: true, profileImage: true }
                }
            }
        });

        res.status(200).json(blocked.map(b => b.blockedUser));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
