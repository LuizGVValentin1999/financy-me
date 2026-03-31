import ApplicationLogo from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';
import { Button, Drawer, Menu, type MenuProps, message } from 'antd';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Boxes,
    CircleDollarSign,
    LayoutDashboard,
    LogOut,
    Menu as MenuIcon,
    ReceiptText,
    ScrollText,
    Tags,
    UserCircle2,
    Wallet,
    type LucideIcon,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type NavigationItem = {
    key: string;
    label: string;
    href: string;
    active: boolean;
    icon: LucideIcon;
};

function SidebarContent({
    navigation,
    selectedKey,
    user,
    onNavigate,
}: {
    navigation: NavigationItem[];
    selectedKey?: string;
    user: NonNullable<PageProps['auth']['user']>;
    onNavigate: (key: string) => void;
}) {
    const menuItems: MenuProps['items'] = useMemo(
        () =>
            navigation.map((item) => ({
                key: item.key,
                icon: <item.icon className="h-4 w-4" />,
                label: item.label,
            })),
        [navigation],
    );

    return (
        <>
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

            <Menu
                mode="inline"
                selectedKeys={selectedKey ? [selectedKey] : []}
                items={menuItems}
                className="app-ant-menu mt-8"
                onClick={({ key }) => onNavigate(String(key))}
            />

            <div className="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    Casa Ativa
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                    {user.currentHouse?.name || 'Sem casa'}
                </p>
                {user.currentHouse && (
                    <p className="text-xs text-slate-400">
                        {user.currentHouse.code}
                    </p>
                )}

                <div className="mb-5 mt-5 border-t border-white/10 pt-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                        Conta
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">
                        {user.name}
                    </p>
                    <p className="text-sm text-slate-300">{user.email}</p>
                </div>

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
        </>
    );
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user!;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigation: NavigationItem[] = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            href: route('dashboard'),
            active: route().current('dashboard'),
            icon: LayoutDashboard,
        },
        {
            key: 'accounts',
            label: 'Contas',
            href: route('accounts.index'),
            active: route().current('accounts.*'),
            icon: Wallet,
        },
        {
            key: 'financial',
            label: 'Financeiro',
            href: route('financial.index'),
            active: route().current('financial.*'),
            icon: CircleDollarSign,
        },
        {
            key: 'categories',
            label: 'Categorias',
            href: route('categories.index'),
            active: route().current('categories.*'),
            icon: Tags,
        },
        {
            key: 'products',
            label: 'Produtos',
            href: route('products.index'),
            active: route().current('products.*'),
            icon: Boxes,
        },
        {
            key: 'stock',
            label: 'Estoque',
            href: route('stock.index'),
            active: route().current('stock.*'),
            icon: Boxes,
        },
        {
            key: 'purchases',
            label: 'Compras',
            href: route('purchases.index'),
            active: route().current('purchases.*'),
            icon: ReceiptText,
        },
        {
            key: 'invoices',
            label: 'Notas fiscais',
            href: route('invoices.index'),
            active: route().current('invoices.*'),
            icon: ScrollText,
        },
        {
            key: 'profile',
            label: 'Perfil',
            href: route('profile.edit'),
            active: route().current('profile.*'),
            icon: UserCircle2,
        },
    ];

    const selectedKey = navigation.find((item) => item.active)?.key;
    const lastErrorFlashRef = useRef<string | null>(null);

    useEffect(() => {
        const nextError = flash.error ?? null;

        if (!nextError || lastErrorFlashRef.current === nextError) {
            return;
        }

        lastErrorFlashRef.current = nextError;
        message.error(nextError);
    }, [flash.error]);

    const handleNavigate = (key: string) => {
        const item = navigation.find((entry) => entry.key === key);

        if (!item) {
            return;
        }

        setMobileMenuOpen(false);
        router.visit(item.href);
    };

    return (
        <div className="min-h-screen w-full px-3 py-3 sm:px-4 lg:px-5">
            <div className="flex min-h-[calc(100vh-1.5rem)] w-full gap-3 lg:gap-4 xl:gap-5">
                <aside className="app-sidebar hidden w-[272px] shrink-0 rounded-[32px] border border-white/70 bg-[#0f172a] p-6 text-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.88)] lg:flex lg:flex-col xl:w-[296px]">
                    <SidebarContent
                        navigation={navigation}
                        selectedKey={selectedKey}
                        user={user}
                        onNavigate={handleNavigate}
                    />
                </aside>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/78 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:rounded-[32px]">
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4 sm:px-6 lg:hidden">
                        <Link href="/" className="flex min-w-0 items-center gap-3">
                            <ApplicationLogo className="h-10 w-10 shrink-0 text-slate-900" />
                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                                    Financy Me
                                </p>
                                <p className="truncate text-lg font-semibold text-slate-900">
                                    {user.name}
                                </p>
                            </div>
                        </Link>

                        <Button
                            type="default"
                            shape="circle"
                            icon={<MenuIcon className="h-5 w-5" />}
                            onClick={() => setMobileMenuOpen(true)}
                            className="shrink-0"
                        />
                    </div>

                    <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 xl:px-10">
                        {header && <div className="mb-6">{header}</div>}

                        <main className="w-full">{children}</main>
                    </div>
                </div>
            </div>

            <Drawer
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                placement="left"
                width={320}
                closable={false}
                className="app-mobile-drawer"
                rootClassName="app-mobile-drawer"
                styles={{
                    body: {
                        padding: 24,
                        background: '#0f172a',
                    },
                    header: {
                        display: 'none',
                    },
                }}
            >
                <SidebarContent
                    navigation={navigation}
                    selectedKey={selectedKey}
                    user={user}
                    onNavigate={handleNavigate}
                />
            </Drawer>
        </div>
    );
}
