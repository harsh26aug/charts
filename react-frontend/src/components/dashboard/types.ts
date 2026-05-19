import type { NiftyStockRecord, SensexStockRecord } from '../../types/stock';

export interface ChartSlot<T> {
  month: Date;
  data: T[];
  isLoading: boolean;
}

export type MarketType = 'nifty' | 'sensex';
export type MarketRecord = NiftyStockRecord | SensexStockRecord;
