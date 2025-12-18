import { Router } from 'express';
import {
    getAdminRequests,
    getAdminTransactions,
    refundTransaction,
    getIdentityQueue,
    verifyUserIdentity,
    getCsTickets,
    updateCsTicket,
    bulkDeleteRequests
} from '../controllers/adminSuiteController';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Apply admin protection to all routes in this suite
router.use(authenticateToken, isAdmin);

// 📦 Registration Management
router.get('/requests', getAdminRequests);
router.delete('/requests/bulk', bulkDeleteRequests);

// 💳 Payment & Refund Management
router.get('/transactions', getAdminTransactions);
router.post('/transactions/:id/refund', refundTransaction);

// 🛡️ Approval & Identity Management
router.get('/identities', getIdentityQueue);
router.post('/identities/verify', verifyUserIdentity);

// 💬 CS Ticket Management
router.get('/tickets', getCsTickets);
router.patch('/tickets/:id', updateCsTicket);

export default router;
