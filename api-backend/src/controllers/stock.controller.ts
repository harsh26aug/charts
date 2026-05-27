import { Request, Response } from 'express';
import { StockService } from '@services/stock.service';
import { StockPaginationQueryDto } from '@dto/stock.dto';
import { getValidatedQuery } from '@middleware/validate.middleware';

export class StockController {
    private stockService = new StockService();

    getNiftyStockHistory = async (
      _req: Request,
      res: Response,
    ): Promise<void> => {
      const result = await this.stockService.getNiftyStockHistory(
        getValidatedQuery<StockPaginationQueryDto>(res),
      );

      res
        .status(200)
        .json({
          success: true,
          data: result.items,
          pagination: result.pagination,
        });
    };

    getSensexStockHistory = async (
      _req: Request,
      res: Response,
    ): Promise<void> => {
      const result = await this.stockService.getSensexStockHistory(
        getValidatedQuery<StockPaginationQueryDto>(res),
      );

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    };

    getNiftyStockHistoryElastic = async (
      _req: Request,
      res: Response,
    ): Promise<void> => {
      const result = await this.stockService.getNiftyStockHistoryElastic(
        getValidatedQuery<StockPaginationQueryDto>(res),
      );

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    };

    getSensexStockHistoryElastic = async (
      _req: Request,
      res: Response,
    ): Promise<void> => {
      const result = await this.stockService.getSensexStockHistoryElastic(
        getValidatedQuery<StockPaginationQueryDto>(res),
      );

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    };
}

export const stockController = new StockController();
