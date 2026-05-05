import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  WritableSignal,
  DestroyRef,
} from '@angular/core';
import { Subject, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NiftyStockRecord } from '@core/models/stock.models';
import { Nifty50Service } from '@core/services/nifty50.service';
import { CalendarHighchartComponent } from '@shared/components/calendar-highchart/calendar-highchart.component';

interface ChartDefinition {
  title: string;
  defaultMonth: Date;
  data: WritableSignal<NiftyStockRecord[]>;
  isLoading: WritableSignal<boolean>;
  monthSubject: Subject<Date>;
}

@Component({
  selector: 'app-nifty50-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarHighchartComponent],
  templateUrl: './nifty50-charts.component.html',
  styleUrl: './nifty50-charts.component.scss',
})
export class Nifty50ChartsComponent {
  private readonly service = inject(Nifty50Service);
  private readonly destroyRef = inject(DestroyRef);

  readonly charts: ChartDefinition[];

  constructor() {
    this.charts = [
      {
        title: 'Nifty 50',
        defaultMonth: this.monthsAgo(0),
        data: signal([]),
        isLoading: signal(false),
        monthSubject: new Subject<Date>(),
      },
      {
        title: 'Nifty 50',
        defaultMonth: this.monthsAgo(1),
        data: signal([]),
        isLoading: signal(false),
        monthSubject: new Subject<Date>(),
      },
      {
        title: 'Nifty 50',
        defaultMonth: this.monthsAgo(2),
        data: signal([]),
        isLoading: signal(false),
        monthSubject: new Subject<Date>(),
      },
      {
        title: 'Nifty 50',
        defaultMonth: this.monthsAgo(3),
        data: signal([]),
        isLoading: signal(false),
        monthSubject: new Subject<Date>(),
      },
    ];

    this.charts.forEach((chart) => {
      chart.monthSubject
        .pipe(
          tap(() => {
            chart.isLoading.set(true);
            chart.data.set([]); // clear old data so shouldRenderChart flips false → destroys chart
          }),
          switchMap((month) => {
            const startDate = this.toIsoDate(
              new Date(month.getFullYear(), month.getMonth(), 1),
            );
            const endDate = this.toIsoDate(
              new Date(month.getFullYear(), month.getMonth() + 1, 0),
            );
            return this.service
              .getNiftyStockHistory({ page: 1, limit: 31, startDate, endDate })
              .pipe(
                catchError(() => {
                  chart.isLoading.set(false);
                  return EMPTY;
                }),
              );
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((res) => {
          chart.data.set(res.data);
          chart.isLoading.set(false);
        });
    });
  }

  onMonthChange(chartIndex: number, month: Date): void {
    this.charts[chartIndex].monthSubject.next(month);
  }

  private monthsAgo(n: number): Date {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - n);
    return d;
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
