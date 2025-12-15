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
exports.setupChatSocket = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const setupChatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        // Join a chat room
        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
        });
        // Send a message
        socket.on('send_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const { roomId, senderId, content } = data;
            try {
                // Save message to DB
                const message = yield prisma_1.default.message.create({
                    data: {
                        chatRoomId: Number(roomId),
                        senderId,
                        content,
                    },
                    include: {
                        sender: { select: { id: true, name: true, profileImage: true } },
                    },
                });
                // Broadcast message to room
                io.to(roomId).emit('receive_message', message);
            }
            catch (error) {
                console.error('Error sending message:', error);
            }
        }));
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
exports.setupChatSocket = setupChatSocket;
