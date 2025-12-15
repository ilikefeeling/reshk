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
exports.updateReportStatus = exports.getReportsByRequestId = exports.createReport = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Create a new report
const createReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { requestId, description, images, location } = req.body;
        const reporterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!reporterId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Verify request exists
        const request = yield prisma_1.default.request.findUnique({ where: { id: Number(requestId) } });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        const report = yield prisma_1.default.report.create({
            data: {
                requestId: Number(requestId),
                reporterId,
                description,
                images: images || [],
                location,
            },
        });
        res.status(201).json(report);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createReport = createReport;
// Get reports for a specific request
const getReportsByRequestId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId } = req.params;
        const reports = yield prisma_1.default.report.findMany({
            where: { requestId: Number(requestId) },
            include: {
                reporter: {
                    select: { id: true, name: true, profileImage: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(reports);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getReportsByRequestId = getReportsByRequestId;
// Update report status (e.g., ACCEPTED, REJECTED) - Only Request Owner can do this
const updateReportStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACCEPTED', 'REJECTED'
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const report = yield prisma_1.default.report.findUnique({
            where: { id: Number(id) },
            include: { request: true },
        });
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        // Check if the user is the owner of the request
        if (report.request.userId !== userId) {
            return res.status(403).json({ message: 'Only the request owner can update report status' });
        }
        const updatedReport = yield prisma_1.default.report.update({
            where: { id: Number(id) },
            data: { status },
        });
        res.status(200).json(updatedReport);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateReportStatus = updateReportStatus;
