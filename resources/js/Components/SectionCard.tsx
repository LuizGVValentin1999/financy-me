import { PropsWithChildren, ReactNode } from 'react';

export default function SectionCard({
    title,
    description,
    actions,
    className = '',
    children,
}: PropsWithChildren<{
    title?: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}>) {
    return (
        <section
            className={
                'rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.35)] ' +
                className
            }
        >
            {(title || description || actions) && (
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        {title && (
                            <h3 className="text-2xl font-semibold text-slate-900">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>

                    {actions}
                </div>
            )}

            {children}
        </section>
    );
}
