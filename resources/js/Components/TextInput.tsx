import { Input } from 'antd';
import type { InputRef } from 'antd';
import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        ...props
    }: Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
        isFocused?: boolean;
    },
    ref,
) {
    const antInputRef = useRef<InputRef>(null);

    useImperativeHandle(ref, () => ({
        focus: () => antInputRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            antInputRef.current?.focus();
        }
    }, [isFocused]);

    if (type === 'password') {
        return (
            <Input.Password
                {...props}
                ref={antInputRef}
                className={`h-12 rounded-2xl ${className}`}
            />
        );
    }

    return (
        <Input
            {...props}
            type={type}
            ref={antInputRef}
            className={`h-12 rounded-2xl ${className}`}
        />
    );
});
