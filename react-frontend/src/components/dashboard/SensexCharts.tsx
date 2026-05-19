import { DoubleLeftOutlined, DoubleRightOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { getSensexStockHistory } from '../../services/stocks';
import type { SensexStockRecord } from '../../types/stock';
import { CalendarEchart } from './CalendarEchart';
import type { ChartSlot } from './types';
import { toIsoDate } from './stock-utils';

const CHART_COUNT = 4;

const createDefaultSlots = (): ChartSlot<SensexStockRecord>[] => {
  const now = new Date();
  return Array.from({ length: CHART_COUNT }, (_, index) => {
    const offset = CHART_COUNT - index - 1;
    return {
      month: new Date(now.getFullYear(), now.getMonth() - offset, 1),
      data: [],
      isLoading: false,
    };
  });
};

export const SensexCharts = () => {
  const [charts, setCharts] = useState<ChartSlot<SensexStockRecord>[]>(createDefaultSlots);

  useEffect(() => {
    charts.forEach((chart, index) => {
      void fetchMonthData(index, chart.month);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMonthData = async (index: number, month: Date) => {
    setCharts((prev) => prev.map((slot, i) => (i === index ? { ...slot, isLoading: true } : slot)));
    try {
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const res = await getSensexStockHistory({
        page: 1,
        limit: 31,
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      });
      setCharts((prev) =>
        prev.map((slot, i) =>
          i === index ? { ...slot, month, data: res.data.data, isLoading: false } : slot,
        ),
      );
    } catch {
      setCharts((prev) => prev.map((slot, i) => (i === index ? { ...slot, isLoading: false } : slot)));
    }
  };

  const changeMonth = (index: number, delta: number) => {
    const current = charts[index].month;
    const nextDate = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    void fetchMonthData(index, nextDate);
  };

  const changeYear = (index: number, delta: number) => {
    const current = charts[index].month;
    let nextDate = new Date(current.getFullYear() + delta, current.getMonth(), 1);
    const now = new Date();
    if (nextDate.getFullYear() === now.getFullYear() && nextDate.getMonth() > now.getMonth()) {
      nextDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    void fetchMonthData(index, nextDate);
  };

  const isNextMonthDisabled = (date: Date): boolean => {
    const now = new Date();
    return (
      date.getFullYear() > now.getFullYear() ||
      (date.getFullYear() === now.getFullYear() && date.getMonth() >= now.getMonth())
    );
  };

  const isNextYearDisabled = (date: Date): boolean => {
    const now = new Date();
    const nextDate = new Date(date.getFullYear() + 1, date.getMonth(), 1);
    return (
      nextDate.getFullYear() > now.getFullYear() ||
      (nextDate.getFullYear() === now.getFullYear() && nextDate.getMonth() > now.getMonth())
    );
  };

  return (
    <div className="nifty-charts-card">
      <div className="nifty-charts-grid">
        {charts.map((chart, index) => (
          <div className="chart-slot" key={`${chart.month.toISOString()}-${index}`}>
            <div className="chart-slot-header">
              <Button
                type="text"
                size="small"
                onClick={() => changeYear(index, -1)}
                className="month-nav-btn"
                icon={<DoubleLeftOutlined />}
              />
              <Button
                type="text"
                size="small"
                onClick={() => changeMonth(index, -1)}
                className="month-nav-btn"
                icon={<LeftOutlined />}
              />
              <DatePicker
                picker="month"
                value={dayjs(chart.month)}
                onChange={(value) => {
                  if (!value) {
                    return;
                  }
                  void fetchMonthData(index, value.toDate());
                }}
                disabledDate={(current) => current.isAfter(dayjs(), 'day')}
                allowClear={false}
                className="month-picker"
              />
              <Button
                type="text"
                size="small"
                onClick={() => changeMonth(index, 1)}
                disabled={isNextMonthDisabled(chart.month)}
                className="month-nav-btn"
                icon={<RightOutlined />}
              />
              <Button
                type="text"
                size="small"
                onClick={() => changeYear(index, 1)}
                disabled={isNextYearDisabled(chart.month)}
                className="month-nav-btn"
                icon={<DoubleRightOutlined />}
              />
            </div>
            <CalendarEchart
              data={chart.data}
              month={chart.month}
              isLoading={chart.isLoading}
              market="sensex"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
