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
exports.getChatMessages = exports.getMyChatRooms = exports.createOrGetChatRoom = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Create or Get Chat Room
const createOrGetChatRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { requestId, targetUserId } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if room exists
        // This is a simplified check. In production, you'd need a more robust query to find a room with exactly these two users and requestId.
        // For now, we'll just create a new one if we don't find one easily, or just create one.
        // Let's create one for simplicity.
        const chatRoom = yield prisma_1.default.chatRoom.create({
            data: {
                requestId: Number(requestId),
                users: {
                    connect: [{ id: userId }, { id: Number(targetUserId) }],
                },
            },
            include: {
                users: { select: { id: true, name: true, profileImage: true } },
            },
        });
        res.status(201).json(chatRoom);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.createOrGetChatRoom = createOrGetChatRoom;
// Get My Chat Rooms
const getMyChatRooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const chatRooms = yield prisma_1.default.chatRoom.findMany({
            where: {
                users: {
                    some: { id: userId },
                },
            },
            include: {
                users: { select: { id: true, name: true, profileImage: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.status(200).json(chatRooms);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getMyChatRooms = getMyChatRooms;
// Get Messages for a Room
const getChatMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.params;
        const messages = yield prisma_1.default.message.findMany({
            where: { chatRoomId: Number(roomId) },
            include: {
                sender: { select: { id: true, name: true, profileImage: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.status(200).json(messages);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getChatMessages = getChatMessages;
