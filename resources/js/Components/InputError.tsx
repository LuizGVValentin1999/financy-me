import { Typography } from 'antd';
import { HTMLAttributes } from 'react';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <Typography.Text
            {...props}
            type="danger"
            className={`block text-sm font-medium ${className}`}
        >
            {message}
        </Typography.Text>
    ) : null;
}
