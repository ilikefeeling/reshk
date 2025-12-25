import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        role: string;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = user as { userId: number; role: string };
        next();
    });
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'CS_MANAGER', 'FINANCE_LEAD'];
    if (!req.user || !adminRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};
