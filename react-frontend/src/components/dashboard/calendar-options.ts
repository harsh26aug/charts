import type { EChartsOption } from 'echarts';
import type { MarketType } from './types';
import type { NiftyStockRecord, SensexStockRecord } from '../../types/stock';

const colors = {
  positive: '#059669',
  positiveBg: 'rgba(5, 150, 105, 0.10)',
  positiveBorder: 'rgba(5, 150, 105, 0.30)',
  negative: '#dc2626',
  negativeBg: 'rgba(220, 38, 38, 0.08)',
  negativeBorder: 'rgba(220, 38, 38, 0.25)',
  cellBg: '#ffffff',
  cellBorder: '#cbd5e1',
  cellBgEmpty: '#f8fafc',
  cellBorderEmpty: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  tooltipHeader: '#f1f5f9',
  tooltipBorder: '#cbd5e1',
  axisLabel: '#475569',
};

type SeriesValue = [
  number,
  number,
  string,
  number,
  number,
  number,
  number,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
];

export const buildCalendarOptions = (
  data: NiftyStockRecord[] | SensexStockRecord[],
  monthDate: Date,
  market: MarketType,
): EChartsOption => {
  const year = monthDate.getFullYear();
  const mon = monthDate.getMonth();

  const firstDayOfMonth = new Date(year, mon, 1).getDay();
  const firstDayIdx = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const numDaysInMonth = new Date(year, mon + 1, 0).getDate();

  const backgroundData: Array<[number, number, string]> = [];
  for (let d = 1; d <= numDaysInMonth; d += 1) {
    const dObj = new Date(year, mon, d);
    const dayOfWeek = dObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    const offset = d - 1 + firstDayIdx;
    const weekIndex = Math.floor(offset / 7);
    const xIndex = dayOfWeek - 1;
    const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    backgroundData.push([xIndex, weekIndex, dateStr]);
  }

  const seriesData = data
    .map((record) => {
      const dateObj = new Date(record.tradeDate);
      if (dateObj.getMonth() !== mon || dateObj.getFullYear() !== year) {
        return null;
      }

      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return null;
      }

      const d = dateObj.getDate();
      const offset = d - 1 + firstDayIdx;
      const weekIndex = Math.floor(offset / 7);
      const xIndex = dayOfWeek - 1;
      const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      if (market === 'nifty') {
        const nifty = record as NiftyStockRecord;
        return [
          xIndex,
          weekIndex,
          dateStr,
          nifty.price.open,
          nifty.price.high,
          nifty.price.low,
          nifty.price.close,
          nifty.diff.openDiff,
          nifty.diff.highDiff,
          nifty.diff.lowDiff,
          nifty.diff.closeDiff,
          nifty.diff.openDiffPct,
          nifty.diff.highDiffPct,
          nifty.diff.lowDiffPct,
          nifty.diff.closeDiffPct,
        ] as SeriesValue;
      }

      const sensex = record as SensexStockRecord;
      return [
        xIndex,
        weekIndex,
        dateStr,
        sensex.price.open,
        sensex.price.high,
        sensex.price.low,
        sensex.price.price,
        sensex.diff.openDiff,
        sensex.diff.highDiff,
        sensex.diff.lowDiff,
        sensex.diff.priceDiff,
        sensex.diff.openDiffPct,
        sensex.diff.highDiffPct,
        sensex.diff.lowDiffPct,
        sensex.diff.priceDiffPct,
      ] as SeriesValue;
    })
    .filter((item): item is SeriesValue => item !== null);

  const maxWeekIndex =
    backgroundData.length > 0 ? Math.max(...backgroundData.map((item) => item[1])) : 4;
  const yAxisCategories = Array.from({ length: maxWeekIndex + 1 }, (_, i) => `W${i + 1}`);

  const renderBackgroundItem = (_params: any, api: any) => {
    const [cellWidth, cellHeight] = api.size([1, 1]);
    const gap = 4;
    const w = cellWidth - gap;
    const h = cellHeight - gap;
    const [cx, cy] = api.coord([api.value(0), api.value(1)]);
    const x = cx - cellWidth / 2 + gap / 2;
    const y = cy - cellHeight / 2 + gap / 2;

    const dateStr = api.value(2) as string;
    const dayNum = parseInt(dateStr.split('-')[2], 10).toString();

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          shape: { x, y, width: w, height: h, r: 7 },
          style: {
            fill: colors.cellBgEmpty,
            stroke: colors.cellBorderEmpty,
            lineWidth: 1,
          },
        },
        {
          type: 'text',
          style: {
            x: x + 6,
            y: y + 5,
            text: dayNum,
            fill: colors.textFaint,
            fontSize: 10,
            fontWeight: 500,
            textAlign: 'left',
            textVerticalAlign: 'top',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },
      ],
    };
  };

  const renderDataItem = (_params: any, api: any) => {
    const [cellWidth, cellHeight] = api.size([1, 1]);
    const gap = 4;
    const w = cellWidth - gap;
    const h = cellHeight - gap;
    const [cx, cy] = api.coord([api.value(0), api.value(1)]);
    const x = cx - cellWidth / 2 + gap / 2;
    const y = cy - cellHeight / 2 + gap / 2;

    const dateStr = api.value(2) as string;
    const dayNum = parseInt(dateStr.split('-')[2], 10).toString();
    const price = api.value(6) as number;
    const priceDiff = api.value(10) as number;
    const priceDiffPct = api.value(14) as number;
    const isPositive = priceDiff >= 0;

    const valueColor = isPositive ? colors.positive : colors.negative;
    const changeBg = isPositive ? colors.positiveBg : colors.negativeBg;
    const changeBorder = isPositive ? colors.positiveBorder : colors.negativeBorder;
    const cellBorder = isPositive ? colors.positiveBorder : colors.negativeBorder;

    const fmt = (value: number): string =>
      Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const changeSign = priceDiffPct >= 0 ? '+' : '';
    const changeText = `${changeSign}${priceDiffPct.toFixed(2)}%`;
    const badgeW = 50;
    const badgeH = 15;
    const priceY = y + h * 0.5;
    const badgeY = y + h * 0.7;

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          shape: { x, y, width: w, height: h, r: 7 },
          style: {
            fill: colors.cellBg,
            stroke: cellBorder,
            lineWidth: 1,
          },
        },
        {
          type: 'text',
          style: {
            x: x + 6,
            y: y + 5,
            text: dayNum,
            fill: colors.textMuted,
            fontSize: 10,
            fontWeight: 500,
            textAlign: 'left',
            textVerticalAlign: 'top',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },
        {
          type: 'text',
          style: {
            x: cx,
            y: priceY,
            text: fmt(price),
            fill: colors.textPrimary,
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },
        {
          type: 'rect',
          shape: {
            x: cx - badgeW / 2,
            y: badgeY,
            width: badgeW,
            height: badgeH,
            r: 4,
          },
          style: {
            fill: changeBg,
            stroke: changeBorder,
            lineWidth: 0.8,
          },
        },
        {
          type: 'text',
          style: {
            x: cx,
            y: badgeY + badgeH / 2,
            text: changeText,
            fill: valueColor,
            fontSize: 9,
            fontWeight: 600,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },
      ],
    };
  };

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      enterable: false,
      backgroundColor: '#ffffff',
      borderColor: colors.tooltipBorder,
      padding: 0,
      textStyle: { color: colors.textPrimary },
      extraCssText: [
        'box-shadow: 0 20px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08);',
        'border-radius: 12px;',
        `border: 1.5px solid ${colors.tooltipBorder};`,
        'overflow: hidden;',
      ].join(''),
      formatter: (params: any) => {
        if (!params?.value || params.value.length < 7) {
          return '';
        }

        const [
          _x,
          _y,
          date,
          open,
          high,
          low,
          price,
          openDiff,
          highDiff,
          lowDiff,
          priceDiff,
          openDiffPct,
          highDiffPct,
          lowDiffPct,
          priceDiffPct,
        ] = params.value as SeriesValue;

        const isPositive = (priceDiff ?? 0) >= 0;
        const valueColor = isPositive ? colors.positive : colors.negative;

        const fmt = (value: number) =>
          Number(value).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

        const diffBadge = (diff: number | null, pct: number | null) => {
          if (diff === null || pct === null) {
            return '';
          }
          const sign = diff >= 0 ? '+' : '';
          const color = diff >= 0 ? colors.positive : colors.negative;
          const bg = diff >= 0 ? colors.positiveBg : colors.negativeBg;
          return `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:500;padding:1px 5px;border-radius:4px;margin-left:5px;">${sign}${fmt(diff)} (${sign}${pct.toFixed(2)}%)</span>`;
        };

        const priceRow = (
          label: string,
          value: number,
          diff: number | null,
          pct: number | null,
          isBold = false,
          rowColor = colors.textSecondary,
        ) => `
          <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:${colors.textMuted};font-size:11px;font-weight:500;letter-spacing:0.03em;text-transform:uppercase;">${label}</span>
              <span style="color:${rowColor};font-size:12px;font-weight:${isBold ? '600' : '400'};">${fmt(value)}</span>
            </div>
            <div style="text-align:right;margin-top:2px;">${diffBadge(diff, pct)}</div>
          </div>`;

        return `
          <div style="min-width:200px;font-family:'DM Sans',system-ui,sans-serif;">
            <div style="background:${colors.tooltipHeader};padding:8px 12px;border-bottom:1px solid ${colors.tooltipBorder};">
              <div style="font-weight:600;color:${colors.textPrimary};font-size:13px;">${date}</div>
            </div>
            <div style="padding:10px 12px 4px;">
              ${priceRow('Open', open, openDiff, openDiffPct)}
              ${priceRow('High', high, highDiff, highDiffPct)}
              ${priceRow('Low', low, lowDiff, lowDiffPct)}
              <div style="height:1px;background:${colors.tooltipBorder};margin:4px 0 8px;"></div>
              ${priceRow(market === 'nifty' ? 'Close' : 'Price', price, priceDiff, priceDiffPct, true, valueColor)}
            </div>
          </div>`;
      },
    },
    grid: {
      top: 28,
      left: 0,
      right: 0,
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      position: 'top',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: colors.axisLabel,
        fontSize: 11,
        fontWeight: 600,
        margin: 10,
        fontFamily: 'DM Sans, system-ui, sans-serif',
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: yAxisCategories,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'custom',
        renderItem: renderBackgroundItem,
        data: backgroundData,
        silent: true,
      },
      {
        type: 'custom',
        renderItem: renderDataItem,
        data: seriesData,
      },
    ] as any,
  };

  return option;
};
