import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../data-source';
import { User } from '../entities/User';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateDto } from '../middleware/validate.middleware';
import { UpdateProfileDto } from '../dto/auth.dto';
import { UserRole } from '../entities/User';

const router = Router();

const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
        (req: Request, res: Response, next: NextFunction) =>
            fn(req, res, next).catch(next);

// GET /api/users  (admin only)
router.get(
    '/',
    authenticate,
    authorize(UserRole.ADMIN),
    asyncHandler(async (req, res) => {
        const repo = AppDataSource.getRepository(User);
        const [users, total] = await repo.findAndCount({
            order: { createdAt: 'DESC' },
        });
        res.json({ success: true, data: users, total });
    }),
);

// GET /api/users/:id  (self or admin)
router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req, res) => {
        const id = req.params['id'] as string;

        if (req.user!.sub !== id && req.user!.role !== UserRole.ADMIN) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        const repo = AppDataSource.getRepository(User);
        const user = await repo.findOne({ where: { id } });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({ success: true, data: user });
    }),
);

// PATCH /api/users/:id  (self or admin)
router.patch(
    '/:id',
    authenticate,
    validateDto(UpdateProfileDto),
    asyncHandler(async (req, res) => {
        const id = req.params['id'] as string;

        if (req.user!.sub !== id && req.user!.role !== UserRole.ADMIN) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }

        const repo = AppDataSource.getRepository(User);
        const user = await repo.findOne({ where: { id } });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        Object.assign(user, req.body);
        await repo.save(user);

        res.json({ success: true, data: user });
    }),
);

// DELETE /api/users/:id  (admin only)
router.delete(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN),
    asyncHandler(async (req, res) => {
        const repo = AppDataSource.getRepository(User);
        const result = await repo.delete({ id: req.params['id'] as string });

        if (!result.affected) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.json({ success: true, message: 'User deleted' });
    }),
);

export default router;
