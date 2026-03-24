import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-full border border-transparent bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(15,23,42,0.85)] transition hover:-translate-y-0.5 hover:bg-[#1e7a8a] focus:outline-none focus:ring-4 focus:ring-[#1e7a8a]/20 active:translate-y-0 disabled:cursor-not-allowed ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
