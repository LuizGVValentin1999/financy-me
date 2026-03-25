import { Button } from 'antd';
import { ButtonHTMLAttributes } from 'react';

type SecondaryButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'color'
>;

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: SecondaryButtonProps) {
    return (
        <Button
            {...props}
            htmlType={type}
            className={`h-12 rounded-full px-5 text-sm font-semibold ${className}`}
            disabled={disabled}
        >
            {children}
        </Button>
    );
}
