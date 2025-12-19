import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, phone } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name,
                phone,
            },
        });

        // Generate token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: { requests: true, reports: true }
                }
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            profileImage: user.profileImage,
            role: user.role,
            stats: {
                requests: user._count.requests,
                reports: user._count.reports,
                rating: 5.0 // Placeholder for now
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Push Token
export const updatePushToken = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { pushToken } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        await prisma.user.update({
            where: { id: userId },
            data: { pushToken },
        });

        res.status(200).json({ message: 'Push token updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Profile
export const updateProfile = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name, phone, profileImage } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(profileImage && { profileImage }),
            },
        });

        res.status(200).json({
            id: updated.id,
            email: updated.email,
            name: updated.name,
            phone: updated.phone,
            profileImage: updated.profileImage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Requests
export const getMyRequests = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const requests = await prisma.request.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Reports
export const getMyReports = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const reports = await prisma.report.findMany({
            where: { reporterId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                request: { select: { title: true, status: true } },
            },
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get Public Profile
export const getUserPublicProfile = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                profileImage: true,
                identityStatus: true,
                rating: true,
                reviewCount: true,
                _count: {
                    select: { requests: true, reports: true }
                }
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
