import { api } from './http';
import type {
  PaginatedNiftyStockResponse,
  PaginatedSensexStockResponse,
  StockQueryParams,
} from '../types/stock';

export const getNiftyStockHistory = (params: StockQueryParams) => {
  return api.get<PaginatedNiftyStockResponse>('/stocks/nifty50', { params });
};

export const getSensexStockHistory = (params: StockQueryParams) => {
  return api.get<PaginatedSensexStockResponse>('/stocks/sensex', { params });
};
