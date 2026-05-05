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
    // Positive (bullish) — vivid emerald
    positive:       '#059669',
    positiveBg:     'rgba(5, 150, 105, 0.12)',
    positiveBorder: 'rgba(5, 150, 105, 0.35)',

    // Negative (bearish) — vivid rose-red
    negative:       '#dc2626',
    negativeBg:     'rgba(220, 38, 38, 0.10)',
    negativeBorder: 'rgba(220, 38, 38, 0.30)',

    // Cell
    cellBg:           '#ffffff',
    cellBorder:       '#cbd5e1',     // slate-300 — crisp, visible
    cellBgEmpty:      '#f8fafc',     // slate-50
    cellBorderEmpty:  '#e2e8f0',     // slate-200

    // Text hierarchy
    textPrimary:    '#0f172a',       // slate-900
    textSecondary:  '#334155',       // slate-700
    textMuted:      '#64748b',       // slate-500
    textFaint:      '#94a3b8',       // slate-400

    // Tooltip
    tooltipHeader:  '#f1f5f9',       // slate-100
    tooltipBorder:  '#cbd5e1',

    // Axis labels
    axisLabel:      '#475569',       // slate-600
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
          xIndex,
          weekIndex,
          dateStr,
          record.price.open,
          record.price.high,
          record.price.low,
          record.price.close,
          record.diff.openDiff,
          record.diff.highDiff,
          record.diff.lowDiff,
          record.diff.closeDiff,
          record.diff.openDiffPct,
          record.diff.highDiffPct,
          record.diff.lowDiffPct,
          record.diff.closeDiffPct,
        ];
      })
      .filter(Boolean) as any[];

    const maxWeekIndex =
      backgroundData.length > 0
        ? Math.max(...backgroundData.map((item) => item[1] as number))
        : 4;
    const yAxisCategories = Array.from(
      { length: maxWeekIndex + 1 },
      (_, i) => `Week ${i + 1}`
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
          'border-radius: 14px;',
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
            return `
              <span style="
                display:inline-block;
                background:${bg};
                color:${color};
                font-size:11px;
                font-weight:500;
                padding:1px 6px;
                border-radius:5px;
                margin-left:6px;
                letter-spacing:0.01em;
              ">${sign}${fmt(diff)} (${sign}${pct.toFixed(2)}%)</span>`;
          };

          const priceRow = (
            label: string,
            val: number,
            diff: number | null,
            pct: number | null,
            isBold = false,
            color: string = this.colors.textSecondary
          ) => `
            <div style="margin-bottom:9px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:${this.colors.textMuted};font-size:12px;font-weight:500;letter-spacing:0.02em;">${label}</span>
                <span style="color:${color};font-size:13px;font-weight:${isBold ? '500' : '400'};">${fmt(val)}</span>
              </div>
              <div style="text-align:right;margin-top:1px;">
                ${diffBadge(diff, pct)}
              </div>
            </div>`;

          return `
            <div style="min-width:210px;font-family:'DM Sans',system-ui,sans-serif;">
              <div style="
                background:${this.colors.tooltipHeader};
                padding:10px 14px;
                border-bottom:1.5px solid ${this.colors.tooltipBorder};
              ">
                <div style="font-weight:500;color:${this.colors.textPrimary};font-size:14px;letter-spacing:0.01em;">${date}</div>
              </div>
              <div style="padding:12px 14px 6px;">
                ${priceRow('Open',  open,  openDiff,  openDiffPct)}
                ${priceRow('High',  high,  highDiff,  highDiffPct)}
                ${priceRow('Low',   low,   lowDiff,   lowDiffPct)}
                <div style="height:1px;background:${this.colors.tooltipBorder};margin:6px 0 10px;"></div>
                ${priceRow('Close', close, closeDiff, closeDiffPct, true, closeColor)}
              </div>
            </div>`;
        },
      },

      grid: {
        top: 40,
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
          fontSize: 13,
          fontWeight: 500,
          margin: 16,
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
    const gap = 8;
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
          shape: { x, y, width: w, height: h, r: 10 },
          style: {
            fill: this.colors.cellBgEmpty,
            stroke: this.colors.cellBorderEmpty,
            lineWidth: 1.5,
          },
        },
        {
          type: 'text',
          style: {
            x: x + 10,
            y: y + 10,
            text: dayNum,
            fill: this.colors.textFaint,
            fontSize: 12,
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
    const gap = 8;
    const w = cellWidth - gap;
    const h = cellHeight - gap;
    const [cx, cy] = api.coord([api.value(0), api.value(1)]);
    const x = cx - cellWidth / 2 + gap / 2;
    const y = cy - cellHeight / 2 + gap / 2;

    const dateStr  = api.value(2) as string;
    const dayNum   = parseInt(dateStr.split('-')[2], 10).toString();
    const open     = api.value(3) as number;
    const close    = api.value(6) as number;
    const closeDiff    = api.value(10) as number;
    const closeDiffPct = api.value(14) as number;

    const isPositive = closeDiff >= 0;

    // Colors
    const closeColor    = isPositive ? this.colors.positive       : this.colors.negative;
    const changeBg      = isPositive ? this.colors.positiveBg     : this.colors.negativeBg;
    const changeBorder  = isPositive ? this.colors.positiveBorder : this.colors.negativeBorder;
    const cellBorder    = isPositive ? this.colors.positiveBorder : this.colors.negativeBorder;

    const fmt = (v: number): string =>
      Number(v).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const displayPct  = closeDiffPct;
    const changeSign  = displayPct >= 0 ? '+' : '';
    const changeText  = `${changeSign}${displayPct.toFixed(2)}%`;

    // Badge dimensions
    const badgeW = 64;
    const badgeH = 20;

    return {
      type: 'group',
      children: [
        // ── Cell background
        {
          type: 'rect',
          shape: { x, y, width: w, height: h, r: 10 },
          style: {
            fill: this.colors.cellBg,
            stroke: cellBorder,
            lineWidth: 1.5,
          },
        },

        // ── Day number (top-left)
        {
          type: 'text',
          style: {
            x: x + 10,
            y: y + 10,
            text: dayNum,
            fill: this.colors.textMuted,
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'left',
            textVerticalAlign: 'top',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },

        // ── Close price (center)
        {
          type: 'text',
          style: {
            x: cx,
            y: cy - 6,
            text: fmt(close),
            fill: this.colors.textPrimary,
            fontSize: 14,
            fontWeight: 500,
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
            y: cy + 10,
            width: badgeW,
            height: badgeH,
            r: 6,
          },
          style: {
            fill: changeBg,
            stroke: changeBorder,
            lineWidth: 1,
          },
        },

        // ── % change text
        {
          type: 'text',
          style: {
            x: cx,
            y: cy + 10 + badgeH / 2,
            text: changeText,
            fill: closeColor,
            fontSize: 11,
            fontWeight: 500,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          },
        },
      ],
    };
  }
}
