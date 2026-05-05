import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { HighchartsChartComponent } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import { NiftyStockRecord } from '@core/models/stock.models';

function parseYMD(s: string): [number, number, number] {
  const p = s.split('-');
  return [+p[0], +p[1] - 1, +p[2]];
}

function fmtDiff(diff: number | null, pct: number | null): string {
  if (diff === null) return '<span style="color:#8c8c8c">-</span>';
  const sign = diff > 0 ? '+' : '';
  const color = diff > 0 ? '#389e0d' : diff < 0 ? '#cf1322' : '#8c8c8c';
  return `<span style="color:${color}">${sign}${diff.toFixed(2)} (${sign}${(pct ?? 0).toFixed(2)}%)</span>`;
}

interface PointCustom {
  tradeDate: string;
  dayOfMonth: number;
  open: number;
  high: number;
  low: number;
  close: number;
  closeDiff: number;
  closeDiffPct: number | null;
  openDiff: number | null;
  openDiffPct: number | null;
  highDiff: number | null;
  highDiffPct: number | null;
  lowDiff: number | null;
  lowDiffPct: number | null;
}

@Component({
  selector: 'app-calendar-highchart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzDatePickerModule, NzSpinModule, HighchartsChartComponent],
  templateUrl: './calendar-highchart.component.html',
  styleUrl: './calendar-highchart.component.scss',
})
export class CalendarHighchartComponent implements OnInit {
  readonly title = input.required<string>();
  readonly data = input<NiftyStockRecord[]>([]);
  readonly isLoading = input(false);
  readonly defaultMonth = input<Date>(new Date());
  readonly monthChange = output<Date>();

  readonly selectedMonth = signal<Date>(new Date());
  readonly selectedMonthLabel = computed(() =>
    this.selectedMonth().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  );

  /**
   * Only render <highcharts-chart> when data is present.
   *
   * When the month changes the parent clears data() and sets isLoading(true),
   * which flips this to false — Angular destroys the <highcharts-chart> element.
   * When the API responds, data() is populated and isLoading() becomes false,
   * flipping this back to true — Angular creates a brand-new <highcharts-chart>.
   * highcharts-angular creates the Highcharts chart with untracked(options) after
   * a 500 ms delay, at which point options already contains the full data set.
   * This means chart.update() is NEVER called with changing data, avoiding the
   * heatmap cell positioning bug where all cells land at (0,0).
   */
  readonly shouldRenderChart = computed(() => !this.isLoading() && this.data().length > 0);

  /**
   * Full chart options including data — passed once at chart creation time.
   * Because shouldRenderChart gates the chart element, this computed is only
   * consumed when data is already present, so the chart is always created with
   * a populated series.
   */
  readonly chartOptions = computed<Highcharts.Options>(() => {
    const records = this.data();

    let heatData: Highcharts.PointOptionsObject[] = [];
    let maxAbsDiff = 1;

    if (records.length > 0) {
      const [firstYear, firstMonth] = parseYMD(records[0].tradeDate);
      const firstOfMonth = new Date(firstYear, firstMonth, 1);
      const firstDayOfWeekMon = (firstOfMonth.getDay() + 6) % 7;

      heatData = records.map((r) => {
        const [y, mo, d] = parseYMD(r.tradeDate);
        const dayOfWeekMon = (new Date(y, mo, d).getDay() + 6) % 7;
        const position = d - 1 + firstDayOfWeekMon;
        const week = Math.floor(position / 7);

        const closeDiff = Number(r.diff.closeDiff) || 0;
        if (Math.abs(closeDiff) > maxAbsDiff) maxAbsDiff = Math.abs(closeDiff);

        return {
          x: dayOfWeekMon,
          y: week,
          value: closeDiff,
          custom: {
            tradeDate: r.tradeDate,
            dayOfMonth: d,
            open: Number(r.price.open),
            high: Number(r.price.high),
            low: Number(r.price.low),
            close: Number(r.price.close),
            closeDiff,
            closeDiffPct: r.diff.closeDiffPct != null ? Number(r.diff.closeDiffPct) : null,
            openDiff: r.diff.openDiff != null ? Number(r.diff.openDiff) : null,
            openDiffPct: r.diff.openDiffPct != null ? Number(r.diff.openDiffPct) : null,
            highDiff: r.diff.highDiff != null ? Number(r.diff.highDiff) : null,
            highDiffPct: r.diff.highDiffPct != null ? Number(r.diff.highDiffPct) : null,
            lowDiff: r.diff.lowDiff != null ? Number(r.diff.lowDiff) : null,
            lowDiffPct: r.diff.lowDiffPct != null ? Number(r.diff.lowDiffPct) : null,
          } satisfies PointCustom,
        };
      });
    }

    return {
      chart: {
        backgroundColor: 'transparent',
        height: 560,
        margin: [38, 8, 8, 8],
        spacing: [0, 0, 0, 0],
      },
      title: { text: undefined },
      xAxis: {
        // Linear axis — required for heatmap colsize/transA to calculate cell pixel widths correctly.
        // A category axis gives transA = W/(N-1) instead of W/N, producing oversized/NaN rects.
        min: -0.5,
        max: 4.5,
        tickPositions: [0, 1, 2, 3, 4],
        opposite: true,
        lineWidth: 0,
        tickLength: 0,
        labels: {
          formatter(this: unknown): string {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            return days[(this as { value: number }).value] ?? '';
          },
          style: { fontSize: '12px', fontWeight: '600', color: '#555' },
        },
      },
      yAxis: {
        title: { text: undefined },
        min: -0.5,
        max: 5.5,
        reversed: true,
        visible: false,
      },
      colorAxis: {
        min: -maxAbsDiff,
        max: maxAbsDiff,
        stops: [
          [0, '#cf1322'],
          [0.42, '#ffa39e'],
          [0.5, '#f5f5f5'],
          [0.58, '#95de64'],
          [1, '#237804'],
        ] as [number, string][],
        visible: false,
      },
      series: [
        {
          type: 'heatmap',
          colsize: 1,
          rowsize: 1,
          // marker.enabled: true is required in Highcharts 12 to trigger drawPoints().
          // The non-interpolation heatmap drawPoints gate is:
          //   (i.enabled || t._hasPointMarkers) && Series.prototype.drawPoints.call(t)
          // Default marker.enabled is null (from scatter parent) which is falsy → cells skipped.
          // With enabled: true the gate opens; markerAttribs() returns point.shapeArgs (the rect).
          marker: { enabled: true, symbol: 'rect', radius: 0 },
          data: heatData,
          borderWidth: 3,
          borderColor: '#ffffff',
          nullColor: '#f5f5f5',
          dataLabels: [
            {
              enabled: true,
              align: 'left',
              verticalAlign: 'top',
              x: 5,
              y: 4,
              formatter(this: unknown): string {
                const pt = (this as { point: { custom?: { dayOfMonth?: number } } }).point;
                if (!pt.custom?.dayOfMonth) return '';
                return String(pt.custom.dayOfMonth);
              },
              style: { fontSize: '10px', fontWeight: 'normal', color: '#666', textOutline: 'none' },
            },
            {
              enabled: true,
              align: 'center',
              verticalAlign: 'middle',
              formatter(this: unknown): string {
                const pt = (this as { point: { custom?: { close?: number } } }).point;
                if (!pt.custom?.close) return '';
                return pt.custom.close.toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                });
              },
              style: { fontSize: '12px', fontWeight: '700', color: '#222', textOutline: 'none' },
            },
          ],
        },
      ] as Highcharts.SeriesOptionsType[],
      tooltip: {
        useHTML: true,
        padding: 0,
        formatter(this: unknown): string {
          const point = (this as { point: { custom?: PointCustom } }).point;
          if (!point.custom) return '';
          const c = point.custom;
          const [y, mo, d] = c.tradeDate.split('-').map(Number);
          const dateStr = new Date(y, mo - 1, d).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          return (
            `<div style="padding:10px 12px;font-size:12px;min-width:230px;line-height:1.6">` +
            `<div style="font-weight:700;font-size:13px;margin-bottom:6px">${dateStr}</div>` +
            `<table style="border-collapse:collapse;width:100%">` +
            `<tr><td style="padding:1px 12px 1px 0;color:#555">Open</td>` +
            `<td style="font-weight:700;padding-right:8px">Rs.${c.open.toFixed(2)}</td>` +
            `<td>${fmtDiff(c.openDiff, c.openDiffPct)}</td></tr>` +
            `<tr><td style="padding:1px 12px 1px 0;color:#555">High</td>` +
            `<td style="font-weight:700;padding-right:8px">Rs.${c.high.toFixed(2)}</td>` +
            `<td>${fmtDiff(c.highDiff, c.highDiffPct)}</td></tr>` +
            `<tr><td style="padding:1px 12px 1px 0;color:#555">Low</td>` +
            `<td style="font-weight:700;padding-right:8px">Rs.${c.low.toFixed(2)}</td>` +
            `<td>${fmtDiff(c.lowDiff, c.lowDiffPct)}</td></tr>` +
            `<tr style="border-top:1px solid #eee">` +
            `<td style="padding:3px 12px 1px 0;color:#555;font-weight:600">Close</td>` +
            `<td style="font-weight:700;padding-right:8px">Rs.${c.close.toFixed(2)}</td>` +
            `<td>${fmtDiff(c.closeDiff, c.closeDiffPct)}</td></tr>` +
            `</table></div>`
          );
        },
      },
      legend: { enabled: false },
      credits: { enabled: false },
    };
  });

  ngOnInit(): void {
    this.selectedMonth.set(this.defaultMonth());
    this.monthChange.emit(this.defaultMonth());
  }

  onMonthChange(month: Date): void {
    if (month) {
      this.selectedMonth.set(month);
      this.monthChange.emit(month);
    }
  }
}
