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
            className={`h-10 rounded-full px-4 text-xs font-semibold sm:h-12 sm:px-5 sm:text-sm ${className}`}
            disabled={disabled}
        >
            {children}
        </Button>
    );
}
