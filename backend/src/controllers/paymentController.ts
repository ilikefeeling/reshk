import { Response } from 'express';
import axios from 'axios';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

// PortOne API Keys (Should be in .env)
const PORTONE_API_KEY = process.env.PORTONE_API_KEY || 'imp_apikey';
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || 'ekKoeW8RyKuT0zgaZsUtXXTLQ4AhPFW3ZGseDA6bkA5lamv9OqDMnxyeB9wqOsuO9W3Mx9YSJ4dTqJ3f';

// Verify Payment and Create Transaction
export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { imp_uid, merchant_uid, requestId, amount, type } = req.body; // type: 'DEPOSIT' | 'REWARD'
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // 1. Get Access Token from PortOne
        const tokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
            imp_key: PORTONE_API_KEY,
            imp_secret: PORTONE_API_SECRET,
        });
        const { access_token } = tokenResponse.data.response;

        // 2. Get Payment Data from PortOne
        const paymentResponse = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
            headers: { Authorization: access_token },
        });
        const paymentData = paymentResponse.data.response;

        // 3. Verify Amount
        if (paymentData.amount !== amount) {
            return res.status(400).json({ message: 'Payment amount mismatch' });
        }

        // 4. Create Transaction Record
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                requestId: requestId ? Number(requestId) : null,
                amount,
                type,
                status: 'COMPLETED',
            },
        });

        // 5. Update Request Status if it's a Deposit
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
