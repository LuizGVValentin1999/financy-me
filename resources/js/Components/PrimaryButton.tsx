import { Button } from 'antd';
import { ButtonHTMLAttributes } from 'react';

type PrimaryButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'color'
>;

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    type = 'submit',
    ...props
}: PrimaryButtonProps) {
    return (
        <Button
            {...props}
            type="primary"
            htmlType={type}
            className={`h-12 rounded-full px-5 text-sm font-semibold ${className}`}
            disabled={disabled}
        >
            {children}
        </Button>
    );
}
