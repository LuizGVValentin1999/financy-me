import SectionCard from '@/Components/SectionCard';
import StatCard from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent } from 'react';

interface DashboardProps {
    filters: {
        start_date: string;
        end_date: string;
        range_label: string;
    };
    stats: {
        categories: number;
        products: number;
        current_stock: number;
        period_quantity: number;
        period_spent: number;
    };
    products: Array<{
        id: number;
        name: string;
        unit: string;
        current_stock: number;
        minimum_stock: number;
        category: { name: string; color: string } | null;
        period_quantity: number;
        period_spent: number;
        last_purchase_at: string | null;
    }>;
    recentEntries: Array<{
        id: number;
        product: string | null;
        unit: string | null;
        quantity: number;
        total_amount: number;
        source: string;
        invoice_reference: string | null;
        purchased_at: string | null;
    }>;
    categoryBreakdown: Array<{
        id: number;
        name: string;
        kind: string;
        color: string;
        products_count: number;
    }>;
}

export default function Dashboard({
    filters,
    stats,
    products,
    recentEntries,
    categoryBreakdown,
}: DashboardProps) {
    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        router.get(
            route('dashboard'),
            {
                start_date: String(formData.get('start_date') || ''),
                end_date: String(formData.get('end_date') || ''),
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                            Dashboard
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                            Visao geral da casa.
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Acompanhe estoque atual, compras por periodo e o que
                            precisa de reposicao.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={route('products.index')}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                        >
                            Novo produto
                        </Link>
                        <Link
                            href={route('purchases.index')}
                            className="inline-flex items-center rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5"
                        >
                            Registrar compra
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatCard
                        label="Categorias"
                        value={String(stats.categories)}
                        hint="Tipos de produto e servico cadastrados."
                    />
                    <StatCard
                        label="Produtos"
                        value={String(stats.products)}
                        hint="Itens ativos para acompanhar em casa."
                        tone="bg-[#eef7f7]"
                    />
                    <StatCard
                        label="Estoque atual"
                        value={formatQuantity(stats.current_stock)}
                        hint="Soma do estoque disponivel agora."
                        tone="bg-[#fff1ec]"
                    />
                    <StatCard
                        label="Comprado no periodo"
                        value={formatQuantity(stats.period_quantity)}
                        hint={filters.range_label}
                        tone="bg-[#f3efe6]"
                    />
                    <StatCard
                        label="Gasto no periodo"
                        value={formatCurrency(stats.period_spent)}
                        hint={filters.range_label}
                        tone="bg-[#eaf1fb]"
                    />
                </div>

                <SectionCard
                    title="Filtro do dashboard"
                    description="Use o intervalo para recalcular quanto foi comprado e quanto foi gasto."
                >
                    <form
                        onSubmit={submitFilters}
                        className="grid gap-4 md:grid-cols-[1fr,1fr,auto]"
                    >
                        <label className="text-sm font-semibold text-slate-600">
                            Inicio
                            <input
                                type="date"
                                name="start_date"
                                defaultValue={filters.start_date}
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                        </label>
                        <label className="text-sm font-semibold text-slate-600">
                            Fim
                            <input
                                type="date"
                                name="end_date"
                                defaultValue={filters.end_date}
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                        </label>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center self-end rounded-full bg-[#e07a5f] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(224,122,95,0.8)] transition hover:-translate-y-0.5"
                        >
                            Aplicar filtro
                        </button>
                    </form>
                </SectionCard>

                <SectionCard
                    title="Resumo por produto"
                    description="Veja o estoque atual e o total comprado dentro do periodo filtrado."
                >
                    {products.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                    <tr>
                                        <th className="pb-4">Produto</th>
                                        <th className="pb-4">Categoria</th>
                                        <th className="pb-4">Estoque</th>
                                        <th className="pb-4">Comprado</th>
                                        <th className="pb-4">Gasto</th>
                                        <th className="pb-4">Ultima compra</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="py-4">
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-slate-500">
                                                        Unidade: {product.unit}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                {product.category ? (
                                                    <span
                                                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-slate-900"
                                                        style={{
                                                            backgroundColor: `${product.category.color}22`,
                                                        }}
                                                    >
                                                        {product.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        Sem categoria
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                <span
                                                    className={`font-semibold ${
                                                        product.current_stock <=
                                                        product.minimum_stock
                                                            ? 'text-[#be3d2a]'
                                                            : 'text-slate-900'
                                                    }`}
                                                >
                                                    {formatQuantity(
                                                        product.current_stock,
                                                    )}{' '}
                                                    {product.unit}
                                                </span>
                                            </td>
                                            <td className="py-4 text-slate-600">
                                                {formatQuantity(
                                                    product.period_quantity,
                                                )}{' '}
                                                {product.unit}
                                            </td>
                                            <td className="py-4 text-slate-600">
                                                {formatCurrency(
                                                    product.period_spent,
                                                )}
                                            </td>
                                            <td className="py-4 text-slate-600">
                                                {formatDate(
                                                    product.last_purchase_at,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-[24px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                            Nenhum produto cadastrado ainda. Comece em
                            Produtos e depois registre as compras.
                        </div>
                    )}
                </SectionCard>

                <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                    <SectionCard
                        title="Ultimas compras"
                        description="Entradas recentes para acompanhar seu historico."
                    >
                        <div className="space-y-3">
                            {recentEntries.length > 0 ? (
                                recentEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-[#f8f4ec] px-4 py-4"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {entry.product ?? 'Produto removido'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {formatQuantity(entry.quantity)}{' '}
                                                {entry.unit ?? 'un'} em{' '}
                                                {formatDate(entry.purchased_at)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(
                                                    entry.total_amount,
                                                )}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {entry.source === 'nota_fiscal'
                                                    ? 'Nota fiscal'
                                                    : 'Manual'}
                                                {entry.invoice_reference
                                                    ? ` • ${entry.invoice_reference}`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[24px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                    Ainda nao ha compras registradas.
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Categorias"
                        description="Distribuicao atual da base cadastrada."
                    >
                        <div className="space-y-3">
                            {categoryBreakdown.length > 0 ? (
                                categoryBreakdown.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between rounded-[24px] bg-white px-4 py-4 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="h-4 w-4 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        category.color,
                                                }}
                                            />
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {category.name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {category.kind}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600">
                                            {category.products_count} itens
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[24px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                    Nenhuma categoria cadastrada ainda.
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
