"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTransactions = exports.verifyPayment = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../utils/prisma"));
// PortOne API Keys (Should be in .env)
const PORTONE_API_KEY = process.env.PORTONE_API_KEY || 'imp_apikey';
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || 'ekKoeW8RyKuT0zgaZsUtXXTLQ4AhPFW3ZGseDA6bkA5lamv9OqDMnxyeB9wqOsuO9W3Mx9YSJ4dTqJ3f';
// Verify Payment and Create Transaction
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { imp_uid, merchant_uid, requestId, amount, type } = req.body; // type: 'DEPOSIT' | 'REWARD'
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // 1. Get Access Token from PortOne
        const tokenResponse = yield axios_1.default.post('https://api.iamport.kr/users/getToken', {
            imp_key: PORTONE_API_KEY,
            imp_secret: PORTONE_API_SECRET,
        });
        const { access_token } = tokenResponse.data.response;
        // 2. Get Payment Data from PortOne
        const paymentResponse = yield axios_1.default.get(`https://api.iamport.kr/payments/${imp_uid}`, {
            headers: { Authorization: access_token },
        });
        const paymentData = paymentResponse.data.response;
        // 3. Verify Amount
        if (paymentData.amount !== amount) {
            return res.status(400).json({ message: 'Payment amount mismatch' });
        }
        // 4. Create Transaction Record
        const transaction = yield prisma_1.default.transaction.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
});
exports.verifyPayment = verifyPayment;
// Get User Transactions
const getMyTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const transactions = yield prisma_1.default.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { request: { select: { title: true } } },
        });
        res.status(200).json(transactions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getMyTransactions = getMyTransactions;
