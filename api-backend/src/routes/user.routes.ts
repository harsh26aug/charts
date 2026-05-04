import { Router, Request, Response, NextFunction } from 'express';
import { userController } from "@controllers/user.controller";
import { authenticate, authorize } from "@middleware/auth.middleware";
import { validateDto } from "@middleware/validate.middleware";
import { UpdateProfileDto } from "@dto/auth.dto";
import { UserRole } from "@entities/User";

const router = Router();

const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
        (req: Request, res: Response, next: NextFunction) =>
            fn(req, res, next).catch(next);

// GET /api/users  (admin only)
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(userController.list),
);

// GET /api/users/:id  (self or admin)
router.get("/:id", authenticate, asyncHandler(userController.getById));

// PATCH /api/users/:id  (self or admin)
router.patch(
  "/:id",
  authenticate,
  validateDto(UpdateProfileDto),
  asyncHandler(userController.update),
);

// DELETE /api/users/:id  (admin only)
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(userController.delete),
);

export default router;
