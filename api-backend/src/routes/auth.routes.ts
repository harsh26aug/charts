import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { validateDto } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';

const router = Router();
const authService = new AuthService();

const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
        (req: Request, res: Response, next: NextFunction) =>
            fn(req, res, next).catch(next);

// POST /api/auth/register
router.post(
    '/register',
    validateDto(RegisterDto),
    asyncHandler(async (req, res) => {
        const result = await authService.register(req.body);
        res.status(201).json({ success: true, data: result });
    }),
);

// POST /api/auth/login
router.post(
    '/login',
    validateDto(LoginDto),
    asyncHandler(async (req, res) => {
        const result = await authService.login(req.body);
        res.status(200).json({ success: true, data: result });
    }),
);

// POST /api/auth/refresh
router.post(
    '/refresh',
    validateDto(RefreshTokenDto),
    asyncHandler(async (req, res) => {
        const tokens = await authService.refreshTokens(req.body.refreshToken);
        res.status(200).json({ success: true, data: tokens });
    }),
);

// POST /api/auth/logout
router.post(
    '/logout',
    validateDto(RefreshTokenDto),
    asyncHandler(async (req, res) => {
        await authService.logout(req.body.refreshToken);
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    }),
);

// POST /api/auth/logout-all  (requires authentication)
router.post(
    '/logout-all',
    authenticate,
    asyncHandler(async (req, res) => {
        await authService.logoutAll(req.user!.sub);
        res.status(200).json({ success: true, message: 'Logged out from all devices' });
    }),
);

// GET /api/auth/me
router.get(
    '/me',
    authenticate,
    asyncHandler(async (req, res) => {
        const user = await authService.getProfile(req.user!.sub);
        res.status(200).json({ success: true, data: user });
    }),
);

export default router;
