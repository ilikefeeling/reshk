import { Server, Socket } from 'socket.io';
import prisma from '../utils/prisma';

export const setupChatSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        // Join a chat room
        socket.on('join_room', (roomId: string) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
        });

        // Send a message
        socket.on('send_message', async (data: { roomId: string; senderId: number; content: string }) => {
            const { roomId, senderId, content } = data;

            try {
                // Save message to DB
                const message = await prisma.message.create({
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
            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
