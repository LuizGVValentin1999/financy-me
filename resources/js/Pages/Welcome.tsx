import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }: PageProps) {
    return (
        <>
            <Head title="Financy Me" />

            <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid w-full gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                    <div className="rounded-[36px] border border-white/70 bg-[#0f172a] px-8 py-10 text-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.85)] sm:px-10">
                        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
                            Laravel + React + Vite
                        </p>
                        <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-[#f8f4ec] sm:text-6xl">
                            Controle seu estoque e as financas da casa com menos
                            planilha e mais clareza.
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                            Base pronta para login, categorias, produtos,
                            compras e em seguida importacao de nota fiscal com
                            classificacao manual.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center rounded-full bg-[#e07a5f] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(224,122,95,0.8)] transition hover:-translate-y-0.5"
                                >
                                    Abrir dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center rounded-full bg-[#e07a5f] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(224,122,95,0.8)] transition hover:-translate-y-0.5"
                                    >
                                        Criar conta
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                    >
                                        Entrar
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="rounded-[30px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.3)]">
                            <h2 className="text-3xl font-semibold text-slate-900">
                                O que ja esta preparado
                            </h2>
                            <div className="mt-6 grid gap-4">
                                <div className="rounded-3xl bg-[#f8f4ec] p-5">
                                    Login e cadastro com React no front.
                                </div>
                                <div className="rounded-3xl bg-[#eef7f7] p-5">
                                    Cadastro de categorias, produtos e registro
                                    de compras.
                                </div>
                                <div className="rounded-3xl bg-[#fff1ec] p-5">
                                    Dashboard com filtro por periodo para saber
                                    quanto comprou e quanto ainda tem.
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[30px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.3)]">
                            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                                Proximas fatias
                            </p>
                            <ul className="mt-4 space-y-3 text-sm text-slate-700">
                                <li>Importacao de nota fiscal.</li>
                                <li>Classificacao manual dos itens importados.</li>
                                <li>Movimentacao de saida e relatorios mais completos.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
