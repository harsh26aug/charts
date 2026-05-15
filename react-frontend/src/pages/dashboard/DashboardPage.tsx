import { Tabs } from 'antd';
import { useState } from 'react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import { Topbar } from '../../components/dashboard/Topbar';
import { NiftyTable } from '../../components/dashboard/NiftyTable';
import { SensexTable } from '../../components/dashboard/SensexTable';
import { NiftyCharts } from '../../components/dashboard/NiftyCharts';
import { SensexCharts } from '../../components/dashboard/SensexCharts';
import type { DateRange } from '../../types/stock';

export const DashboardPage = () => {
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [selectedMenu, setSelectedMenu] = useState<'Sensex' | 'Nifty50'>('Sensex');
  const [niftyTab, setNiftyTab] = useState('0');
  const [sensexTab, setSensexTab] = useState('0');

  const exportNiftyTableAsPdf = async () => {
    const captureTarget = document.querySelector('.dashboard-page') as HTMLElement | null;
    if (!captureTarget) {
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
      } catch {
        // html-to-image fallback is handled below
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
        return;
      }

      const pdfDoc = await PDFDocument.create();
      const base64 = dataUrl.split(',')[1];
      const pngBytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(pngBytes);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(pngImage, { x: 0, y: 0, width, height });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer.slice(0) as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileDate = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nifty50_${fileDate}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      captureTarget.style.overflow = prev.overflow;
      captureTarget.style.height = prev.height;
      captureTarget.style.maxHeight = prev.maxHeight;
      captureTarget.style.width = prev.width;
    }
  };

  return (
    <div className="dashboard-page">
      <Topbar
        selectedMenu={selectedMenu}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onMenuChange={setSelectedMenu}
        onDownloadPdf={exportNiftyTableAsPdf}
      />

      <div className="dashboard-page-content">
        <div className="dashboard-card">
          {selectedMenu === 'Sensex' ? (
            <Tabs
              activeKey={sensexTab}
              onChange={setSensexTab}
              size="large"
              className="dashboard-custom-tabs"
              items={[
                {
                  key: '0',
                  label: 'Calendar View',
                  children: sensexTab === '0' ? (
                    <div className="tab-content">
                      <SensexCharts />
                    </div>
                  ) : null,
                },
                {
                  key: '1',
                  label: 'Table View',
                  children: sensexTab === '1' ? (
                    <div className="tab-content">
                      <SensexTable dateRange={dateRange} />
                    </div>
                  ) : null,
                },
              ]}
            />
          ) : (
            <Tabs
              activeKey={niftyTab}
              onChange={setNiftyTab}
              size="large"
              className="dashboard-custom-tabs"
              items={[
                {
                  key: '0',
                  label: 'Calendar View',
                  children: niftyTab === '0' ? (
                    <div className="tab-content">
                      <NiftyCharts />
                    </div>
                  ) : null,
                },
                {
                  key: '1',
                  label: 'Table View',
                  children: niftyTab === '1' ? (
                    <div className="tab-content">
                      <NiftyTable dateRange={dateRange} />
                    </div>
                  ) : null,
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};
