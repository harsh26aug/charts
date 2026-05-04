import { Router, Request, Response, NextFunction } from 'express';
import { authController } from "@controllers/auth.controller";
import { validateDto } from "@middleware/validate.middleware";
import { authenticate } from "@middleware/auth.middleware";
import { RegisterDto, LoginDto, RefreshTokenDto } from "@dto/auth.dto";

const router = Router();

const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
        (req: Request, res: Response, next: NextFunction) =>
            fn(req, res, next).catch(next);

// POST /api/auth/register
router.post(
  "/register",
  validateDto(RegisterDto),
  asyncHandler(authController.register),
);

// POST /api/auth/login
router.post(
  "/login",
  validateDto(LoginDto),
  asyncHandler(authController.login),
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  validateDto(RefreshTokenDto),
  asyncHandler(authController.refresh),
);

// POST /api/auth/logout
router.post(
  "/logout",
  validateDto(RefreshTokenDto),
  asyncHandler(authController.logout),
);

// POST /api/auth/logout-all  (requires authentication)
router.post(
  "/logout-all",
  authenticate,
  asyncHandler(authController.logoutAll),
);

// GET /api/auth/me
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
