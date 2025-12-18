import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { setupChatSocket } from './sockets/chatSocket';

import authRoutes from './routes/authRoutes';
import requestRoutes from './routes/requestRoutes';
import reportRoutes from './routes/reportRoutes';
import paymentRoutes from './routes/paymentRoutes';
import uploadRoutes from './routes/uploadRoutes';
import chatRoutes from './routes/chatRoutes';
import adminSuiteRoutes from './routes/adminRoutes';
import { errorHandler } from './middlewares/errorHandler';

import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../custom.env');
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
    console.warn(`⚠️ Warning: Could not find custom.env at ${envPath}. Falling back to default .env or system env.`);
} else {
    console.log(`✅ Loaded environment from: ${envPath}`);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

setupChatSocket(io);

const port = process.env.PORT || 3002;

app.use(cors({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
        if (res.statusCode === 400) {
            console.log('  Query:', req.query);
            console.log('  Body:', req.body);
        }
    });
    next();
});

// Static files - 업로드된 이미지 제공
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin-suite', adminSuiteRoutes);

app.get('/', (req, res) => {
    res.send('Looking App API Server is running!');
});

// 에러 핸들러 (마지막에 등록)
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    server.listen(port, () => {
        console.log(`Server is running on http://0.0.0.0:${port}`);
    });
}

export { app, server };
export default app;
