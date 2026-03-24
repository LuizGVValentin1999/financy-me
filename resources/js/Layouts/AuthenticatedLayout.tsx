import ApplicationLogo from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Boxes,
    LayoutDashboard,
    LogOut,
    Menu,
    ReceiptText,
    Tags,
    UserCircle2,
    X,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user!;
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const navigation = [
        {
            label: 'Dashboard',
            href: route('dashboard'),
            active: route().current('dashboard'),
            icon: LayoutDashboard,
        },
        {
            label: 'Categorias',
            href: route('categories.index'),
            active: route().current('categories.*'),
            icon: Tags,
        },
        {
            label: 'Produtos',
            href: route('products.index'),
            active: route().current('products.*'),
            icon: Boxes,
        },
        {
            label: 'Compras',
            href: route('purchases.index'),
            active: route().current('purchases.*'),
            icon: ReceiptText,
        },
        {
            label: 'Perfil',
            href: route('profile.edit'),
            active: route().current('profile.*'),
            icon: UserCircle2,
        },
    ];

    return (
        <div className="min-h-screen">
            <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
                <aside className="hidden w-72 shrink-0 rounded-[32px] border border-white/70 bg-[#0f172a] p-6 text-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.88)] lg:flex lg:flex-col">
                    <Link href="/" className="flex items-center gap-4">
                        <ApplicationLogo className="h-12 w-12 text-[#f8f4ec]" />
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                Financy Me
                            </p>
                            <h1 className="text-2xl font-semibold text-[#f8f4ec]">
                                Casa em ordem.
                            </h1>
                        </div>
                    </Link>

                    <p className="mt-8 text-sm leading-7 text-slate-300">
                        Estoque, compras e categorias num fluxo simples para uso
                        domestico.
                    </p>

                    <nav className="mt-8 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                                        item.active
                                            ? 'bg-white text-slate-900 shadow-lg'
                                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                            Conta
                        </p>
                        <p className="mt-3 text-lg font-semibold text-white">
                            {user.name}
                        </p>
                        <p className="text-sm text-slate-300">{user.email}</p>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </Link>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col rounded-[32px] border border-white/80 bg-white/75 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-5 sm:px-7 lg:hidden">
                        <Link href="/" className="flex items-center gap-3">
                            <ApplicationLogo className="h-10 w-10 text-slate-900" />
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                                    Financy Me
                                </p>
                                <p className="text-lg font-semibold text-slate-900">
                                    {user.name}
                                </p>
                            </div>
                        </Link>

                        <button
                            type="button"
                            onClick={() =>
                                setShowingNavigationDropdown((state) => !state)
                            }
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
                        >
                            {showingNavigationDropdown ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {showingNavigationDropdown && (
                        <div className="space-y-3 border-b border-slate-200/80 px-5 py-5 lg:hidden">
                            {navigation.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                                            item.active
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                                <LogOut className="h-4 w-4" />
                                Sair
                            </Link>
                        </div>
                    )}

                    <div className="flex-1 px-5 py-6 sm:px-7">
                        {header && <div className="mb-6">{header}</div>}

                        {(flash.success || flash.error) && (
                            <div
                                className={`mb-6 rounded-[24px] border px-5 py-4 text-sm font-semibold ${
                                    flash.success
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                        : 'border-rose-200 bg-rose-50 text-rose-900'
                                }`}
                            >
                                {flash.success ?? flash.error}
                            </div>
                        )}

                        <main>{children}</main>
                    </div>
                </div>
            </div>
        </div>
    );
}
