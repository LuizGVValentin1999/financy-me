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
                className={`!inline-flex !w-full !items-center h-10 rounded-2xl text-sm sm:h-12 sm:text-base [&_.ant-input]:!h-auto [&_.ant-input]:!py-0 [&_.ant-input]:!leading-normal [&_.ant-input-suffix]:!flex [&_.ant-input-suffix]:!items-center ${className}`}
            />
        );
    }

    return (
        <Input
            {...props}
            type={type}
            ref={antInputRef}
            className={`h-10 rounded-2xl text-sm sm:h-12 sm:text-base ${className}`}
        />
    );
});
