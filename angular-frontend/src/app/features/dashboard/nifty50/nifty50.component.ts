import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Nifty50Service } from '@shared/services/nifty50.service';
import {
  DateRange,
  NiftyStockRecord,
  StockPagination,
  StockQueryParams,
} from '@core/models/stock.models';

@Component({
  selector: 'app-nifty50',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [Nifty50Service],
  imports: [CommonModule, NzTableModule, NzSpinModule],
  templateUrl: './nifty50.component.html',
  styleUrl: './nifty50.component.scss',
})
export class Nifty50Component {
  private static readonly tuesdayBatchStartDate = new Date('2025-09-01T00:00:00');
  private static readonly tuesdayDay = 2;
  private static readonly thursdayDay = 4;

  readonly dateRange = input<DateRange>(null);

  private readonly service = inject(Nifty50Service);
  private readonly query$ = new Subject<StockQueryParams>();

  readonly isLoading = signal(false);
  readonly data = signal<NiftyStockRecord[]>([]);
  readonly pagination = signal<StockPagination | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly selectedDayFilter = signal<number | null>(null); // null means 'All'

  readonly filteredData = computed(() => {
    const dayFilter = this.selectedDayFilter();
    const currentData = this.data();
    if (dayFilter === null) {
      return currentData;
    }
    return currentData.filter((record) => {
      const date = new Date(record.tradeDate);
      return date.getDay() === dayFilter;
    });
  });

  constructor() {
    this.query$
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap((params) =>
          this.service.getNiftyStockHistory(params).pipe(
            catchError(() => {
              this.isLoading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.data.set(res.data);
        this.pagination.set(res.pagination);
        this.isLoading.set(false);
      });

    effect(() => {
      const range = this.dateRange();
      untracked(() => {
        this.currentPage.set(1);
        this.query$.next({ page: 1, limit: this.pageSize(), ...this.buildDateParams(range) });
      });
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.query$.next({
      page,
      limit: this.pageSize(),
      ...this.buildDateParams(this.dateRange()),
    });
  }

  onPageSizeChange(size: number): void {
    this.currentPage.set(1);
    this.pageSize.set(size);
    this.query$.next({
      page: 1,
      limit: size,
      ...this.buildDateParams(this.dateRange()),
    });
  }

  onDayFilterChange(day: number | null): void {
    this.selectedDayFilter.set(day);
  }

  getDiffClass(value: number | null): string {
    if (value === null || value === 0) return 'neutral';
    return value > 0 ? 'positive' : 'negative';
  }

  formatDiff(value: number | null): string {
    if (value === null) return '–';
    const sign = value > 0 ? '+' : '';
    return `${sign}${Number(value).toFixed(2)}`;
  }

  formatPct(value: number | null): string {
    if (value === null) return '–';
    const sign = value > 0 ? '+' : '';
    return `${sign}${Number(value).toFixed(2)}%`;
  }

  formatPrice(value: number): string {
    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatShares(value: number): string {
    return Number(value).toLocaleString('en-IN');
  }

  getBatchLabel(tradeDate: string): string | null {
    const date = this.parseTradeDate(tradeDate);

    if (this.isTuesdayBatchDate(date)) {
      return date.getDay() === Nifty50Component.tuesdayDay ? 'Tuesday Batch' : null;
    }

    return date.getDay() === Nifty50Component.thursdayDay ? 'Thursday Batch' : null;
  }

  private buildDateParams(range: DateRange): Partial<StockQueryParams> {
    if (!range) return {};
    return {
      startDate: this.toIsoDate(range[0]),
      endDate: this.toIsoDate(range[1]),
    };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private isTuesdayBatchDate(tradeDate: Date): boolean {
    return tradeDate >= Nifty50Component.tuesdayBatchStartDate;
  }

  private parseTradeDate(tradeDate: string): Date {
    return tradeDate.length === 10 ? new Date(`${tradeDate}T00:00:00`) : new Date(tradeDate);
  }
}
