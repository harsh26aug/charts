export type NiftyStockRecord = {
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
};

export type PaginatedNiftyStockResponse = {
  items: NiftyStockRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type NiftyStockRow = {
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  sharesTraded: number;
  turnoverCr: number;
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

export type SensexStockRecord = {
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
};

export type PaginatedSensexStockResponse = {
  items: SensexStockRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type SensexStockRow = {
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
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
