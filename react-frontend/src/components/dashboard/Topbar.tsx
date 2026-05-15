import { DownloadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Radio } from 'antd';
import dayjs from 'dayjs';
import type { DateRange } from '../../types/stock';

const { RangePicker } = DatePicker;

interface TopbarProps {
  selectedMenu: 'Sensex' | 'Nifty50';
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onMenuChange: (menu: 'Sensex' | 'Nifty50') => void;
  onDownloadPdf: () => void;
}

export const Topbar = ({
  selectedMenu,
  dateRange,
  onDateRangeChange,
  onMenuChange,
  onDownloadPdf,
}: TopbarProps) => {
  return (
    <div className="topbar">
      <div className="topbar-menu">
        <Radio.Group
          value={selectedMenu}
          onChange={(e) => onMenuChange(e.target.value as 'Sensex' | 'Nifty50')}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="Sensex">Sensex</Radio.Button>
          <Radio.Button value="Nifty50">Nifty50</Radio.Button>
        </Radio.Group>
      </div>

      <div className="topbar-controls">
        <Button
          className="download-btn"
          aria-label="Download Nifty table as PDF"
          title="Download Nifty table as PDF"
          onClick={onDownloadPdf}
          icon={<DownloadOutlined />}
        />

        <RangePicker
          format="DD/MM/YYYY"
          value={
            dateRange
              ? [dayjs(dateRange[0].toISOString()), dayjs(dateRange[1].toISOString())]
              : null
          }
          onChange={(value) => {
            if (!value || value.length < 2 || !value[0] || !value[1]) {
              onDateRangeChange(null);
              return;
            }
            onDateRangeChange([value[0].toDate(), value[1].toDate()]);
          }}
          disabledDate={(current) => current.isAfter(dayjs(), 'day')}
        />
      </div>
    </div>
  );
};
