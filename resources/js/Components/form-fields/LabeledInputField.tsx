import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

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
