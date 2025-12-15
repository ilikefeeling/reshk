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
exports.getRequestById = exports.getRequests = exports.createRequest = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Create a new request
const createRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { category, title, description, rewardAmount, depositAmount, location, images } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const request = yield prisma_1.default.request.create({
            data: {
                userId,
                category,
                title,
                description,
                rewardAmount,
                depositAmount,
                location,
                images: images || [],
            },
        });
        res.status(201).json(request);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createRequest = createRequest;
// Get all requests (with optional filtering)
const getRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category } = req.query;
        const whereClause = {
            status: 'OPEN'
        };
        if (category) {
            whereClause.category = String(category);
        }
        const requests = yield prisma_1.default.request.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, profileImage: true },
                },
            },
        });
        res.status(200).json(requests);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getRequests = getRequests;
// Get a single request by ID
const getRequestById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const request = yield prisma_1.default.request.findUnique({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getRequestById = getRequestById;
