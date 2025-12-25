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
import { getPendingReports, approveReport, rejectReport } from '../controllers/reportController';
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

// 🔍 Report (제보) Review Management
router.get('/reports/pending', getPendingReports);
router.post('/reports/:id/approve', approveReport);
router.post('/reports/:id/reject', rejectReport);

// 💬 CS Ticket Management
router.get('/tickets', getCsTickets);
router.patch('/tickets/:id', updateCsTicket);

export default router;
