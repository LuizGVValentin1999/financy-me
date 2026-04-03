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
            className={`h-10 rounded-full px-4 text-xs font-semibold sm:h-12 sm:px-5 sm:text-sm ${className}`}
            disabled={disabled}
        >
            {children}
        </Button>
    );
}
