import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
    console.error(`[Error] ${err.message}`);

    const statusMap: Record<string, number> = {
        'Email already registered': 409,
        'Invalid credentials': 401,
        'Account is disabled': 403,
        'Invalid or expired refresh token': 401,
        'Invalid refresh token': 401,
        'User not found': 404,
    };

    const status = statusMap[err.message] || 500;
    const message = status === 500 ? 'Internal server error' : err.message;

    res.status(status).json({ success: false, message });
}
