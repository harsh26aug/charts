import type { DateRange } from '../../types/stock';

export const formatPrice = (value: number): string => {
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatQuantity = (value: number): string => {
  return Number(value).toLocaleString('en-IN');
};

export const formatDiff = (value: number | null): string => {
  if (value === null) {
    return '-';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(2)}`;
};

export const formatPct = (value: number | null): string => {
  if (value === null) {
    return '-';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(2)}%`;
};

export const getDiffClass = (value: number | null): string => {
  if (value === null || value === 0) {
    return 'neutral';
  }
  return value > 0 ? 'positive' : 'negative';
};

export const formatTradeDate = (tradeDate: string): string => {
  const date = parseTradeDate(tradeDate);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
};

export const toDateParams = (range: DateRange): { startDate?: string; endDate?: string } => {
  if (!range) {
    return {};
  }
  return {
    startDate: toIsoDate(range[0]),
    endDate: toIsoDate(range[1]),
  };
};

export const toIsoDate = (date: Date): string => date.toISOString().split('T')[0];

export const parseTradeDate = (tradeDate: string): Date => {
  if (tradeDate.length === 10) {
    return new Date(`${tradeDate}T00:00:00`);
  }
  return new Date(tradeDate);
};
