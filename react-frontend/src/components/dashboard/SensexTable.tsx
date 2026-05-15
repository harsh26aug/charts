import { useEffect, useMemo, useState } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getSensexStockHistory } from '../../services/stocks';
import type { DateRange, SensexStockRecord, StockPagination } from '../../types/stock';
import {
  formatDiff,
  formatPct,
  formatPrice,
  formatQuantity,
  formatTradeDate,
  getDiffClass,
  parseTradeDate,
  toDateParams,
} from './stock-utils';

const TUESDAY_BATCH_START_DATE = new Date('2025-09-01T00:00:00');
const TUESDAY_DAY = 2;
const THURSDAY_DAY = 4;

interface SensexTableProps {
  dateRange: DateRange;
}

export const SensexTable = ({ dateRange }: SensexTableProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SensexStockRecord[]>([]);
  const [pagination, setPagination] = useState<StockPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDayFilters, setSelectedDayFilters] = useState<number[]>([]);

  useEffect(() => {
    void fetchData(1, pageSize, dateRange);
    setCurrentPage(1);
  }, [dateRange, pageSize]);

  const fetchData = async (page: number, limit: number, range: DateRange) => {
    setIsLoading(true);
    try {
      const res = await getSensexStockHistory({
        page,
        limit,
        ...toDateParams(range),
      });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (selectedDayFilters.length === 0) {
      return data;
    }
    return data.filter((record) => {
      const date = parseTradeDate(record.tradeDate);
      return selectedDayFilters.includes(date.getDay());
    });
  }, [data, selectedDayFilters]);

  const getBatchLabel = (tradeDate: string): string | null => {
    const date = parseTradeDate(tradeDate);
    const isTuesdayBatchDate = date < TUESDAY_BATCH_START_DATE;
    if (isTuesdayBatchDate) {
      return date.getDay() === TUESDAY_DAY ? 'Tuesday Batch' : null;
    }
    return date.getDay() === THURSDAY_DAY ? 'Thursday Batch' : null;
  };

  const toggleDayFilter = (day: number | null) => {
    if (day === null) {
      setSelectedDayFilters([]);
      return;
    }

    setSelectedDayFilters((prev) => {
      if (prev.includes(day)) {
        return prev.filter((value) => value !== day);
      }
      return [...prev, day];
    });
  };

  const columns: ColumnsType<SensexStockRecord> = [
    {
      title: 'Date',
      dataIndex: 'tradeDate',
      key: 'tradeDate',
      width: 110,
      fixed: 'left',
      render: (_, record) => {
        const batchLabel = getBatchLabel(record.tradeDate);
        return (
          <div className="date-cell">
            <div>{formatTradeDate(record.tradeDate)}</div>
            {batchLabel && <span className="batch-tag">{batchLabel}</span>}
          </div>
        );
      },
    },
    {
      title: 'Price',
      width: 160,
      key: 'price',
      render: (_, record) => (
        <>
          <div className={`cell-main ${getDiffClass(record.diff.priceDiff)}`}>
            {formatPrice(record.price.price)}
          </div>
          <div className={`cell-diff ${getDiffClass(record.diff.priceDiff)}`}>
            {formatDiff(record.diff.priceDiff)}
            <span className="pct">&nbsp;({formatPct(record.diff.priceDiffPct)})</span>
          </div>
        </>
      ),
    },
    {
      title: 'Open',
      width: 160,
      key: 'open',
      render: (_, record) => (
        <>
          <div className="cell-main">{formatPrice(record.price.open)}</div>
          <div className={`cell-diff ${getDiffClass(record.diff.openDiff)}`}>
            {formatDiff(record.diff.openDiff)}
            <span className="pct">&nbsp;({formatPct(record.diff.openDiffPct)})</span>
          </div>
        </>
      ),
    },
    {
      title: 'High',
      width: 160,
      key: 'high',
      render: (_, record) => (
        <>
          <div className="cell-main">{formatPrice(record.price.high)}</div>
          <div className={`cell-diff ${getDiffClass(record.diff.highDiff)}`}>
            {formatDiff(record.diff.highDiff)}
            <span className="pct">&nbsp;({formatPct(record.diff.highDiffPct)})</span>
          </div>
        </>
      ),
    },
    {
      title: 'Low',
      width: 160,
      key: 'low',
      render: (_, record) => (
        <>
          <div className="cell-main">{formatPrice(record.price.low)}</div>
          <div className={`cell-diff ${getDiffClass(record.diff.lowDiff)}`}>
            {formatDiff(record.diff.lowDiff)}
            <span className="pct">&nbsp;({formatPct(record.diff.lowDiffPct)})</span>
          </div>
        </>
      ),
    },
    {
      title: 'Volume',
      width: 160,
      key: 'volume',
      render: (_, record) => (
        <>
          <div className="cell-main">{formatQuantity(record.price.volume)}</div>
          <div className={`cell-diff ${getDiffClass(record.diff.volumeDiff)}`}>
            {formatDiff(record.diff.volumeDiff)}
            <span className="pct">&nbsp;({formatPct(record.diff.volumeDiffPct)})</span>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="nifty-card">
      <div className="nifty-card-header">
        <h3 className="nifty-card-title">Records</h3>
        <div className="nifty-header-actions">
          <div className="day-filters">
            <button
              className={selectedDayFilters.length === 0 ? 'active' : ''}
              onClick={() => toggleDayFilter(null)}
              type="button"
            >
              All
            </button>
            {[1, 2, 3, 4, 5].map((day, index) => (
              <button
                key={day}
                className={selectedDayFilters.includes(day) ? 'active' : ''}
                onClick={() => toggleDayFilter(day)}
                type="button"
              >
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="nifty-table-container">
        <Table<SensexStockRecord>
          rowKey={(record) => record.tradeDate}
          dataSource={filteredData}
          columns={columns}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize,
            total: pagination?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100, 200, 500],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
              void fetchData(page, size, dateRange);
            },
          }}
          scroll={{ x: 900, y: 'calc(100vh - 300px)' }}
          tableLayout="fixed"
        />
      </div>
    </div>
  );
};
