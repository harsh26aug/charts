import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { TopbarComponent } from './topbar/topbar.component';
import { Nifty50Component } from './nifty50/nifty50.component';
import { DateRange } from '@core/models/stock.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopbarComponent, Nifty50Component],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly dateRange = signal<DateRange>(null);

  onDateRangeChange(range: DateRange): void {
    this.dateRange.set(range);
  }
}
