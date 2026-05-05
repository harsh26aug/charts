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

  private buildOptions(data: NiftyStockRecord[], monthDate: Date): EChartsOption {
    const year = monthDate.getFullYear();
    const mon = monthDate.getMonth();
    
    const firstDayOfMonth = new Date(year, mon, 1).getDay();
    const firstDayIdx = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const numDaysInMonth = new Date(year, mon + 1, 0).getDate();
    
    const backgroundData = [];
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
          record.diff.closeDiffPct
        ];
      })
      .filter(Boolean) as any[];

    const maxWeekIndex = backgroundData.length > 0 ? Math.max(...backgroundData.map(item => item[1] as number)) : 4;
    const yAxisCategories = Array.from({ length: maxWeekIndex + 1 }, (_, i) => `Week ${i + 1}`);

    return {
      tooltip: {
        trigger: 'item',
        enterable: false,
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        padding: 0,
        textStyle: { color: '#1e293b' },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;',
        formatter: (params: any) => {
          if (params.value.length < 7) return '';
          
          const [
            _, __, date, 
            open, high, low, close,
            openDiff, highDiff, lowDiff, closeDiff,
            openDiffPct, highDiffPct, lowDiffPct, closeDiffPct
          ] = params.value;

          const isPositive = (closeDiff ?? (close - open)) >= 0;
          const closeColor = isPositive ? '#10b981' : '#ef4444';
          
          const fmt = (v: number) =>
            Number(v).toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          
          const row = (label: string, val: string, color: string = '#1e293b', isBold: boolean = false) => `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="color:#64748b;font-size:13px;">${label}</span>
              <span style="color:${color};font-size:13px;font-weight:${isBold ? '600' : '500'};">${val}</span>
            </div>
          `;

          const diffInfo = (diff: number | null, pct: number | null) => {
            if (diff === null || pct === null) return '';
            const sign = diff >= 0 ? '+' : '';
            const color = diff >= 0 ? '#10b981' : '#ef4444';
            return `<span style="color:${color};font-size:11px;font-weight:600;margin-left:8px;">${sign}${fmt(diff)} (${sign}${pct.toFixed(2)}%)</span>`;
          };

          const fullRow = (label: string, val: number, diff: number | null, pct: number | null, isBold: boolean = false, color: string = '#1e293b') => `
            <div style="margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#64748b;font-size:13px;">${label}</span>
                <span style="color:${color};font-size:13px;font-weight:${isBold ? '600' : '500'};">${fmt(val)}</span>
              </div>
              <div style="text-align:right;margin-top:-2px;">
                ${diffInfo(diff, pct)}
              </div>
            </div>
          `;

          return `
            <div style="min-width: 200px; font-family: 'Inter', system-ui, sans-serif;">
              <div style="background-color: #f8fafc; padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-weight: 600; color: #0f172a; font-size: 14px;">${date}</div>
              </div>
              <div style="padding: 12px 14px;">
                ${fullRow('Open', open, openDiff, openDiffPct)}
                ${fullRow('High', high, highDiff, highDiffPct)}
                ${fullRow('Low', low, lowDiff, lowDiffPct)}
                <div style="height: 1px; background-color: #e2e8f0; margin: 8px 0;"></div>
                ${fullRow('Close', close, closeDiff, closeDiffPct, true, closeColor)}
              </div>
            </div>
          `;
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
        position: 'top',   // 👈 move axis to top
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 13,
          fontWeight: 600,
          margin: 16,
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

  private renderBackgroundItem(params: any, api: any): any {
    const [cellWidth, cellHeight] = api.size([1, 1]);
    
    const gap = 8;
    const w = cellWidth - gap;
    const h = cellHeight - gap;
    
    const [cx, cy] = api.coord([api.value(0), api.value(1)]);
    
    const x = cx - cellWidth / 2 + gap / 2;
    const y = cy - cellHeight / 2 + gap / 2;

    const dateStr = api.value(2) as string;
    const day = dateStr.split('-')[2];
    const dayNum = parseInt(day, 10).toString();

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          shape: { x, y, width: w, height: h, r: 8 },
          style: {
            fill: '#ffffff',
            stroke: '#f1f5f9',
            lineWidth: 1
          }
        },
        {
          type: 'text',
          style: {
            x: x + 10,
            y: y + 10,
            text: dayNum,
            fill: '#94a3b8',
            fontSize: 13,
            fontWeight: 500,
            textAlign: 'left',
            textVerticalAlign: 'top',
            fontFamily: 'Inter, sans-serif'
          }
        }
      ]
    };
  }

  private renderDataItem(params: any, api: any): any {
    const [cellWidth, cellHeight] = api.size([1, 1]);
    
    const gap = 8;
    const w = cellWidth - gap;
    const h = cellHeight - gap;
    
    const [cx, cy] = api.coord([api.value(0), api.value(1)]);
    
    const x = cx - cellWidth / 2 + gap / 2;
    const y = cy - cellHeight / 2 + gap / 2;
    
    const dateStr = api.value(2) as string;
    const day = dateStr.split('-')[2];
    const dayNum = parseInt(day, 10).toString();
    
    const open = api.value(3) as number;
    const close = api.value(6) as number;
    const closeDiff = api.value(10) as number | null;
    const closeDiffPct = api.value(14) as number | null;

    const isPositive = (closeDiff ?? (close - open)) >= 0;
    const closeColor = isPositive ? '#10b981' : '#ef4444';
    
    const fmt = (v: number): string => {
      return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const displayPct = closeDiffPct ?? ((close - open) / open * 100);
    const changeSign = displayPct > 0 ? '+' : '';
    const changeText = `${changeSign}${displayPct.toFixed(2)}%`;
    const changeBgColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          shape: { x, y, width: w, height: h, r: 8 },
          style: {
            fill: '#ffffff',
            stroke: '#e2e8f0',
            lineWidth: 1
          }
        },
        {
          type: 'text',
          style: {
            x: x + 10,
            y: y + 10,
            text: dayNum,
            fill: '#64748b',
            fontSize: 13,
            fontWeight: 600,
            textAlign: 'left',
            textVerticalAlign: 'top',
            fontFamily: 'Inter, sans-serif'
          }
        },
        {
          type: 'text',
          style: {
            x: cx,
            y: cy - 4,
            text: fmt(close),
            fill: '#0f172a',
            fontSize: 13,
            fontWeight: 700,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            fontFamily: 'Inter, sans-serif'
          }
        },
        {
          type: 'rect',
          shape: {
            x: cx - 30,
            y: cy + 12,
            width: 60,
            height: 18,
            r: 4
          },
          style: {
            fill: changeBgColor
          }
        },
        {
          type: 'text',
          style: {
            x: cx,
            y: cy + 12 + 9,
            text: changeText,
            fill: closeColor,
            fontSize: 10,
            fontWeight: 600,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            fontFamily: 'Inter, sans-serif'
          }
        }
      ]
    };
  }
}
