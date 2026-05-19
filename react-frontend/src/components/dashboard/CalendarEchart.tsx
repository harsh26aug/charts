import { useMemo } from 'react';
import { Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { MarketType } from './types';
import type { NiftyStockRecord, SensexStockRecord } from '../../types/stock';
import { buildCalendarOptions } from './calendar-options';

interface CalendarEchartProps {
  data: NiftyStockRecord[] | SensexStockRecord[];
  month: Date | null;
  isLoading: boolean;
  market: MarketType;
}

export const CalendarEchart = ({ data, month, isLoading, market }: CalendarEchartProps) => {
  const chartOptions = useMemo(() => {
    if (!month) {
      return {};
    }
    return buildCalendarOptions(data, month, market);
  }, [data, market, month]);

  return (
    <div className="calendar-chart-wrapper">
      <Spin spinning={isLoading}>
        {data.length > 0 ? (
          <ReactECharts option={chartOptions} className="calendar-echart" />
        ) : (
          <div className="calendar-echart calendar-echart--empty">
            <span className="empty-text">No data available for this period.</span>
          </div>
        )}
      </Spin>
    </div>
  );
};
