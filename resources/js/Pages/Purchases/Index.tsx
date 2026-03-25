import Checkbox from '@/Components/Checkbox';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SectionCard from '@/Components/SectionCard';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ColumnDef,
    ColumnFiltersState,
    ExpandedState,
    FilterFn,
    GroupingState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getGroupedRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, GripVertical, ListFilter, X } from 'lucide-react';
import { FormEvent, Fragment, useState } from 'react';

interface PurchasesPageProps {
    products: Array<{
        id: number;
        name: string;
        unit: string;
        current_stock: number;
        category: string | null;
        category_id: number | null;
    }>;
    categories: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    sources: Array<{
        value: string;
        label: string;
    }>;
    importPreview: {
        token: string;
        receipt_url: string | null;
        store_name: string | null;
        cnpj: string | null;
        address: string | null;
        invoice_number: string | null;
        series: string | null;
        issued_at: string | null;
        issued_at_label: string | null;
        access_key: string | null;
        total_items: number;
        total_amount: number;
        discount_amount: number;
        amount_paid: number;
        payment_methods: Array<{
            method: string;
            amount: number;
        }>;
        items: Array<{
            index: number;
            name: string;
            code: string | null;
            quantity: number;
            unit: string;
            unit_price: number;
            total_amount: number;
            is_discount: boolean;
            suggested_product_id: number | null;
            suggested_product_name: string;
            suggested_category_id: number | null;
            suggestion_score: number | null;
        }>;
    } | null;
    entries: Array<{
        id: number;
        product: string | null;
        unit: string | null;
        quantity: number;
        unit_price: number;
        total_amount: number;
        source: string;
        invoice_reference: string | null;
        notes: string | null;
        purchased_at: string | null;
        created_at: string | null;
    }>;
}

function ImportPreviewSection({
    preview,
    products,
    categories,
}: {
    preview: NonNullable<PurchasesPageProps['importPreview']>;
    products: PurchasesPageProps['products'];
    categories: PurchasesPageProps['categories'];
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        token: preview.token,
        items: preview.items.map((item) => ({
            include: true,
            product_id: item.suggested_product_id
                ? String(item.suggested_product_id)
                : '',
            product_name: item.suggested_product_name,
            quantity: String(item.quantity),
            category_id: item.suggested_category_id
                ? String(item.suggested_category_id)
                : '',
        })),
    });

    const updateItem = (
        index: number,
        key: 'include' | 'product_id' | 'product_name' | 'quantity' | 'category_id',
        value: boolean | string,
    ) => {
        setData(
            'items',
            data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        );
    };

    const includedItems = preview.items.filter((_, index) => data.items[index]?.include);
    const includedTotal = includedItems.reduce(
        (total, item) => total + item.total_amount,
        0,
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.import-confirm'), {
            preserveScroll: true,
        });
    };

    return (
        <SectionCard
            title="Revisar NFC-e importada"
            description="Classifique cada item. Você pode reaproveitar um produto existente ou criar um novo pelo nome."
            actions={
                <DangerButton
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() =>
                        router.delete(route('purchases.import-clear'), {
                            preserveScroll: true,
                        })
                    }
                >
                    Limpar rascunho
                </DangerButton>
            }
        >
            <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
                <div className="space-y-4 rounded-[28px] bg-[#f8f4ec] p-5">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                            Estabelecimento
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">
                            {preview.store_name}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            {preview.cnpj}
                            {preview.address ? ` • ${preview.address}` : ''}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Emissao
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {preview.issued_at_label ??
                                    formatDate(preview.issued_at)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Nota
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {preview.invoice_number ?? '--'} / serie{' '}
                                {preview.series ?? '--'}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Valor pago
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {formatCurrency(preview.amount_paid)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Desconto
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {formatCurrency(preview.discount_amount)}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Chave de acesso
                        </p>
                        <p className="mt-2 break-all text-sm text-slate-600">
                            {preview.access_key ?? '--'}
                        </p>
                    </div>

                    {preview.payment_methods.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Pagamentos
                            </p>
                            <div className="mt-3 space-y-2">
                                {preview.payment_methods.map((payment) => (
                                    <div
                                        key={`${payment.method}-${payment.amount}`}
                                        className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm"
                                    >
                                        <span className="text-slate-600">
                                            {payment.method}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {preview.items.map((item, index) => (
                        <div
                            key={`${item.index}-${item.name}`}
                            className={`rounded-[28px] border p-5 transition ${
                                data.items[index].include
                                    ? 'border-slate-200 bg-white'
                                    : 'border-dashed border-slate-200 bg-slate-50/90'
                            }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xl font-semibold text-slate-900">
                                            {item.name}
                                        </p>
                                        {item.suggested_product_id && (
                                            <span className="rounded-full bg-[#eef7f7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                Sugestao {Math.round(item.suggestion_score ?? 0)}%
                                            </span>
                                        )}
                                        {item.is_discount && (
                                            <span className="rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#be3d2a]">
                                                Desconto global
                                            </span>
                                        )}
                                        {!data.items[index].include && (
                                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                Excluido do lancamento
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Nota: {formatQuantity(item.quantity)} {item.unit}{' '}
                                        • {formatCurrency(item.unit_price)} cada
                                        {item.code ? ` • codigo ${item.code}` : ''}
                                    </p>
                                    {item.suggested_product_id && (
                                        <p className="mt-2 text-sm text-slate-600">
                                            Produto mais proximo encontrado:{' '}
                                            <span className="font-semibold text-slate-900">
                                                {item.suggested_product_name}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-full bg-[#eef7f7] px-4 py-2 text-sm font-semibold text-slate-700">
                                    {formatCurrency(item.total_amount)}
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f8f4ec] px-4 py-3">
                                <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                    <Checkbox
                                        checked={data.items[index].include}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'include',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    Incluir este item no estoque
                                </label>

                                <SecondaryButton
                                    type="button"
                                    className="px-4 py-2 text-xs"
                                    onClick={() =>
                                        updateItem(
                                            index,
                                            'include',
                                            !data.items[index].include,
                                        )
                                    }
                                >
                                    {data.items[index].include
                                        ? 'Excluir desta importacao'
                                        : 'Restaurar item'}
                                </SecondaryButton>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-[0.65fr,1fr,1fr]">
                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.quantity`}
                                        value={
                                            item.is_discount
                                                ? 'Quantidade'
                                                : 'Quantidade para estoque'
                                        }
                                    />
                                    <input
                                        id={`items.${index}.quantity`}
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={data.items[index].quantity}
                                        disabled={
                                            !data.items[index].include ||
                                            item.is_discount
                                        }
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'quantity',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        {item.is_discount
                                            ? 'Esse item so ajusta o valor gasto e nao altera o estoque.'
                                            : 'O valor total da nota sera mantido e o custo unitario sera recalculado.'}
                                    </p>
                                    <InputError
                                        message={
                                            errors[`items.${index}.quantity`]
                                        }
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.product_id`}
                                        value="Produto existente"
                                    />
                                    <select
                                        id={`items.${index}.product_id`}
                                        value={data.items[index].product_id}
                                        disabled={!data.items[index].include}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'product_id',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    >
                                        <option value="">Criar pelo nome abaixo</option>
                                        {products.map((product) => (
                                            <option
                                                key={product.id}
                                                value={product.id}
                                            >
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={
                                            errors[
                                                `items.${index}.product_id`
                                            ]
                                        }
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.category_id`}
                                        value="Categoria"
                                    />
                                    <select
                                        id={`items.${index}.category_id`}
                                        value={data.items[index].category_id}
                                        disabled={
                                            !data.items[index].include ||
                                            item.is_discount
                                        }
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'category_id',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    >
                                        <option value="">Sem categoria</option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={
                                            errors[
                                                `items.${index}.category_id`
                                            ]
                                        }
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <InputLabel
                                    htmlFor={`items.${index}.product_name`}
                                    value="Nome do produto para criar"
                                />
                                <input
                                    id={`items.${index}.product_name`}
                                    type="text"
                                    value={data.items[index].product_name}
                                    disabled={!data.items[index].include}
                                    onChange={(event) =>
                                        updateItem(
                                            index,
                                            'product_name',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                                <InputError
                                    message={
                                        errors[`items.${index}.product_name`]
                                    }
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    ))}

                    <input type="hidden" name="token" value={data.token} />
                    <InputError message={errors.token} className="mt-2" />

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] bg-[#f3efe6] px-5 py-5">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                                Total da importacao
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">
                                {formatCurrency(includedTotal)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {includedItems.length} de {preview.items.length} itens selecionados
                            </p>
                        </div>

                        <PrimaryButton disabled={processing}>
                            Confirmar NFC-e
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </SectionCard>
    );
}

type PurchaseEntryRow = PurchasesPageProps['entries'][number];

type FilterMeta = {
    filterVariant?: 'text' | 'select' | 'date' | 'range';
    options?: Array<{ label: string; value: string }>;
};

const textFilter: FilterFn<PurchaseEntryRow> = (row, columnId, value) => {
    const search = String(value ?? '').trim().toLowerCase();

    if (search === '') {
        return true;
    }

    return String(row.getValue(columnId) ?? '')
        .toLowerCase()
        .includes(search);
};

const dateFilter: FilterFn<PurchaseEntryRow> = (row, columnId, value) => {
    if (! value) {
        return true;
    }

    return String(row.getValue(columnId) ?? '') === String(value);
};

const rangeFilter: FilterFn<PurchaseEntryRow> = (row, columnId, value) => {
    const [min, max] = Array.isArray(value) ? value : [];
    const numericValue = Number(row.getValue(columnId) ?? 0);

    if (min !== undefined && min !== '' && numericValue < Number(min)) {
        return false;
    }

    if (max !== undefined && max !== '' && numericValue > Number(max)) {
        return false;
    }

    return true;
};

function PurchaseHistoryTable({
    entries,
    sources,
}: {
    entries: PurchasesPageProps['entries'];
    sources: PurchasesPageProps['sources'];
}) {
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: 'purchased_at',
            desc: true,
        },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [grouping, setGrouping] = useState<GroupingState>([]);
    const [expanded, setExpanded] = useState<ExpandedState>({});

    const columns: ColumnDef<PurchaseEntryRow>[] = [
        {
            accessorKey: 'product',
            header: 'Produto',
            cell: ({ row }) => (
                <div>
                    <p className="font-semibold text-slate-900">
                        {row.original.product ?? 'Produto removido'}
                    </p>
                    <p className="mt-1 text-slate-500">
                        {row.original.unit ?? 'un'}
                    </p>
                </div>
            ),
            filterFn: textFilter,
            enableGrouping: true,
            aggregationFn: 'count',
            aggregatedCell: ({ row, getValue }) => (
                <span className="font-semibold text-slate-900">
                    {String(getValue() ?? row.subRows.length)} itens
                </span>
            ),
            meta: {
                filterVariant: 'text',
            } satisfies FilterMeta,
        },
        {
            accessorKey: 'purchased_at',
            header: 'Data',
            cell: ({ row }) => formatDate(row.original.purchased_at),
            filterFn: dateFilter,
            enableGrouping: true,
            meta: {
                filterVariant: 'date',
            } satisfies FilterMeta,
        },
        {
            accessorKey: 'source',
            header: 'Origem',
            cell: ({ row }) => (
                <span className="rounded-full bg-[#eef7f7] px-3 py-1 text-xs font-semibold text-slate-700">
                    {row.original.source === 'nota_fiscal'
                        ? 'Nota fiscal'
                        : 'Manual'}
                </span>
            ),
            filterFn: textFilter,
            enableGrouping: true,
            meta: {
                filterVariant: 'select',
                options: [
                    {
                        label: 'Todas',
                        value: '',
                    },
                    ...sources,
                ],
            } satisfies FilterMeta,
        },
        {
            accessorKey: 'invoice_reference',
            header: 'Nota',
            cell: ({ row }) => row.original.invoice_reference || '--',
            filterFn: textFilter,
            enableGrouping: true,
            meta: {
                filterVariant: 'text',
            } satisfies FilterMeta,
        },
        {
            accessorKey: 'quantity',
            header: 'Quantidade',
            cell: ({ row }) =>
                `${formatQuantity(row.original.quantity)} ${row.original.unit ?? 'un'}`,
            aggregationFn: 'sum',
            aggregatedCell: ({ getValue }) =>
                formatQuantity(Number(getValue() ?? 0)),
            filterFn: rangeFilter,
            enableGrouping: false,
            meta: {
                filterVariant: 'range',
            } satisfies FilterMeta,
        },
        {
            accessorKey: 'unit_price',
            header: 'Unitario',
            cell: ({ row }) => formatCurrency(row.original.unit_price),
            filterFn: rangeFilter,
            enableGrouping: false,
            meta: {
                filterVariant: 'range',
            } satisfies FilterMeta,
        },
        {
            accessorKey: 'total_amount',
            header: 'Total',
            cell: ({ row }) => (
                <span className="font-semibold text-slate-900">
                    {formatCurrency(row.original.total_amount)}
                </span>
            ),
            aggregationFn: 'sum',
            aggregatedCell: ({ getValue }) => (
                <span className="font-semibold text-slate-900">
                    {formatCurrency(Number(getValue() ?? 0))}
                </span>
            ),
            filterFn: rangeFilter,
            enableGrouping: false,
            meta: {
                filterVariant: 'range',
            } satisfies FilterMeta,
        },
        {
            accessorKey: 'notes',
            header: 'Observacoes',
            cell: ({ row }) => row.original.notes || 'Sem observacoes.',
            filterFn: textFilter,
            enableGrouping: false,
            meta: {
                filterVariant: 'text',
            } satisfies FilterMeta,
        },
        {
            id: 'actions',
            header: 'Acao',
            enableSorting: false,
            enableColumnFilter: false,
            enableGrouping: false,
            cell: ({ row }) => (
                <DangerButton
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() => {
                        if (confirm('Excluir este registro de compra?')) {
                            router.delete(route('purchases.destroy', row.original.id), {
                                preserveScroll: true,
                            });
                        }
                    }}
                >
                    Excluir
                </DangerButton>
            ),
        },
    ];

    const table = useReactTable({
        data: entries,
        columns,
        state: {
            sorting,
            columnFilters,
            grouping,
            expanded,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGroupingChange: setGrouping,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 12,
            },
        },
    });

    const renderFilter = (header: ReturnType<typeof table.getHeaderGroups>[number]['headers'][number]) => {
        const meta = header.column.columnDef.meta as FilterMeta | undefined;
        const filterValue = header.column.getFilterValue();

        if (!header.column.getCanFilter() || !meta?.filterVariant) {
            return null;
        }

        if (meta.filterVariant === 'select') {
            return (
                <select
                    value={String(filterValue ?? '')}
                    onChange={(event) =>
                        header.column.setFilterValue(event.target.value)
                    }
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                    {meta.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        if (meta.filterVariant === 'date') {
            return (
                <input
                    type="date"
                    value={String(filterValue ?? '')}
                    onChange={(event) =>
                        header.column.setFilterValue(event.target.value)
                    }
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
            );
        }

        if (meta.filterVariant === 'range') {
            const [min, max] = Array.isArray(filterValue)
                ? filterValue
                : ['', ''];

            return (
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        value={String(min ?? '')}
                        onChange={(event) =>
                            header.column.setFilterValue([
                                event.target.value,
                                max ?? '',
                            ])
                        }
                        placeholder="Min"
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <input
                        type="number"
                        value={String(max ?? '')}
                        onChange={(event) =>
                            header.column.setFilterValue([
                                min ?? '',
                                event.target.value,
                            ])
                        }
                        placeholder="Max"
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                </div>
            );
        }

        return (
            <input
                type="text"
                value={String(filterValue ?? '')}
                onChange={(event) =>
                    header.column.setFilterValue(event.target.value)
                }
                placeholder="Filtrar"
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
        );
    };

    return (
        <SectionCard
            title="Tabela de compras"
            description="Grade com filtros na propria tabela, agrupamento por coluna, ordenacao e paginação."
        >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#f8f4ec] px-4 py-4 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                        <ListFilter className="h-4 w-4" />
                        {table.getFilteredRowModel().rows.length} registros apos filtros
                    </span>
                    <span>
                        {grouping.length > 0
                            ? `Agrupado por ${grouping.join(', ')}`
                            : 'Sem agrupamento ativo'}
                    </span>
                </div>

                {grouping.length > 0 && (
                    <SecondaryButton
                        type="button"
                        className="px-4 py-2 text-xs"
                        onClick={() => setGrouping([])}
                    >
                        Limpar agrupamento
                    </SecondaryButton>
                )}
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-400">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <Fragment key={headerGroup.id}>
                                    <tr>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-5 py-4 align-top"
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={header.column.getToggleSortingHandler()}
                                                                className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                                                            >
                                                                {flexRender(
                                                                    header
                                                                        .column
                                                                        .columnDef
                                                                        .header,
                                                                    header.getContext(),
                                                                )}
                                                                {header.column.getIsSorted() ===
                                                                    'asc' &&
                                                                    ' ↑'}
                                                                {header.column.getIsSorted() ===
                                                                    'desc' &&
                                                                    ' ↓'}
                                                            </button>

                                                            {header.column.getCanGroup() && (
                                                                <button
                                                                    type="button"
                                                                    onClick={header.column.getToggleGroupingHandler()}
                                                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                                                        header.column.getIsGrouped()
                                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                                                    }`}
                                                                    title="Agrupar por esta coluna"
                                                                >
                                                                    {header.column.getIsGrouped() ? (
                                                                        <X className="h-4 w-4" />
                                                                    ) : (
                                                                        <GripVertical className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {renderFilter(header)}
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </Fragment>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="align-top">
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-5 py-4 text-slate-600"
                                            >
                                                {cell.getIsGrouped() ? (
                                                    <button
                                                        type="button"
                                                        onClick={row.getToggleExpandedHandler()}
                                                        className="inline-flex items-center gap-2 font-semibold text-slate-900"
                                                    >
                                                        {row.getIsExpanded() ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext(),
                                                        )}{' '}
                                                        <span className="text-sm font-medium text-slate-500">
                                                            ({row.subRows.length})
                                                        </span>
                                                    </button>
                                                ) : cell.getIsAggregated() ? (
                                                    flexRender(
                                                        cell.column.columnDef
                                                            .aggregatedCell ??
                                                            cell.column
                                                                .columnDef.cell,
                                                        cell.getContext(),
                                                    )
                                                ) : cell.getIsPlaceholder() ? null : (
                                                    flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext(),
                                                    )
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-5 py-10 text-sm text-slate-500"
                                    >
                                        Nenhuma compra encontrada com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                    Pagina {table.getState().pagination.pageIndex + 1} de{' '}
                    {table.getPageCount() || 1}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={(event) =>
                            table.setPageSize(Number(event.target.value))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                        {[12, 24, 48].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize} linhas
                            </option>
                        ))}
                    </select>

                    <SecondaryButton
                        type="button"
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.previousPage()}
                    >
                        Pagina anterior
                    </SecondaryButton>
                    <SecondaryButton
                        type="button"
                        disabled={!table.getCanNextPage()}
                        onClick={() => table.nextPage()}
                    >
                        Proxima pagina
                    </SecondaryButton>
                </div>
            </div>
        </SectionCard>
    );
}

export default function PurchasesIndex({
    products,
    categories,
    sources,
    importPreview,
    entries,
}: PurchasesPageProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: products[0] ? String(products[0].id) : '',
        quantity: '1',
        unit_price: '0',
        purchased_at: new Date().toISOString().slice(0, 10),
        source: sources[0]?.value ?? 'manual',
        invoice_reference: '',
        notes: '',
    });

    const importForm = useForm({
        receipt_url: importPreview?.receipt_url ?? '',
    });

    const totalPreview =
        Number(data.quantity || 0) * Number(data.unit_price || 0);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.store'), {
            preserveScroll: true,
            onSuccess: () => reset('quantity', 'unit_price', 'invoice_reference', 'notes'),
        });
    };

    const submitImport = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        importForm.post(route('purchases.import-link'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                        Compras
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                        Registre entradas no estoque.
                    </h1>
                </div>
            }
        >
            <Head title="Compras" />

            <div className="space-y-6">
                <SectionCard
                    title="Importar compra por link da NFC-e"
                    description="Cole o link publico da SEFAZ do Parana. O sistema busca os itens da nota, monta um rascunho e voce classifica cada produto antes de confirmar."
                >
                    <form onSubmit={submitImport} className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="receipt_url"
                                value="Link da NFC-e"
                            />
                            <input
                                id="receipt_url"
                                type="text"
                                value={importForm.data.receipt_url}
                                onChange={(event) =>
                                    importForm.setData(
                                        'receipt_url',
                                        event.target.value,
                                    )
                                }
                                placeholder="https://www.fazenda.pr.gov.br/nfce/qrcode?p=..."
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={importForm.errors.receipt_url}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#f8f4ec] px-4 py-4 text-sm text-slate-600">
                            <span>
                                Suporte inicial para consulta publica da NFC-e
                                do Parana.
                            </span>
                            <PrimaryButton disabled={importForm.processing}>
                                Buscar nota
                            </PrimaryButton>
                        </div>
                    </form>
                </SectionCard>

                {importPreview && (
                    <ImportPreviewSection
                        preview={importPreview}
                        products={products}
                        categories={categories}
                    />
                )}

                <SectionCard
                    title="Nova compra manual"
                    description="Cada registro aumenta o estoque do produto automaticamente."
                >
                    {products.length > 0 ? (
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <InputLabel
                                    htmlFor="product_id"
                                    value="Produto"
                                />
                                <select
                                    id="product_id"
                                    value={data.product_id}
                                    onChange={(event) =>
                                        setData(
                                            'product_id',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                >
                                    {products.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.product_id}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="quantity"
                                        value="Quantidade"
                                    />
                                    <input
                                        id="quantity"
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={data.quantity}
                                        onChange={(event) =>
                                            setData(
                                                'quantity',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    />
                                    <InputError
                                        message={errors.quantity}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="unit_price"
                                        value="Preco unitario"
                                    />
                                    <input
                                        id="unit_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.unit_price}
                                        onChange={(event) =>
                                            setData(
                                                'unit_price',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    />
                                    <InputError
                                        message={errors.unit_price}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="purchased_at"
                                        value="Data da compra"
                                    />
                                    <input
                                        id="purchased_at"
                                        type="date"
                                        value={data.purchased_at}
                                        onChange={(event) =>
                                            setData(
                                                'purchased_at',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="source"
                                        value="Origem"
                                    />
                                    <select
                                        id="source"
                                        value={data.source}
                                        onChange={(event) =>
                                            setData(
                                                'source',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    >
                                        {sources.map((source) => (
                                            <option
                                                key={source.value}
                                                value={source.value}
                                            >
                                                {source.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="invoice_reference"
                                    value="Referencia da nota"
                                />
                                <input
                                    id="invoice_reference"
                                    type="text"
                                    value={data.invoice_reference}
                                    onChange={(event) =>
                                        setData(
                                            'invoice_reference',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="notes"
                                    value="Observacoes"
                                />
                                <textarea
                                    id="notes"
                                    rows={4}
                                    value={data.notes}
                                    onChange={(event) =>
                                        setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>

                            <div className="rounded-[28px] bg-[#f8f4ec] p-5">
                                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                                    Total previsto
                                </p>
                                <p className="mt-3 text-3xl font-semibold text-slate-900">
                                    {formatCurrency(totalPreview)}
                                </p>
                            </div>

                            <PrimaryButton disabled={processing}>
                                Registrar compra
                            </PrimaryButton>
                        </form>
                    ) : (
                        <div className="rounded-[28px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                            Cadastre um produto antes de registrar compras.
                        </div>
                    )}
                </SectionCard>

                <PurchaseHistoryTable
                    entries={entries}
                    sources={sources}
                />
            </div>
        </AuthenticatedLayout>
    );
}
