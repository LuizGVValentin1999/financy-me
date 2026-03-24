import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-full border border-transparent bg-[#be3d2a] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(190,61,42,0.75)] transition hover:-translate-y-0.5 hover:bg-[#d65a46] focus:outline-none focus:ring-4 focus:ring-[#d65a46]/20 active:translate-y-0 disabled:cursor-not-allowed ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
