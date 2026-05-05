import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { DateRange } from '@core/models/stock.models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzDatePickerModule, NzButtonModule, NzIconModule, NzRadioModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  readonly dateRangeChange = output<DateRange>();
  readonly downloadPdf = output<void>();
  readonly menuChange = output<string>();

  selectedMenu = 'Nifty50';

  dateRange: DateRange = null;

  onDateRangeChange(range: [Date, Date] | null): void {
    this.dateRange = range;
    this.dateRangeChange.emit(range);
  }

  readonly disabledFutureDate = (current: Date): boolean => current > new Date();

  onDownloadPdf(): void {
    this.downloadPdf.emit();
  }

  onMenuChange(menu: string): void {
    this.menuChange.emit(menu);
  }
}
