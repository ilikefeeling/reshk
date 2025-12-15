import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Create a new request
export const createRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { category, title, description, rewardAmount, depositAmount, location, images } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const request = await prisma.request.create({
            data: {
                userId,
                category,
                title,
                description,
                rewardAmount,
                depositAmount,
                location,
                images: images || [],
            },
        });

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all requests (with optional filtering)
export const getRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { category } = req.query;

        const whereClause: any = {
            status: 'OPEN'
        };

        if (category) {
            whereClause.category = String(category);
        }

        const requests = await prisma.request.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, profileImage: true },
                },
            },
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a single request by ID
export const getRequestById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const request = await prisma.request.findUnique({
            where: { id: Number(id) },
            include: {
                user: {
                    select: { id: true, name: true, profileImage: true, phone: true },
                },
            },
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.status(200).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
