import SectionCard from '@/Components/SectionCard';
import StatCard from '@/Components/StatCard';
import { useAntdApp } from '@/hooks/useAntdApp';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';

interface InvoicesPageProps {
    stats: {
        count: number;
        gross_amount: number;
        discount_amount: number;
        paid_amount: number;
    };
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    invoices: Array<{
        id: number;
        store_name: string;
        cnpj: string | null;
        address: string | null;
        invoice_number: string | null;
        series: string | null;
        access_key: string | null;
        receipt_url: string | null;
        issued_at: string | null;
        items_count: number;
        gross_amount: number;
        discount_amount: number;
        paid_amount: number;
        items: Array<{
            id: number;
            product: string | null;
            unit: string | null;
            quantity: number;
            unit_price: number;
            total_amount: number;
            is_discount: boolean;
            notes: string | null;
        }>;
    }>;
}

const buildPageNumbers = (currentPage: number, lastPage: number) => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, currentPage + 2);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export default function InvoicesIndex({ stats, invoices, pagination }: InvoicesPageProps) {
    const { message, modal } = useAntdApp();
    const pageNumbers = buildPageNumbers(
        pagination.current_page,
        pagination.last_page,
    );

    const deleteInvoice = (invoiceId: number) => {
        modal.confirm({
            title: 'Confirmar exclusão',
            content: 'Excluir esta nota fiscal? Isso vai remover também as compras e os lançamentos financeiros gerados por ela.',
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('invoices.destroy', invoiceId), {
                    preserveScroll: true,
                    onSuccess: () => message.info('Nota fiscal excluída com sucesso!'),
                    onError: () => message.error('Erro ao excluir nota fiscal'),
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                            Notas fiscais
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                            Historico das NFC-e fiscais.
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Consulte estabelecimento, itens, valor bruto,
                            desconto e total pago de cada nota.
                        </p>
                    </div>

                    <Link
                        href={route('purchases.index')}
                        className="inline-flex items-center rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5"
                    >
                        Importar nova NFC-e
                    </Link>
                </div>
            }
        >
            <Head title="Notas fiscais" />

            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Notas fiscais"
                        value={String(stats.count)}
                        hint="NFC-e salvas no sistema."
                    />
                    <StatCard
                        label="Valor bruto"
                        value={formatCurrency(stats.gross_amount)}
                        hint="Antes do desconto."
                        tone="bg-[#f3efe6]"
                    />
                    <StatCard
                        label="Descontos"
                        value={formatCurrency(stats.discount_amount)}
                        hint="Soma dos descontos das notas."
                        tone="bg-[#fff1ec]"
                    />
                    <StatCard
                        label="Valor final"
                        value={formatCurrency(stats.paid_amount)}
                        hint="Total efetivamente pago."
                        tone="bg-[#eef7f7]"
                    />
                </div>

                <SectionCard
                    title="Notas registradas"
                    description="Cada card mostra o resumo da nota e os itens que foram lancados."
                >
                    {invoices.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                <span>
                                    Mostrando {pagination.from ?? 0} a {pagination.to ?? 0} de {pagination.total} notas.
                                </span>
                                <span>
                                    {pagination.per_page} por pagina
                                </span>
                            </div>

                            {invoices.map((invoice) => (
                                <details
                                    key={invoice.id}
                                    className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white"
                                >
                                    <summary className="cursor-pointer list-none px-5 py-5">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <p className="text-xl font-semibold text-slate-900">
                                                        {invoice.store_name}
                                                    </p>
                                                    <span className="rounded-full bg-[#eef7f7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                        {invoice.items_count} itens
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-sm text-slate-500">
                                                    {formatDate(invoice.issued_at)}
                                                    {invoice.invoice_number
                                                        ? ` • nota ${invoice.invoice_number}`
                                                        : ''}
                                                    {invoice.series
                                                        ? ` • serie ${invoice.series}`
                                                        : ''}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {invoice.cnpj ?? 'Sem CNPJ'}
                                                    {invoice.address
                                                        ? ` • ${invoice.address}`
                                                        : ''}
                                                </p>
                                            </div>

                                            <div className="grid min-w-[260px] gap-3 sm:grid-cols-3">
                                                <div className="rounded-3xl bg-[#f8f4ec] px-4 py-3">
                                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                        Bruto
                                                    </p>
                                                    <p className="mt-2 font-semibold text-slate-900">
                                                        {formatCurrency(
                                                            invoice.gross_amount,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="rounded-3xl bg-[#fff1ec] px-4 py-3">
                                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                        Desconto
                                                    </p>
                                                    <p className="mt-2 font-semibold text-[#be3d2a]">
                                                        {formatCurrency(
                                                            invoice.discount_amount,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="rounded-3xl bg-[#eef7f7] px-4 py-3">
                                                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                        Pago
                                                    </p>
                                                    <p className="mt-2 font-semibold text-slate-900">
                                                        {formatCurrency(
                                                            invoice.paid_amount,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </summary>

                                    <div className="border-t border-slate-100 px-5 py-5">
                                        <div className="mb-4 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => deleteInvoice(invoice.id)}
                                                className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-700 transition hover:bg-red-100"
                                            >
                                                Excluir nota
                                            </button>
                                        </div>

                                        {invoice.access_key && (
                                            <div className="mb-4 rounded-[22px] bg-slate-50 px-4 py-4">
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                    Chave de acesso
                                                </p>
                                                <p className="mt-2 break-all text-sm text-slate-600">
                                                    {invoice.access_key}
                                                </p>
                                                {invoice.receipt_url && (
                                                    <a
                                                        href={invoice.receipt_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-3 inline-flex text-sm font-semibold text-[#1e7a8a]"
                                                    >
                                                        Abrir consulta publica
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-left text-sm">
                                                <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                    <tr>
                                                        <th className="pb-4">
                                                            Item
                                                        </th>
                                                        <th className="pb-4">
                                                            Quantidade
                                                        </th>
                                                        <th className="pb-4">
                                                            Unitario
                                                        </th>
                                                        <th className="pb-4">
                                                            Total
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {invoice.items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="py-4">
                                                                <div>
                                                                    <p
                                                                        className={`font-semibold ${
                                                                            item.is_discount
                                                                                ? 'text-[#be3d2a]'
                                                                                : 'text-slate-900'
                                                                        }`}
                                                                    >
                                                                        {item.product ??
                                                                            'Produto removido'}
                                                                    </p>
                                                                    {item.notes && (
                                                                        <p className="mt-1 line-clamp-2 text-slate-500">
                                                                            {item.notes}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-slate-600">
                                                                {item.is_discount
                                                                    ? '--'
                                                                    : `${formatQuantity(item.quantity)} ${item.unit ?? ''}`}
                                                            </td>
                                                            <td className="py-4 text-slate-600">
                                                                {formatCurrency(
                                                                    item.unit_price,
                                                                )}
                                                            </td>
                                                            <td
                                                                className={`py-4 font-semibold ${
                                                                    item.is_discount
                                                                        ? 'text-[#be3d2a]'
                                                                        : 'text-slate-900'
                                                                }`}
                                                            >
                                                                {formatCurrency(
                                                                    item.total_amount,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </details>
                            ))}

                            {pagination.last_page > 1 ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                                    <div className="text-sm text-slate-500">
                                        Pagina {pagination.current_page} de {pagination.last_page}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={pagination.current_page === 1}
                                            onClick={() =>
                                                router.get(
                                                    route('invoices.index'),
                                                    { page: pagination.current_page - 1 },
                                                    { preserveScroll: true, preserveState: true },
                                                )
                                            }
                                            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Anterior
                                        </button>

                                        {pageNumbers[0] > 1 ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.get(
                                                            route('invoices.index'),
                                                            { page: 1 },
                                                            { preserveScroll: true, preserveState: true },
                                                        )
                                                    }
                                                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 px-3 text-sm font-semibold text-slate-600"
                                                >
                                                    1
                                                </button>
                                                {pageNumbers[0] > 2 ? (
                                                    <span className="px-1 text-slate-400">...</span>
                                                ) : null}
                                            </>
                                        ) : null}

                                        {pageNumbers.map((page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() =>
                                                    router.get(
                                                        route('invoices.index'),
                                                        { page },
                                                        { preserveScroll: true, preserveState: true },
                                                    )
                                                }
                                                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition ${
                                                    page === pagination.current_page
                                                        ? 'bg-slate-900 text-white'
                                                        : 'border border-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        {pageNumbers[pageNumbers.length - 1] < pagination.last_page ? (
                                            <>
                                                {pageNumbers[pageNumbers.length - 1] < pagination.last_page - 1 ? (
                                                    <span className="px-1 text-slate-400">...</span>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.get(
                                                            route('invoices.index'),
                                                            { page: pagination.last_page },
                                                            { preserveScroll: true, preserveState: true },
                                                        )
                                                    }
                                                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 px-3 text-sm font-semibold text-slate-600"
                                                >
                                                    {pagination.last_page}
                                                </button>
                                            </>
                                        ) : null}

                                        <button
                                            type="button"
                                            disabled={pagination.current_page === pagination.last_page}
                                            onClick={() =>
                                                router.get(
                                                    route('invoices.index'),
                                                    { page: pagination.current_page + 1 },
                                                    { preserveScroll: true, preserveState: true },
                                                )
                                            }
                                            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Proxima
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-sm text-slate-500">
                            Nenhuma nota fiscal importada ainda. Use a tela de
                            compras para importar sua primeira NFC-e.
                        </div>
                    )}
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
