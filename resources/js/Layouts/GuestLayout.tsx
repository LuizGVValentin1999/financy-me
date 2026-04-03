import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="app-safe-screen relative flex items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(224,122,95,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(30,122,138,0.16),transparent_32%)]" />

            <div className="relative w-full max-w-xl">
                <div className="rounded-[34px] border border-white/80 bg-white/92 p-6 shadow-[0_36px_90px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
                    <Link href={route('login')} className="inline-flex items-center gap-3">
                        <ApplicationLogo className="h-12 w-12 text-[#0f172a]" />
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                                Financy Me
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Sua casa digital.
                            </h1>
                        </div>
                    </Link>

                    <div className="mt-7">{children}</div>
                </div>
            </div>
        </div>
    );
}
