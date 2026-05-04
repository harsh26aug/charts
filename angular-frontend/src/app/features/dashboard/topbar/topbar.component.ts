import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DateRange } from '@core/models/stock.models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzDatePickerModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  readonly dateRangeChange = output<DateRange>();

  dateRange: DateRange = null;

  onDateRangeChange(range: [Date, Date] | null): void {
    this.dateRange = range;
    this.dateRangeChange.emit(range);
  }

  readonly disabledFutureDate = (current: Date): boolean =>
    current > new Date();
}
