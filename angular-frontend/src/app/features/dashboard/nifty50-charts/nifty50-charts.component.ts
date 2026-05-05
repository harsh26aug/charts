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
import { Nifty50Service } from '@shared/services/nifty50.service';
import { NiftyStockRecord, StockQueryParams } from '@core/models/stock.models';
import { CalendarEchartComponent } from '@shared/components/calendar-echart/calendar-echart.component';

interface ChartSlot {
  month: ReturnType<typeof signal<Date>>;
  data: ReturnType<typeof signal<NiftyStockRecord[]>>;
  isLoading: ReturnType<typeof signal<boolean>>;
  query$: Subject<Date>;
}

@Component({
  selector: 'app-nifty50-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [Nifty50Service],
  imports: [FormsModule, NzDatePickerModule, NzSpinModule, CalendarEchartComponent],
  templateUrl: './nifty50-charts.component.html',
  styleUrl: './nifty50-charts.component.scss',
})
export class Nifty50ChartsComponent {
  private readonly service = inject(Nifty50Service);
  private readonly destroyRef = inject(DestroyRef);

  readonly charts: ChartSlot[] = Array.from({ length: 4 }, (_, i) =>
    this.createSlot(i),
  );

  readonly disabledFutureDate = (current: Date): boolean => current > new Date();

  constructor() {
    this.charts.forEach((chart) => {
      chart.query$
        .pipe(
          tap(() => chart.isLoading.set(true)),
          switchMap((month) =>
            this.service.getNiftyStockHistory(this.buildParams(month)).pipe(
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

  private createSlot(offset: number): ChartSlot {
    const now = new Date();
    const defaultMonth = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return {
      month: signal<Date>(defaultMonth),
      data: signal<NiftyStockRecord[]>([]),
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
