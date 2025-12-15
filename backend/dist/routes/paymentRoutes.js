"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/verify', authMiddleware_1.authenticateToken, paymentController_1.verifyPayment);
router.get('/me', authMiddleware_1.authenticateToken, paymentController_1.getMyTransactions);
exports.default = router;
