import { Router, Request, Response, NextFunction } from 'express';
import { stockController } from '@controllers/stock.controller';
import { validateQueryDto } from '@middleware/validate.middleware';
import { StockPaginationQueryDto } from '@dto/stock.dto';

const router = Router();

const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
        (req: Request, res: Response, next: NextFunction) =>
            fn(req, res, next).catch(next);

router.get(
    '/nifty50',
    validateQueryDto(StockPaginationQueryDto),
    asyncHandler(stockController.getNiftyStockHistory),
);

export default router;
