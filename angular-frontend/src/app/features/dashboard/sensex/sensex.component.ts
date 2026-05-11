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
import { SensexService } from '@shared/services/sensex.service';
import {
  DateRange,
  SensexStockRecord,
  StockPagination,
  StockQueryParams,
} from '@core/models/stock.models';

@Component({
  selector: 'app-sensex',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SensexService],
  imports: [CommonModule, NzTableModule, NzSpinModule],
  templateUrl: './sensex.component.html',
  styleUrl: './sensex.component.scss',
})
export class SensexComponent {
  readonly dateRange = input<DateRange>(null);

  private readonly service = inject(SensexService);
  private readonly query$ = new Subject<StockQueryParams>();

  readonly isLoading = signal(false);
  readonly data = signal<SensexStockRecord[]>([]);
  readonly pagination = signal<StockPagination | null>(null);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly selectedDayFilters = signal<number[]>([]);

  readonly filteredData = computed(() => {
    const dayFilters = this.selectedDayFilters();
    const currentData = this.data();
    if (dayFilters.length === 0) {
      return currentData;
    }
    return currentData.filter((record) => {
      const date = new Date(record.tradeDate);
      return dayFilters.includes(date.getDay());
    });
  });

  constructor() {
    this.query$
      .pipe(
        tap(() => this.isLoading.set(true)),
        switchMap((params) =>
          this.service.getSensexStockHistory(params).pipe(
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
    if (day === null) {
      this.selectedDayFilters.set([]);
    } else {
      const current = this.selectedDayFilters();
      if (current.includes(day)) {
        this.selectedDayFilters.set(current.filter((d) => d !== day));
      } else {
        this.selectedDayFilters.set([...current, day]);
      }
    }
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

  formatVolume(value: number): string {
    return Number(value).toLocaleString('en-IN');
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
}
