import { Button } from 'antd';
import { ButtonHTMLAttributes } from 'react';

type DangerButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'color'
>;

export default function DangerButton({
    className = '',
    disabled,
    children,
    type = 'submit',
    ...props
}: DangerButtonProps) {
    return (
        <Button
            {...props}
            type="primary"
            danger
            htmlType={type}
            className={`h-12 rounded-full px-5 text-sm font-semibold ${className}`}
            disabled={disabled}
        >
            {children}
        </Button>
    );
}
