import { Typography } from 'antd';
import { LabelHTMLAttributes } from 'react';

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { value?: string }) {
    return (
        <label
            {...props}
            className={`block ${className}`}
        >
            <Typography.Text className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                {value ? value : children}
            </Typography.Text>
        </label>
    );
}
