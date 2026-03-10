import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import iamportService from '../services/iamportService';

// Verify Payment and Create Transaction
export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { imp_uid, merchant_uid, requestId, amount, type } = req.body; // type: 'DEPOSIT' | 'REWARD'
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // 1. 결제 정보 조회 및 금액 검증
        const isValid = await iamportService.verifyPaymentAmount(imp_uid, Number(amount));

        if (!isValid) {
            return res.status(400).json({ message: 'Payment amount mismatch or invalid payment' });
        }

        // 2. Transaction 레코드 생성
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                requestId: requestId ? Number(requestId) : null,
                amount,
                type,
                status: 'COMPLETED',
                imp_uid,
                merchant_uid,
            },
        });

        // 3. Update Request Status if it's a Deposit
        if (type === 'DEPOSIT' && requestId) {
            // Logic to update request status or deposit amount could go here
            // For now, just recording the transaction
        }

        res.status(201).json({ success: true, transaction });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};

// Get User Transactions
export const getMyTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { request: { select: { title: true } } },
        });

        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Refund Payment
export const refundPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { transactionId, reason } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Transaction 조회
        const transaction = await prisma.transaction.findUnique({
            where: { id: Number(transactionId) },
        });

        if (!transaction || transaction.userId !== userId) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Cannot refund this transaction' });
        }

        if (!transaction.imp_uid) {
            return res.status(400).json({ message: 'Payment UID not found' });
        }

        // PortOne 환불 요청
        await iamportService.cancelPayment(
            transaction.imp_uid,
            Number(transaction.amount),
            reason || '사용자 요청'
        );

        // Transaction 상태 업데이트
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'REFUNDED' },
        });

        res.status(200).json({ success: true, message: 'Refund successful' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Refund failed', error: error.message });
    }
};
