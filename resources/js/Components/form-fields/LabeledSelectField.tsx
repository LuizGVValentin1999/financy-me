import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { Select } from 'antd';

type SelectOption = {
    value: string;
    label: string;
};

interface LabeledSelectFieldProps {
    id: string;
    label: string;
    value?: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    error?: string;
    placeholder?: string;
    allowClear?: boolean;
    disabled?: boolean;
}

export default function LabeledSelectField({
    id,
    label,
    value,
    onChange,
    options,
    error,
    placeholder,
    allowClear = false,
    disabled = false,
}: LabeledSelectFieldProps) {
    return (
        <div>
            <InputLabel htmlFor={id} value={label} />
            <Select
                id={id}
                value={value}
                onChange={(selectedValue) => onChange((selectedValue ?? '') as string)}
                className="mt-2 w-full"
                size="large"
                options={options}
                placeholder={placeholder}
                allowClear={allowClear}
                disabled={disabled}
            />
            <InputError message={error} className="mt-2" />
        </div>
    );
}
