import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from "@types/auth.types";
import { UserRole } from "@entities/User";

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        res.status(401).json({ success: false, message: 'Access token required' });
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired access token' });
    }
}

export function authorize(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
            return;
        }

        next();
    };
}
