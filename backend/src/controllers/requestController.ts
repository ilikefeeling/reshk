import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// Create a new request
export const createRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { category, title, description, rewardAmount, depositAmount, location, images, latitude, longitude, status } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Basic validation
        if (!title || !category) {
            return res.status(400).json({ message: 'Title and category are required' });
        }

        // Validate category
        const validCategories = ['LOST', 'FOUND', 'REWARD', 'REPORT']; // Adjust based on business rules
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Calculate required deposit based on business rules:
        // <= 100,000 -> 100%
        // > 100,000 -> 10%
        const reward = Number(rewardAmount);
        let calculatedDeposit = 0;
        if (reward <= 100000) {
            calculatedDeposit = reward;
        } else {
            calculatedDeposit = Math.floor(reward * 0.1);
        }

        const request = await prisma.request.create({
            data: {
                userId,
                category,
                title,
                description,
                rewardAmount: reward,
                depositAmount: calculatedDeposit,
                location,
                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null,
                images: images || [],
                status: status || 'OPEN', // Use status from body if provided (TEMPORARY BYPASS)
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
    console.log('GET /requests query:', req.query);
    try {
        const {
            category,
            status,
            keyword,
            location,
            minReward,
            maxReward,
            dateFrom,
            dateTo,
            sortBy
        } = req.query;

        const whereClause: any = {};

        // 상태 필터 (기본값: OPEN)
        if (status) {
            whereClause.status = String(status);
        } else {
            whereClause.status = 'OPEN';
        }

        // 카테고리 필터
        if (category) {
            whereClause.category = String(category);
        }

        // 키워드 검색 (제목 또는 설명)
        if (keyword) {
            whereClause.OR = [
                { title: { contains: String(keyword), mode: 'insensitive' } },
                { description: { contains: String(keyword), mode: 'insensitive' } }
            ];
        }

        // 위치 검색
        if (location) {
            whereClause.location = { contains: String(location), mode: 'insensitive' };
        }

        // 보상 범위 필터
        if (minReward || maxReward) {
            whereClause.rewardAmount = {};
            if (minReward) whereClause.rewardAmount.gte = Number(minReward);
            if (maxReward) whereClause.rewardAmount.lte = Number(maxReward);
        }

        // 날짜 범위 필터
        if (dateFrom || dateTo) {
            whereClause.createdAt = {};
            if (dateFrom) whereClause.createdAt.gte = new Date(String(dateFrom));
            if (dateTo) whereClause.createdAt.lte = new Date(String(dateTo));
        }

        // 정렬 옵션
        let orderBy: any = { createdAt: 'desc' }; // 기본: 최신순
        if (sortBy === 'reward_high') {
            orderBy = { rewardAmount: 'desc' }; // 보상 높은순
        } else if (sortBy === 'reward_low') {
            orderBy = { rewardAmount: 'asc' }; // 보상 낮은순
        }

        console.log('Final whereClause:', JSON.stringify(whereClause, null, 2));

        const requests = await prisma.request.findMany({
            where: {
                ...whereClause,
                // Ensure only visible items are shown if requested without specific filters
                ...(Object.keys(whereClause).length === 0 ? { status: 'OPEN' } : {})
            },
            orderBy,
            include: {
                user: {
                    select: { id: true, name: true, profileImage: true },
                },
            },
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error('Error in getRequests:', error);
        console.error((error as any).stack);
        res.status(500).json({ message: (error as any).message || 'Server error' });
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

// Accept Request (OPEN -> IN_PROGRESS)
export const acceptRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const request = await prisma.request.findUnique({ where: { id: Number(id) } });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'OPEN') {
            return res.status(400).json({ message: 'Request is not open' });
        }

        // 자기 요청은 수락 불가
        if (request.userId === userId) {
            return res.status(400).json({ message: 'Cannot accept your own request' });
        }

        const updated = await prisma.request.update({
            where: { id: Number(id) },
            data: { status: 'IN_PROGRESS' },
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Complete Request (IN_PROGRESS -> COMPLETED)
export const completeRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const request = await prisma.request.findUnique({ where: { id: Number(id) } });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.userId !== userId) {
            return res.status(403).json({ message: 'Only requester can complete' });
        }

        if (request.status !== 'IN_PROGRESS') {
            return res.status(400).json({ message: 'Request must be in progress' });
        }

        const updated = await prisma.request.update({
            where: { id: Number(id) },
            data: { status: 'COMPLETED' },
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel Request
export const cancelRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const request = await prisma.request.findUnique({ where: { id: Number(id) } });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.userId !== userId) {
            return res.status(403).json({ message: 'Only requester can cancel' });
        }

        if (request.status === 'COMPLETED' || request.status === 'CANCELED') {
            return res.status(400).json({ message: 'Cannot cancel this request' });
        }

        const updated = await prisma.request.update({
            where: { id: Number(id) },
            data: { status: 'CANCELED' },
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Get Nearby Requests
export const getNearbyRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { latitude, longitude, radius = 5 } = req.query;
        if (!latitude || !longitude) return res.status(400).json({ message: 'Latitude and longitude required' });
        const lat = Number(latitude), lng = Number(longitude), rad = Number(radius);
        const requests = await prisma.request.findMany({
            where: { status: 'OPEN', latitude: { not: null }, longitude: { not: null } },
            include: { user: { select: { id: true, name: true, profileImage: true } } },
        });
        const nearby = requests.filter(req => {
            if (req.latitude === null || req.longitude === null) return false;
            const distance = calculateDistance(lat, lng, req.latitude, req.longitude);
            return distance <= rad;
        });
        res.status(200).json(nearby);
    } catch (error) {
        console.error('Error in getRequests:', error);
        console.error((error as any).stack);
        res.status(500).json({ message: (error as any).message || 'Server error' });
    }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ADMIN: Get pending requests
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
    try {
        const requests = await prisma.request.findMany({
            where: { status: 'PENDING_DEPOSIT' },
            include: {
                user: {
                    select: { id: true, name: true, phone: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ADMIN: Approve request
export const approveRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const request = await prisma.request.findUnique({ where: { id: Number(id) } });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'PENDING_DEPOSIT') {
            return res.status(400).json({ message: 'Request is not in PENDING_DEPOSIT status' });
        }

        const updated = await prisma.request.update({
            where: { id: Number(id) },
            data: { status: 'OPEN' },
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ADMIN: Get dashboard statistics
export const getAdminStats = async (req: AuthRequest, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalRequests, pendingRequests, todayRequests, totalRevenue] = await Promise.all([
            prisma.request.count(),
            prisma.request.count({ where: { status: 'PENDING_DEPOSIT' } }),
            prisma.request.count({ where: { createdAt: { gte: today } } }),
            prisma.request.aggregate({
                _sum: { depositAmount: true },
                where: { status: { in: ['OPEN', 'IN_PROGRESS', 'COMPLETED'] } }
            })
        ]);

        res.status(200).json({
            total: totalRequests,
            pending: pendingRequests,
            today: todayRequests,
            revenue: totalRevenue._sum.depositAmount || 0,
            growth: 12.5 // Placeholder for growth percentage
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ADMIN: Bulk approve requests
export const bulkApproveRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { ids } = req.body; // Array of numeric IDs

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'IDs array is required' });
        }

        const result = await prisma.request.updateMany({
            where: {
                id: { in: ids.map(Number) },
                status: 'PENDING_DEPOSIT'
            },
            data: { status: 'OPEN' }
        });

        res.status(200).json({
            message: `${result.count} requests approved successfully`,
            count: result.count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
