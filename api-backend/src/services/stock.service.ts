import { AppDataSource } from '@root/data-source';
import { NiftyStockPrice } from '@entities/NiftyStockPrice';
import { NiftyStockPriceDiff } from '@entities/NiftyStockPriceDiff';
import { SensexStockPrice } from "@entities/SensexStockPrice";
import { SensexStockPriceDiff } from "@entities/SensexStockPriceDiff";
import { StockPaginationQueryDto } from "@dto/stock.dto";
import {
  NiftyStockRow,
  PaginatedNiftyStockResponse,
  SensexStockRow,
  PaginatedSensexStockResponse,
} from "@config/stock.type";

export class StockService {
  private stockPriceRepo = AppDataSource.getRepository(NiftyStockPrice);
  private sensexPriceRepo = AppDataSource.getRepository(SensexStockPrice);

  async getNiftyStockHistory(
    query: StockPaginationQueryDto,
  ): Promise<PaginatedNiftyStockResponse> {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const queryBuilder = this.stockPriceRepo
      .createQueryBuilder("price")
      .leftJoin(
        NiftyStockPriceDiff,
        "diff",
        "diff.trade_date = price.trade_date",
      )
      .select([
        'price.trade_date AS "tradeDate"',
        'price.open AS "open"',
        'price.high AS "high"',
        'price.low AS "low"',
        'price.close AS "close"',
        'price.shares_traded AS "sharesTraded"',
        'price.turnover_cr AS "turnoverCr"',
        'diff.open_diff AS "openDiff"',
        'diff.high_diff AS "highDiff"',
        'diff.low_diff AS "lowDiff"',
        'diff.close_diff AS "closeDiff"',
        'diff.shares_traded_diff AS "sharesTradedDiff"',
        'diff.turnover_cr_diff AS "turnoverCrDiff"',
        'diff.open_diff_pct AS "openDiffPct"',
        'diff.high_diff_pct AS "highDiffPct"',
        'diff.low_diff_pct AS "lowDiffPct"',
        'diff.close_diff_pct AS "closeDiffPct"',
        'diff.shares_traded_diff_pct AS "sharesTradedDiffPct"',
        'diff.turnover_cr_diff_pct AS "turnoverCrDiffPct"',
      ])
      .orderBy("price.trade_date", "DESC")
      .offset(offset)
      .limit(limit);

    if (query.startDate) {
      queryBuilder.andWhere("price.trade_date >= :startDate", {
        startDate: query.startDate,
      });
    }
    if (query.endDate) {
      queryBuilder.andWhere("price.trade_date <= :endDate", {
        endDate: query.endDate,
      });
    }

    const countBuilder = this.stockPriceRepo.createQueryBuilder("price");
    if (query.startDate) {
      countBuilder.andWhere("price.trade_date >= :startDate", {
        startDate: query.startDate,
      });
    }
    if (query.endDate) {
      countBuilder.andWhere("price.trade_date <= :endDate", {
        endDate: query.endDate,
      });
    }

    const [rows, total] = await Promise.all([
      queryBuilder.getRawMany<NiftyStockRow>(),
      countBuilder.getCount(),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items: rows.map((row) => ({
        tradeDate: row.tradeDate,
        price: {
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          sharesTraded: row.sharesTraded,
          turnoverCr: row.turnoverCr,
        },
        diff: {
          openDiff: row.openDiff,
          highDiff: row.highDiff,
          lowDiff: row.lowDiff,
          closeDiff: row.closeDiff,
          sharesTradedDiff: row.sharesTradedDiff,
          turnoverCrDiff: row.turnoverCrDiff,
          openDiffPct: row.openDiffPct,
          highDiffPct: row.highDiffPct,
          lowDiffPct: row.lowDiffPct,
          closeDiffPct: row.closeDiffPct,
          sharesTradedDiffPct: row.sharesTradedDiffPct,
          turnoverCrDiffPct: row.turnoverCrDiffPct,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: totalPages > 0 && page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getSensexStockHistory(
    query: StockPaginationQueryDto,
  ): Promise<PaginatedSensexStockResponse> {
    const page = query.page;
    const limit = query.limit;
    const offset = (page - 1) * limit;

    const queryBuilder = this.sensexPriceRepo
      .createQueryBuilder("price")
      .leftJoin(
        SensexStockPriceDiff,
        "diff",
        "diff.trade_date = price.trade_date",
      )
      .select([
        'price.trade_date AS "tradeDate"',
        'price.open AS "open"',
        'price.high AS "high"',
        'price.low AS "low"',
        'price.price AS "price"',
        'price.volume AS "volume"',
        'diff.open_diff AS "openDiff"',
        'diff.high_diff AS "highDiff"',
        'diff.low_diff AS "lowDiff"',
        'diff.price_diff AS "priceDiff"',
        'diff.volume_diff AS "volumeDiff"',
        'diff.open_diff_pct AS "openDiffPct"',
        'diff.high_diff_pct AS "highDiffPct"',
        'diff.low_diff_pct AS "lowDiffPct"',
        'diff.price_diff_pct AS "priceDiffPct"',
        'diff.volume_diff_pct AS "volumeDiffPct"',
      ])
      .orderBy("price.trade_date", "DESC")
      .offset(offset)
      .limit(limit);

    if (query.startDate) {
      queryBuilder.andWhere("price.trade_date >= :startDate", {
        startDate: query.startDate,
      });
    }
    if (query.endDate) {
      queryBuilder.andWhere("price.trade_date <= :endDate", {
        endDate: query.endDate,
      });
    }

    const countBuilder = this.sensexPriceRepo.createQueryBuilder("price");
    if (query.startDate) {
      countBuilder.andWhere("price.trade_date >= :startDate", {
        startDate: query.startDate,
      });
    }
    if (query.endDate) {
      countBuilder.andWhere("price.trade_date <= :endDate", {
        endDate: query.endDate,
      });
    }

    const [rows, total] = await Promise.all([
      queryBuilder.getRawMany<SensexStockRow>(),
      countBuilder.getCount(),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items: rows.map((row) => ({
        tradeDate: row.tradeDate,
        price: {
          open: row.open,
          high: row.high,
          low: row.low,
          price: row.price,
          volume: row.volume,
        },
        diff: {
          openDiff: row.openDiff,
          highDiff: row.highDiff,
          lowDiff: row.lowDiff,
          priceDiff: row.priceDiff,
          volumeDiff: row.volumeDiff,
          openDiffPct: row.openDiffPct,
          highDiffPct: row.highDiffPct,
          lowDiffPct: row.lowDiffPct,
          priceDiffPct: row.priceDiffPct,
          volumeDiffPct: row.volumeDiffPct,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: totalPages > 0 && page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
