import { DatePicker, Grid } from 'antd';
import type { Dayjs } from 'dayjs';

interface ResponsiveDateRangePickerProps {
    value: [Dayjs | null, Dayjs | null];
    onChange: (dates: [Dayjs | null, Dayjs | null]) => void;
    className?: string;
    format?: string;
    size?: 'small' | 'middle' | 'large';
    placeholder?: [string, string];
}

export default function ResponsiveDateRangePicker({
    value,
    onChange,
    className,
    format = 'DD/MM/YYYY',
    size = 'large',
    placeholder = ['De', 'Ate'],
}: ResponsiveDateRangePickerProps) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;

    if (isMobile) {
        return (
            <div className={className}>
                <div className="grid grid-cols-1 gap-3">
                    <DatePicker
                        value={value[0]}
                        format={format}
                        size={size}
                        placeholder={placeholder[0]}
                        className="w-full"
                        style={{ width: '100%' }}
                        onChange={(date) => onChange([date, value[1]])}
                    />
                    <DatePicker
                        value={value[1]}
                        format={format}
                        size={size}
                        placeholder={placeholder[1]}
                        className="w-full"
                        style={{ width: '100%' }}
                        onChange={(date) => onChange([value[0], date])}
                    />
                </div>
            </div>
        );
    }

    return (
        <DatePicker.RangePicker
            value={value}
            format={format}
            size={size}
            allowEmpty={[true, true]}
            onChange={(dates) => onChange([dates?.[0] ?? null, dates?.[1] ?? null])}
            className={className}
            placeholder={placeholder}
        />
    );
}
