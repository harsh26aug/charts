import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import type { EChartsOption } from 'echarts';
import { NiftyStockRecord } from '@core/models/stock.models';

@Component({
  selector: 'app-calendar-echart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideEchartsCore({ echarts: () => import('echarts') })],
  imports: [NgxEchartsDirective, NzSpinModule],
  templateUrl: './calendar-echart.component.html',
  styleUrl: './calendar-echart.component.scss',
})
export class CalendarEchartComponent {
  readonly data = input<NiftyStockRecord[]>([]);
  readonly month = input<Date | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly chartOptions = computed<EChartsOption>(() => {
    const month = this.month();
    const data = this.data();
    if (!month) return {};
    return this.buildOptions(data, month);
  });

  // ─── Design Tokens ───────────────────────────────────────────────────────────
  private readonly colors = {
    positive:       '#059669',
    positiveBg:     'rgba(5, 150, 105, 0.10)',
    positiveBorder: 'rgba(5, 150, 105, 0.30)',

    negative:       '#dc2626',
    negativeBg:     'rgba(220, 38, 38, 0.08)',
    negativeBorder: 'rgba(220, 38, 38, 0.25)',

    cellBg:           '#ffffff',
    cellBorder:       '#cbd5e1',
    cellBgEmpty:      '#f8fafc',
    cellBorderEmpty:  '#e2e8f0',

    textPrimary:    '#0f172a',
    textSecondary:  '#334155',
    textMuted:      '#64748b',
    textFaint:      '#94a3b8',

    tooltipHeader:  '#f1f5f9',
    tooltipBorder:  '#cbd5e1',

    axisLabel:      '#475569',
  } as const;

  private buildOptions(data: NiftyStockRecord[], monthDate: Date): EChartsOption {
    const year = monthDate.getFullYear();
    const mon = monthDate.getMonth();

    const firstDayOfMonth = new Date(year, mon, 1).getDay();
    const firstDayIdx = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const numDaysInMonth = new Date(year, mon + 1, 0).getDate();

    const backgroundData: any[] = [];
    for (let d = 1; d <= numDaysInMonth; d++) {
      const dObj = new Date(year, mon, d);
      const dayOfWeek = dObj.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const offset = d - 1 + firstDayIdx;
      const weekIndex = Math.floor(offset / 7);
      const xIndex = dayOfWeek - 1;
      const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      backgroundData.push([xIndex, weekIndex, dateStr]);
    }

    const seriesData = data
      .map((record) => {
        const dateObj = new Date(record.tradeDate);
        if (dateObj.getMonth() !== mon || dateObj.getFullYear() !== year) return null;

        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return null;

        const d = dateObj.getDate();
        const offset = d - 1 + firstDayIdx;
        const weekIndex = Math.floor(offset / 7);
        const xIndex = dayOfWeek - 1;
        const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        return [
          xIndex, weekIndex, dateStr,
          record.price.open, record.price.high, record.price.low, record.price.close,
          record.diff.openDiff, record.diff.highDiff, record.diff.lowDiff, record.diff.closeDiff,
          record.diff.openDiffPct, record.diff.highDiffPct, record.diff.lowDiffPct, record.diff.closeDiffPct,
        ];
      })
      .filter(Boolean) as any[];

    const maxWeekIndex =
      backgroundData.length > 0
        ? Math.max(...backgroundData.map((item) => item[1] as number))
        : 4;
    const yAxisCategories = Array.from(
      { length: maxWeekIndex + 1 },
      (_, i) => `W${i + 1}`
    );

    return {
      tooltip: {
        trigger: 'item',
        enterable: false,
        backgroundColor: '#ffffff',
        borderColor: this.colors.tooltipBorder,
        padding: 0,
        textStyle: { color: this.colors.textPrimary },
        extraCssText: [
          'box-shadow: 0 20px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08);',
          'border-radius: 12px;',
          `border: 1.5px solid ${this.colors.tooltipBorder};`,
          'overflow: hidden;',
        ].join(''),
        formatter: (params: any) => {
          if (params.value.length < 7) return '';

          const [
            _x, _y, date,
            open, high, low, close,
            openDiff, highDiff, lowDiff, closeDiff,
            openDiffPct, highDiffPct, lowDiffPct, closeDiffPct,
          ] = params.value;

          const isPositive = closeDiff >= 0;
          const closeColor = isPositive ? this.colors.positive : this.colors.negative;

          const fmt = (v: number) =>
            Number(v).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

          const diffBadge = (diff: number | null, pct: number | null) => {
            if (diff === null || pct === null) return '';
            const sign = diff >= 0 ? '+' : '';
            const color = diff >= 0 ? this.colors.positive : this.colors.negative;
            const bg = diff >= 0 ? this.colors.positiveBg : this.colors.negativeBg;
            return `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:500;padding:1px 5px;border-radius:4px;margin-left:5px;">${sign}${fmt(diff)} (${sign}${pct.toFixed(2)}%)</span>`;
          };

          const priceRow = (
            label: string,
            val: number,
            diff: number | null,
            pct: number | null,
            isBold = false,
            color: string = this.colors.textSecondary
          ) => `
            <div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:${this.colors.textMuted};font-size:11px;font-weight:500;letter-spacing:0.03em;text-transform:uppercase;">${label}</span>
                <span style="color:${color};font-size:12px;font-weight:${isBold ? '600' : '400'};">${fmt(val)}</span>
              </div>
              <div style="text-align:right;margin-top:2px;">${diffBadge(diff, pct)}</div>
            </div>`;

          return `
            <div style="min-width:200px;font-family:'DM Sans',system-ui,sans-serif;">
              <div style="background:${this.colors.tooltipHeader};padding:8px 12px;border-bottom:1px solid ${this.colors.tooltipBorder};">
                <div style="font-weight:600;color:${this.colors.textPrimary};font-size:13px;">${date}</div>
              </div>
              <div style="padding:10px 12px 4px;">
                ${priceRow('Open',  open,  openDiff,  openDiffPct)}
                ${priceRow('High',  high,  highDiff,  highDiffPct)}
                ${priceRow('Low',   low,   lowDiff,   lowDiffPct)}
                <div style="height:1px;background:${this.colors.tooltipBorder};margin:4px 0 8px;"></div>
                ${priceRow('Close', close, closeDiff, closeDiffPct, true, closeColor)}
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
          color: this.colors.axisLabel,
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
          renderItem: this.renderBackgroundItem.bind(this),
          data: backgroundData,
          silent: true,
        },
        {
          type: 'custom',
          renderItem: this.renderDataItem.bind(this),
          data: seriesData,
        },
      ],
    };
  }

  // ─── Background (empty) cells ─────────────────────────────────────────────
  private renderBackgroundItem(params: any, api: any): any {
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
            fill: this.colors.cellBgEmpty,
            stroke: this.colors.cellBorderEmpty,
            lineWidth: 1,
          },
        },
        {
          type: 'text',
          style: {
            x: x + 6,
            y: y + 5,
            text: dayNum,
            fill: this.colors.textFaint,
            fontSize: 10,
            fontWeight: 500,
            textAlign: 'left',
            textVerticalAlign: 'top',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },
      ],
    };
  }

  // ─── Data cells ───────────────────────────────────────────────────────────
  private renderDataItem(params: any, api: any): any {
    const [cellWidth, cellHeight] = api.size([1, 1]);
    const gap = 4;
    const w = cellWidth - gap;
    const h = cellHeight - gap;
    const [cx, cy] = api.coord([api.value(0), api.value(1)]);
    const x = cx - cellWidth / 2 + gap / 2;
    const y = cy - cellHeight / 2 + gap / 2;

    const dateStr      = api.value(2) as string;
    const dayNum       = parseInt(dateStr.split('-')[2], 10).toString();
    const close        = api.value(6) as number;
    const closeDiff    = api.value(10) as number;
    const closeDiffPct = api.value(14) as number;

    const isPositive = closeDiff >= 0;

    const closeColor   = isPositive ? this.colors.positive       : this.colors.negative;
    const changeBg     = isPositive ? this.colors.positiveBg     : this.colors.negativeBg;
    const changeBorder = isPositive ? this.colors.positiveBorder : this.colors.negativeBorder;
    const cellBorder   = isPositive ? this.colors.positiveBorder : this.colors.negativeBorder;

    const fmt = (v: number): string =>
      Number(v).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const changeSign = closeDiffPct >= 0 ? '+' : '';
    const changeText = `${changeSign}${closeDiffPct.toFixed(2)}%`;

    // Compact badge dimensions
    const badgeW = 50;
    const badgeH = 15;

    // Proportional vertical positions — works at any cell height
    const priceY = y + h * 0.50;   // close price at 50% height
    const badgeY = y + h * 0.70;   // badge at 70% height

    return {
      type: 'group',
      children: [
        // ── Cell background
        {
          type: 'rect',
          shape: { x, y, width: w, height: h, r: 7 },
          style: {
            fill: this.colors.cellBg,
            stroke: cellBorder,
            lineWidth: 1,
          },
        },

        // ── Day number — top-left
        {
          type: 'text',
          style: {
            x: x + 6,
            y: y + 5,
            text: dayNum,
            fill: this.colors.textMuted,
            fontSize: 10,
            fontWeight: 500,
            textAlign: 'left',
            textVerticalAlign: 'top',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },

        // ── Close price
        {
          type: 'text',
          style: {
            x: cx,
            y: priceY,
            text: fmt(close),
            fill: this.colors.textPrimary,
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },

        // ── % change badge background
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

        // ── % change text
        {
          type: 'text',
          style: {
            x: cx,
            y: badgeY + badgeH / 2,
            text: changeText,
            fill: closeColor,
            fontSize: 9,
            fontWeight: 600,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },
      ],
    };
  }
}
