import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from './topbar/topbar.component';
import { Nifty50Component } from './nifty50/nifty50.component';
import { Nifty50ChartsComponent } from './nifty50-charts/nifty50-charts.component';
import { NzTabsComponent, NzTabComponent } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { DateRange } from '@core/models/stock.models';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TopbarComponent,
    Nifty50ChartsComponent,
    Nifty50Component,
    NzTabsComponent,
    NzTabComponent,
    NzIconModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly dateRange = signal<DateRange>(null);
  readonly selectedMenu = signal<string>('Nifty50');
  selectedIndex = signal<number>(0);

  onDateRangeChange(range: DateRange): void {
    this.dateRange.set(range);
  }

  onMenuChange(menu: string): void {
    this.selectedMenu.set(menu);
  }

  async exportNiftyTableAsPdf(): Promise<void> {
    const captureTarget = document.querySelector('.dashboard-page') as HTMLElement | null;

    if (!captureTarget) {
      console.error('No .dashboard-page found for PDF export');
      return;
    }

    const width = Math.max(captureTarget.scrollWidth, captureTarget.clientWidth);
    const height = Math.max(captureTarget.scrollHeight, captureTarget.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 2, 2);

    const prev = {
      overflow: captureTarget.style.overflow,
      height: captureTarget.style.height,
      maxHeight: captureTarget.style.maxHeight,
      width: captureTarget.style.width,
    };

    captureTarget.style.overflow = 'visible';
    captureTarget.style.height = `${height}px`;
    captureTarget.style.maxHeight = 'none';
    captureTarget.style.width = `${width}px`;

    let dataUrl: string | null = null;

    try {
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 150)));

      try {
        dataUrl = await toPng(captureTarget, {
          pixelRatio,
          backgroundColor: '#ffffff',
          width,
          height,
          canvasWidth: width * pixelRatio,
          canvasHeight: height * pixelRatio,
        });
      } catch (err) {
        console.warn('html-to-image export failed, falling back to html2canvas', err);
      }

      if (!dataUrl) {
        const canvas = await html2canvas(captureTarget, {
          scale: pixelRatio,
          backgroundColor: '#ffffff',
          width,
          height,
          useCORS: true,
          logging: false,
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      if (!dataUrl) {
        console.error('Failed to capture nifty table screenshot');
        return;
      }

      const pdfDoc = await PDFDocument.create();
      const base64 = dataUrl.split(',')[1];
      const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(pngBytes);

      const page = pdfDoc.addPage([width, height]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width,
        height,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer.slice(0) as ArrayBuffer], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);

      const fileDate = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nifty50_${fileDate}.pdf`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Nifty PDF export failed:', error);
    } finally {
      captureTarget.style.overflow = prev.overflow;
      captureTarget.style.height = prev.height;
      captureTarget.style.maxHeight = prev.maxHeight;
      captureTarget.style.width = prev.width;
    }
  }
}
