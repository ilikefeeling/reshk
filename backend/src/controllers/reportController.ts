import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Create a new report
export const createReport = async (req: AuthRequest, res: Response) => {
    try {
        const { requestId, description, images, location } = req.body;
        const reporterId = req.user?.userId;

        if (!reporterId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify request exists
        const request = await prisma.request.findUnique({ where: { id: Number(requestId) } });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const report = await prisma.report.create({
            data: {
                requestId: Number(requestId),
                reporterId,
                description,
                images: images || [],
                location,
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
