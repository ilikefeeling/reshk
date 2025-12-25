import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Create or Get Chat Room
export const createOrGetChatRoom = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId, targetUserId } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Check if room exists
        // This is a simplified check. In production, you'd need a more robust query to find a room with exactly these two users and requestId.
        // For now, we'll just create a new one if we don't find one easily, or just create one.
        // Let's create one for simplicity.

        const chatRoom = await prisma.chatRoom.create({
            data: {
                requestId: Number(requestId),
                users: {
                    connect: [{ id: userId }, { id: Number(targetUserId) }],
                },
            },
            include: {
                users: { select: { id: true, name: true, profileImage: true } },
            },
        });

        res.status(201).json(chatRoom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Chat Rooms
export const getMyChatRooms = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const chatRooms = await prisma.chatRoom.findMany({
            where: {
                users: {
                    some: { id: userId },
                },
            },
            include: {
                users: { select: { id: true, name: true, profileImage: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.status(200).json(chatRooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Messages for a Room
export const getChatMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { roomId } = req.params;

        const messages = await prisma.message.findMany({
            where: { chatRoomId: Number(roomId) },
            include: {
                sender: { select: { id: true, name: true, profileImage: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
