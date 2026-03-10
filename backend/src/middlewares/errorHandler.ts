import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
    success: false;
    message: string;
    error?: string;
    stack?: string;
}

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    const errorResponse: ErrorResponse = {
        success: false,
        message,
    };

    // Development 환경에서만 상세 에러 정보 노출
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error = err.toString();
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'AppError';
    }
}
