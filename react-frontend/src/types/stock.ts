export type DateRange = [Date, Date] | null;

export interface NiftyStockRecord {
  tradeDate: string;
  price: {
    open: number;
    high: number;
    low: number;
    close: number;
    sharesTraded: number;
    turnoverCr: number;
  };
  diff: {
    openDiff: number | null;
    highDiff: number | null;
    lowDiff: number | null;
    closeDiff: number | null;
    sharesTradedDiff: number | null;
    turnoverCrDiff: number | null;
    openDiffPct: number | null;
    highDiffPct: number | null;
    lowDiffPct: number | null;
    closeDiffPct: number | null;
    sharesTradedDiffPct: number | null;
    turnoverCrDiffPct: number | null;
  };
}

export interface SensexStockRecord {
  tradeDate: string;
  price: {
    open: number;
    high: number;
    low: number;
    price: number;
    volume: number;
  };
  diff: {
    openDiff: number | null;
    highDiff: number | null;
    lowDiff: number | null;
    priceDiff: number | null;
    volumeDiff: number | null;
    openDiffPct: number | null;
    highDiffPct: number | null;
    lowDiffPct: number | null;
    priceDiffPct: number | null;
    volumeDiffPct: number | null;
  };
}

export interface StockPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StockQueryParams {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedNiftyStockResponse {
  success: boolean;
  data: NiftyStockRecord[];
  pagination: StockPagination;
}

export interface PaginatedSensexStockResponse {
  success: boolean;
  data: SensexStockRecord[];
  pagination: StockPagination;
}
