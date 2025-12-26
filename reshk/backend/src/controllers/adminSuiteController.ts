import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

/**
 * Audit Log Helper
 */
const createAuditLog = async (adminId: number, action: string, targetType: string, targetId: number, details: any = {}) => {
    return prisma.auditLog.create({
        data: {
            adminId,
            action,
            targetType,
            targetId,
            details
        }
    });
};

/**
 * Registration Management
 */
export const getAdminRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { status, category, keyword } = req.query;
        const where: any = {};

        // If status is provided, filter by it. 
        // If not (default), show all statuses to prevent items from "disappearing" after approval
        if (status && status !== 'ALL') {
            where.status = String(status);
        }

        if (category) where.category = String(category);
        if (keyword) {
            where.OR = [
                { title: { contains: String(keyword), mode: 'insensitive' } },
                { description: { contains: String(keyword), mode: 'insensitive' } }
            ];
        }

        const requests = await prisma.request.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Payment & Refund Management
 */
export const getAdminTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const { type, status } = req.query;
        const where: any = {};
        if (type) where.type = String(type);
        if (status) where.status = String(status);

        const transactions = await prisma.transaction.findMany({
            where,
            include: { user: { select: { id: true, name: true } }, request: { select: { title: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const refundTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.userId;
        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

        const tx = await prisma.transaction.findUnique({ where: { id: Number(id) } });
        if (!tx) return res.status(404).json({ message: 'Transaction not found' });

        const updated = await prisma.transaction.update({
            where: { id: Number(id) },
            data: { status: 'REFUNDED' }
        });

        await createAuditLog(adminId, 'REFUND_PAYMENT', 'Transaction', Number(id), { originalStatus: tx.status });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Approval & Identity Management
 */
export const getIdentityQueue = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            where: { identityStatus: 'PENDING' },
            select: { id: true, name: true, email: true, phone: true, createdAt: true }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const verifyUserIdentity = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, status } = req.body; // status: VERIFIED, REJECTED
        const adminId = req.user?.userId;
        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

        const updated = await prisma.user.update({
            where: { id: Number(userId) },
            data: { identityStatus: status }
        });

        await createAuditLog(adminId, 'VERIFY_USER', 'User', Number(userId), { newStatus: status });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * CS Ticket Management
 */
export const getCsTickets = async (req: AuthRequest, res: Response) => {
    try {
        const { status, priority } = req.query;
        const where: any = {};
        if (status) where.status = String(status);
        if (priority) where.priority = String(priority);

        const tickets = await prisma.csTicket.findMany({
            where,
            include: {
                user: { select: { id: true, name: true } },
                request: { select: { id: true, title: true } }
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
        });
        res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateCsTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, handlerId } = req.body;
        const adminId = req.user?.userId;
        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });

        const updated = await prisma.csTicket.update({
            where: { id: Number(id) },
            data: {
                status,
                ...(handlerId && { handlerId: Number(handlerId) })
            }
        });

        await createAuditLog(adminId, 'UPDATE_TICKET', 'CsTicket', Number(id), { newStatus: status });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Bulk Delete Requests
 */
export const bulkDeleteRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { ids } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const numericIds = ids.map(id => Number(id));

        // Delete with transaction to handle relations
        const result = await prisma.$transaction(async (tx) => {
            console.log('[BULK_DELETE_REQ] Step 1: Deleting Reviews...');
            await tx.review.deleteMany({
                where: { requestId: { in: numericIds } }
            });

            console.log('[BULK_DELETE_REQ] Step 2: Handling Reports...');
            const reports = await tx.report.findMany({
                where: { requestId: { in: numericIds } },
                select: { id: true }
            });
            const reportIds = reports.map(r => r.id);

            if (reportIds.length > 0) {
                console.log(`[BULK_DELETE_REQ] Nullifying report refs in Transactions for IDs: ${reportIds}`);
                await tx.transaction.updateMany({
                    where: { reportId: { in: reportIds } },
                    data: { reportId: null }
                });
                console.log('[BULK_DELETE_REQ] Deleting Reports...');
                await tx.report.deleteMany({
                    where: { id: { in: reportIds } }
                });
            }

            console.log('[BULK_DELETE_REQ] Step 3: Nullifying Request refs in Transactions...');
            await tx.transaction.updateMany({
                where: { requestId: { in: numericIds } },
                data: { requestId: null }
            });

            console.log('[BULK_DELETE_REQ] Step 4: Nullifying Request refs in CsTickets...');
            await tx.csTicket.updateMany({
                where: { requestId: { in: numericIds } },
                data: { requestId: null }
            });

            console.log('[BULK_DELETE_REQ] Step 5: Handling ChatRooms...');
            const chatRooms = await tx.chatRoom.findMany({
                where: { requestId: { in: numericIds } },
                select: { id: true }
            });
            const chatRoomIds = chatRooms.map(cr => cr.id);

            if (chatRoomIds.length > 0) {
                console.log(`[BULK_DELETE_REQ] Deleting Messages for Rooms: ${chatRoomIds}`);
                await tx.message.deleteMany({
                    where: { chatRoomId: { in: chatRoomIds } }
                });
                console.log('[BULK_DELETE_REQ] Deleting ChatRooms...');
                await tx.chatRoom.deleteMany({
                    where: { id: { in: chatRoomIds } }
                });
            }

            console.log('[BULK_DELETE_REQ] Step 6: Finally deleting Requests...');
            return await tx.request.deleteMany({
                where: { id: { in: numericIds } }
            });
        });

        // Log the action
        await createAuditLog(adminId, 'BULK_DELETE_REQUESTS', 'Request', 0, {
            deletedCount: result.count,
            ids: numericIds
        });

        res.status(200).json({ success: true, count: result.count });
    } catch (error: any) {
        console.error('Bulk delete requests error:', error);
        res.status(500).json({
            message: 'Server error',
            details: error.message,
            code: error.code
        });
    }
};

/**
 * Bulk Delete Reports
 */
export const bulkDeleteReports = async (req: AuthRequest, res: Response) => {
    try {
        const { ids } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const numericIds = ids.map(id => Number(id));

        const result = await prisma.$transaction(async (tx) => {
            // Nullify report references in Transactions
            await tx.transaction.updateMany({
                where: { reportId: { in: numericIds } },
                data: { reportId: null }
            });

            // Delete Reports
            return await tx.report.deleteMany({
                where: { id: { in: numericIds } }
            });
        });

        await createAuditLog(adminId, 'BULK_DELETE_REPORTS', 'Report', 0, {
            deletedCount: result.count,
            ids: numericIds
        });

        res.status(200).json({ success: true, count: result.count });
    } catch (error: any) {
        console.error('Bulk delete reports error:', error);
        res.status(500).json({
            message: 'Server error',
            details: error.message,
            code: error.code
        });
    }
};

/**
 * Bulk Approve Reports
 */
export const bulkApproveReports = async (req: AuthRequest, res: Response) => {
    try {
        const { ids } = req.body;
        const adminId = req.user?.userId;

        if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const numericIds = ids.map(id => Number(id));

        const result = await prisma.report.updateMany({
            where: {
                id: { in: numericIds },
                status: 'PENDING'
            },
            data: {
                status: 'ACCEPTED'
            }
        });

        await createAuditLog(adminId, 'BULK_APPROVE_REPORTS', 'Report', 0, {
            approvedCount: result.count,
            ids: numericIds
        });

        res.status(200).json({ success: true, count: result.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

