import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SensexService } from '@shared/services/sensex.service';
import { SensexStockRecord, StockQueryParams } from '@core/models/stock.models';
import { SensexCalendarEchartComponent } from '@shared/components/sensex-calendar-echart/sensex-calendar-echart.component';

interface ChartSlot {
  month: ReturnType<typeof signal<Date>>;
  data: ReturnType<typeof signal<SensexStockRecord[]>>;
  isLoading: ReturnType<typeof signal<boolean>>;
  query$: Subject<Date>;
}

@Component({
  selector: 'app-sensex-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SensexService],
  imports: [
    FormsModule,
    NzDatePickerModule,
    NzSpinModule,
    NzButtonModule,
    NzIconModule,
    SensexCalendarEchartComponent,
  ],
  templateUrl: './sensex-charts.component.html',
  styleUrl: './sensex-charts.component.scss',
})
export class SensexChartsComponent {
  private readonly service = inject(SensexService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly chartCount = 4;
  readonly charts: ChartSlot[] = (() => {
    const count = this.chartCount;
    return Array.from(
      { length: count },
      (_, i) => this.createSlot(count - i - 1),
    );
  })();

  readonly disabledFutureDate = (current: Date): boolean => current > new Date();

  constructor() {
    this.charts.forEach((chart) => {
      chart.query$
        .pipe(
          tap(() => chart.isLoading.set(true)),
          switchMap((month) =>
            this.service.getSensexStockHistory(this.buildParams(month)).pipe(
              catchError(() => {
                chart.isLoading.set(false);
                return EMPTY;
              }),
            ),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((res) => {
          chart.data.set(res.data);
          chart.isLoading.set(false);
        });

      chart.query$.next(chart.month());
    });
  }

  onMonthChange(chart: ChartSlot, date: Date | null): void {
    if (!date) return;
    chart.month.set(date);
    chart.query$.next(date);
  }

  changeMonth(chart: ChartSlot, delta: number): void {
    const current = chart.month();
    const nextDate = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    this.onMonthChange(chart, nextDate);
  }

  changeYear(chart: ChartSlot, delta: number): void {
    const current = chart.month();
    let nextDate = new Date(current.getFullYear() + delta, current.getMonth(), 1);
    const now = new Date();

    if (nextDate.getFullYear() === now.getFullYear() && nextDate.getMonth() > now.getMonth()) {
      nextDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    this.onMonthChange(chart, nextDate);
  }

  isNextMonthDisabled(chart: ChartSlot): boolean {
    const current = chart.month();
    const now = new Date();
    return (
      current.getFullYear() > now.getFullYear() ||
      (current.getFullYear() === now.getFullYear() && current.getMonth() >= now.getMonth())
    );
  }

  isNextYearDisabled(chart: ChartSlot): boolean {
    const current = chart.month();
    const now = new Date();
    const nextDate = new Date(current.getFullYear() + 1, current.getMonth(), 1);

    return (
      nextDate.getFullYear() > now.getFullYear() ||
      (nextDate.getFullYear() === now.getFullYear() && nextDate.getMonth() > now.getMonth())
    );
  }

  private createSlot(offset: number): ChartSlot {
    const now = new Date();
    const defaultMonth = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return {
      month: signal<Date>(defaultMonth),
      data: signal<SensexStockRecord[]>([]),
      isLoading: signal<boolean>(false),
      query$: new Subject<Date>(),
    };
  }

  private buildParams(month: Date): StockQueryParams {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return {
      page: 1,
      limit: 31,
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
    };
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
