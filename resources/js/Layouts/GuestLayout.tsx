import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(224,122,95,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(30,122,138,0.14),transparent_30%)]" />
            <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-[32px] border border-white/70 bg-[#0f172a] px-8 py-10 text-white shadow-[0_30px_80px_-28px_rgba(15,23,42,0.85)]">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <ApplicationLogo className="h-14 w-14 text-[#f8f4ec]" />
                        <div>
                            <p className="text-sm uppercase tracking-[0.28em] text-[#f8f4ec]/60">
                                Financy Me
                            </p>
                            <h1 className="text-3xl font-semibold text-[#f8f4ec]">
                                Estoque e casa no mesmo painel.
                            </h1>
                        </div>
                    </Link>

                    <div className="mt-12 space-y-5 text-sm text-slate-300">
                        <p className="max-w-lg text-base leading-7 text-slate-200">
                            Controle compras, acompanhe itens em casa e prepare a
                            base para importar notas fiscais e classificar tudo
                            por categoria.
                        </p>
                        <div className="grid gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                                Controle seus gastos.
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                                Categorias de produtos e servicos organizadas por
                                voce.
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                                Historico de compras para medir estoque e gasto
                                por periodo.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[32px] border border-white/80 bg-white/85 p-6 shadow-[0_30px_80px_-30px_rgba(148,163,184,0.55)] backdrop-blur sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
