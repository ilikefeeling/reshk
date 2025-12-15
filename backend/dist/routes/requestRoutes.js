"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requestController_1 = require("../controllers/requestController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authenticateToken, requestController_1.createRequest);
router.get('/', requestController_1.getRequests); // Publicly accessible list? Or authenticated? Let's make it public for now, or auth optional if needed. For now, open.
router.get('/:id', requestController_1.getRequestById);
exports.default = router;
