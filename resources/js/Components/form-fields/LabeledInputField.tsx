import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

interface LabeledInputFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    min?: string;
    step?: string;
    placeholder?: string;
    className?: string;
}

export default function LabeledInputField({
    id,
    label,
    value,
    onChange,
    error,
    type = 'text',
    min,
    step,
    placeholder,
    className,
}: LabeledInputFieldProps) {
    if (type === 'date') {
        const parsedDate = value ? dayjs(value) : null;
        const dateValue = parsedDate && parsedDate.isValid() ? parsedDate : null;

        return (
            <div>
                <InputLabel htmlFor={id} value={label} />
                <DatePicker
                    id={id}
                    value={dateValue}
                    onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
                    format="DD/MM/YYYY"
                    size="large"
                    className="mt-2 w-full"
                    style={{ width: '100%' }}
                />
                <InputError message={error} className="mt-2" />
            </div>
        );
    }

    return (
        <div>
            <InputLabel htmlFor={id} value={label} />
            <input
                id={id}
                type={type}
                min={min}
                step={step}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className={
                    className ??
                    'mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3'
                }
            />
            <InputError message={error} className="mt-2" />
        </div>
    );
}
