import { PropsWithChildren, ReactNode } from 'react';

function joinClasses(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export function ResponsiveCard({
    children,
    onClick,
    className,
    tone = 'default',
}: PropsWithChildren<{
    onClick?: () => void;
    className?: string;
    tone?: 'default' | 'muted' | 'warm';
}>) {
    const Component = onClick ? 'button' : 'article';

    return (
        <Component
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={joinClasses(
                'block w-full rounded-[28px] border border-white/80 p-3 text-left shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)] transition duration-200 sm:p-4',
                onClick && 'active:scale-[0.99] hover:-translate-y-0.5',
                tone === 'default' && 'bg-white',
                tone === 'muted' && 'bg-[rgba(248,250,252,0.92)]',
                tone === 'warm' && 'bg-[linear-gradient(180deg,#fffaf5_0%,#fff5eb_100%)]',
                className,
            )}
        >
            {children}
        </Component>
    );
}

export function ResponsiveCardHeader({
    eyebrow,
    title,
    subtitle,
    trailing,
}: {
    eyebrow?: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    trailing?: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                {eyebrow ? (
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        {eyebrow}
                    </p>
                ) : null}
                <p
                    className={joinClasses(
                        'line-clamp-2 font-semibold leading-tight text-slate-900 [overflow-wrap:anywhere]',
                        eyebrow ? 'mt-2 text-[1rem]' : 'text-[1rem]',
                    )}
                >
                    {title}
                </p>
                {subtitle ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500 [overflow-wrap:anywhere]">
                        {subtitle}
                    </p>
                ) : null}
            </div>

            {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
    );
}

export function ResponsiveCardPills({ children }: PropsWithChildren) {
    return <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">{children}</div>;
}

export function ResponsiveCardPill({
    children,
    tone = 'default',
}: PropsWithChildren<{ tone?: 'default' | 'muted' | 'warm' }>) {
    return (
        <span
            className={joinClasses(
                'rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                tone === 'default' && 'bg-slate-100 text-slate-600',
                tone === 'muted' && 'bg-white text-slate-500',
                tone === 'warm' && 'bg-[#f3ede3] text-slate-600',
            )}
        >
            {children}
        </span>
    );
}

export function ResponsiveCardFields({
    children,
    columns = 1,
    className,
}: PropsWithChildren<{ columns?: 1 | 2; className?: string }>) {
    return (
        <div
            className={joinClasses(
                'mt-3 gap-2 text-sm text-slate-600 sm:mt-4 sm:gap-2.5',
                columns === 2 ? 'grid grid-cols-2' : 'space-y-2',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function ResponsiveCardField({
    label,
    value,
    colSpan = 1,
    tone = 'default',
}: {
    label?: ReactNode;
    value: ReactNode;
    colSpan?: 1 | 2;
    tone?: 'default' | 'danger';
}) {
    return (
        <p
            className={joinClasses(
                'line-clamp-2 rounded-2xl border border-slate-100 px-3 py-2 leading-5 [overflow-wrap:anywhere] sm:py-2.5',
                colSpan === 2 && 'col-span-2',
                tone === 'default' && 'bg-slate-50/85',
                tone === 'danger' && 'bg-[#fff1ec] text-[#be3d2a]',
            )}
        >
            {label ? <span className="font-semibold text-slate-800">{label}</span> : null}
            {label ? ' ' : null}
            {value}
        </p>
    );
}
