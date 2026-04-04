import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

interface LabeledTextAreaFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    error?: string;
    disabled?: boolean;
}

export default function LabeledTextAreaField({
    id,
    label,
    value,
    onChange,
    rows = 5,
    error,
    disabled = false,
}: LabeledTextAreaFieldProps) {
    return (
        <div>
            <InputLabel htmlFor={id} value={label} />
            <textarea
                id={id}
                rows={rows}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            />
            <InputError message={error} className="mt-2" />
        </div>
    );
}
