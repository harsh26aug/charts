import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DateRange } from '@core/models/stock.models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzDatePickerModule, NzButtonModule, NzIconModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  readonly dateRangeChange = output<DateRange>();
  readonly downloadPdf = output<void>();

  dateRange: DateRange = null;

  onDateRangeChange(range: [Date, Date] | null): void {
    this.dateRange = range;
    this.dateRangeChange.emit(range);
  }

  readonly disabledFutureDate = (current: Date): boolean => current > new Date();

  onDownloadPdf(): void {
    this.downloadPdf.emit();
  }
}
