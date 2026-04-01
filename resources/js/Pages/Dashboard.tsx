import FormEntityModal from '@/Components/FormEntityModal';
import InputLabel from '@/Components/InputLabel';
import SectionCard from '@/Components/SectionCard';
import StatCard from '@/Components/StatCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useEffect, useMemo, useState } from 'react';

interface DashboardProps {
    filters: {
        start_date: string;
        end_date: string;
        range_label: string;
        category_ids: number[];
        account_ids: number[];
        product_ids: number[];
    };
    stats: {
        entries_count: number;
        distinct_items: number;
        period_quantity: number;
        period_spent: number;
        products_spent: number;
        services_spent: number;
        products_count: number;
        services_count: number;
        average_ticket: number;
        accounts_balance: number;
    };
    entries: Array<{
        id: number;
        product_name: string;
        product_type: 'stockable' | 'non_stockable';
        category: { id: number; name: string; color: string } | null;
        account: { id: number; code: string; name: string } | null;
        quantity: number;
        unit: string;
        total_amount: number;
        source: 'manual' | 'invoice';
        invoice_reference: string | null;
        purchased_at: string | null;
    }>;
    recentEntries: Array<{
        id: number;
        product_name: string;
        product_type: 'stockable' | 'non_stockable';
        category: { id: number; name: string; color: string } | null;
        account: { id: number; code: string; name: string } | null;
        quantity: number;
        unit: string;
        total_amount: number;
        source: 'manual' | 'invoice';
        invoice_reference: string | null;
        purchased_at: string | null;
    }>;
    categories: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    accounts: Array<{
        id: number;
        code: string;
        name: string;
    }>;
    products: Array<{
        id: number;
        name: string;
        type: 'stockable' | 'non_stockable';
        category: { id: number; name: string; color: string } | null;
    }>;
    categoryBreakdown: Array<{
        id: string;
        name: string;
        color: string;
        spent: number;
        quantity: number;
        entries_count: number;
    }>;
}

type DashboardEntry = DashboardProps['entries'][number];
type DashboardTableRecord = DashboardEntry & { key: string };

type FilterDraftState = {
    start_date: string;
    end_date: string;
    category_ids: string[];
    account_ids: string[];
    product_ids: string[];
};

const sourceLabel = (source: 'manual' | 'invoice') =>
    source === 'invoice' ? 'Nota fiscal' : 'Manual';

const typeLabel = (type: 'stockable' | 'non_stockable') =>
    type === 'non_stockable' ? 'Servico' : 'Produto';

const truncateText = (value: string, maxLength = 46) =>
    value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

export default function Dashboard({
    filters,
    stats,
    entries,
    recentEntries,
    categories,
    accounts,
    products,
    categoryBreakdown,
}: DashboardProps) {
    const [search, setSearch] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const [draftFilters, setDraftFilters] = useState<FilterDraftState>({
        start_date: filters.start_date,
        end_date: filters.end_date,
        category_ids: filters.category_ids.map(String),
        account_ids: filters.account_ids.map(String),
        product_ids: filters.product_ids.map(String),
    });

    useEffect(() => {
        setDraftFilters({
            start_date: filters.start_date,
            end_date: filters.end_date,
            category_ids: filters.category_ids.map(String),
            account_ids: filters.account_ids.map(String),
            product_ids: filters.product_ids.map(String),
        });
    }, [filters]);

    const categoryNameById = useMemo(
        () => new Map(categories.map((category) => [category.id, category.name])),
        [categories],
    );
    const accountNameById = useMemo(
        () =>
            new Map(
                accounts.map((account) => [
                    account.id,
                    `${account.code} - ${account.name}`,
                ]),
            ),
        [accounts],
    );
    const productNameById = useMemo(
        () =>
            new Map(
                products.map((product) => [
                    product.id,
                    product.type === 'non_stockable'
                        ? `${product.name} (servico)`
                        : product.name,
                ]),
            ),
        [products],
    );

    const hasAdvancedFilters =
        filters.category_ids.length > 0 ||
        filters.account_ids.length > 0 ||
        filters.product_ids.length > 0;

    const activeFilters = [
        ...filters.category_ids
            .map((id) => categoryNameById.get(id))
            .filter((value): value is string => Boolean(value))
            .map((value) => `Categoria: ${value}`),
        ...filters.account_ids
            .map((id) => accountNameById.get(id))
            .filter((value): value is string => Boolean(value))
            .map((value) => `Cartao/Conta: ${value}`),
        ...filters.product_ids
            .map((id) => productNameById.get(id))
            .filter((value): value is string => Boolean(value))
            .map((value) => `Item: ${value}`),
    ];

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsApplyingFilters(true);

        router.get(
            route('dashboard'),
            {
                start_date: draftFilters.start_date || undefined,
                end_date: draftFilters.end_date || undefined,
                category_ids: draftFilters.category_ids,
                account_ids: draftFilters.account_ids,
                product_ids: draftFilters.product_ids,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onFinish: () => setIsApplyingFilters(false),
                onSuccess: () => setIsFilterModalOpen(false),
            },
        );
    };

    const resetFilters = () => {
        setIsApplyingFilters(true);

        router.get(
            route('dashboard'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onFinish: () => setIsApplyingFilters(false),
                onSuccess: () => setIsFilterModalOpen(false),
            },
        );
    };

    const normalizedSearch = search.trim().toLowerCase();

    const filteredEntries = useMemo(() => {
        if (!normalizedSearch) {
            return entries;
        }

        return entries.filter((entry) => {
            const searchable = [
                entry.product_name,
                entry.category?.name ?? '',
                entry.account ? `${entry.account.code} ${entry.account.name}` : '',
                entry.invoice_reference ?? '',
                sourceLabel(entry.source),
                typeLabel(entry.product_type),
            ]
                .join(' ')
                .toLowerCase();

            return searchable.includes(normalizedSearch);
        });
    }, [entries, normalizedSearch]);

    const dataSource: DashboardTableRecord[] = filteredEntries.map((entry) => ({
        ...entry,
        key: String(entry.id),
    }));

    const topCategory = categoryBreakdown[0] ?? null;

    const mostConsumedProduct = useMemo(() => {
        const aggregateByProduct = new Map<
            string,
            { name: string; quantity: number; spent: number; unit: string }
        >();

        for (const entry of entries) {
            if (entry.product_type !== 'stockable') {
                continue;
            }

            const current = aggregateByProduct.get(entry.product_name);

            if (!current) {
                aggregateByProduct.set(entry.product_name, {
                    name: entry.product_name,
                    quantity: entry.quantity,
                    spent: entry.total_amount,
                    unit: entry.unit,
                });
                continue;
            }

            current.quantity += entry.quantity;
            current.spent += entry.total_amount;
        }

        return [...aggregateByProduct.values()].sort((a, b) => {
            if (b.quantity !== a.quantity) {
                return b.quantity - a.quantity;
            }

            return b.spent - a.spent;
        })[0] ?? null;
    }, [entries]);

    const getTextFilter = (
        dataIndex: keyof DashboardTableRecord,
        placeholder: string,
    ): ColumnsType<DashboardTableRecord>[number] => ({
        filterDropdown: ({
            selectedKeys,
            setSelectedKeys,
            confirm,
            clearFilters,
        }: FilterDropdownProps) => (
            <TableTextFilterDropdown
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                confirm={confirm}
                clearFilters={clearFilters}
                placeholder={placeholder}
            />
        ),
        onFilter: (value: Key | boolean, record: DashboardTableRecord) =>
            String(record[dataIndex] ?? '')
                .toLowerCase()
                .includes(String(value).toLowerCase()),
    });

    const columns: ColumnsType<DashboardTableRecord> = [
        {
            title: 'Item',
            dataIndex: 'product_name',
            key: 'product_name',
            sorter: (a, b) => a.product_name.localeCompare(b.product_name),
            render: (_value, record) => (
                <div>
                    <p className="font-semibold text-slate-900">{record.product_name}</p>
                    <p className="text-slate-500">
                        {sourceLabel(record.source)}
                        {record.invoice_reference ? ` • ${record.invoice_reference}` : ''}
                    </p>
                </div>
            ),
            ...getTextFilter('product_name', 'Filtrar por item'),
        },
        {
            title: 'Tipo',
            dataIndex: 'product_type',
            key: 'product_type',
            render: (_value, record) => (
                <Tag color={record.product_type === 'non_stockable' ? 'magenta' : 'cyan'}>
                    {typeLabel(record.product_type)}
                </Tag>
            ),
            filters: [
                { text: 'Produto', value: 'stockable' },
                { text: 'Servico', value: 'non_stockable' },
            ],
            onFilter: (value: Key | boolean, record: DashboardTableRecord) =>
                record.product_type === String(value),
        },
        {
            title: 'Categoria',
            dataIndex: 'category',
            key: 'category',
            render: (_value, record) =>
                record.category ? <Tag color="cyan">{record.category.name}</Tag> : '--',
            filterDropdown: ({
                selectedKeys,
                setSelectedKeys,
                confirm,
                clearFilters,
            }: FilterDropdownProps) => (
                <div className="w-56 p-3">
                    <Select
                        value={String(selectedKeys[0] ?? '') || undefined}
                        placeholder="Filtrar categoria"
                        className="w-full"
                        onChange={(value: string | undefined) => setSelectedKeys(value ? [value] : [])}
                        options={categories.map((category) => ({
                            value: String(category.id),
                            label: category.name,
                        }))}
                        allowClear
                    />
                    <Space className="mt-3">
                        <Button type="primary" size="small" onClick={() => confirm()}>
                            Aplicar
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                clearFilters?.();
                                confirm();
                            }}
                        >
                            Limpar
                        </Button>
                    </Space>
                </div>
            ),
            onFilter: (value: Key | boolean, record: DashboardTableRecord) =>
                String(record.category?.id ?? '') === String(value),
        },
        {
            title: 'Cartao / Conta',
            dataIndex: 'account',
            key: 'account',
            render: (_value, record) =>
                record.account ? `${record.account.code} - ${record.account.name}` : '--',
            filterDropdown: ({
                selectedKeys,
                setSelectedKeys,
                confirm,
                clearFilters,
            }: FilterDropdownProps) => (
                <div className="w-56 p-3">
                    <Select
                        value={String(selectedKeys[0] ?? '') || undefined}
                        placeholder="Filtrar cartao/conta"
                        className="w-full"
                        onChange={(value: string | undefined) => setSelectedKeys(value ? [value] : [])}
                        options={accounts.map((account) => ({
                            value: String(account.id),
                            label: `${account.code} - ${account.name}`,
                        }))}
                        allowClear
                    />
                    <Space className="mt-3">
                        <Button type="primary" size="small" onClick={() => confirm()}>
                            Aplicar
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                clearFilters?.();
                                confirm();
                            }}
                        >
                            Limpar
                        </Button>
                    </Space>
                </div>
            ),
            onFilter: (value: Key | boolean, record: DashboardTableRecord) =>
                String(record.account?.id ?? '') === String(value),
        },
        {
            title: 'Quantidade',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right',
            sorter: (a, b) => a.quantity - b.quantity,
            render: (_value, record) => `${formatQuantity(record.quantity)} ${record.unit}`,
            ...getTextFilter('quantity', 'Filtrar por quantidade'),
        },
        {
            title: 'Valor',
            dataIndex: 'total_amount',
            key: 'total_amount',
            align: 'right',
            sorter: (a, b) => a.total_amount - b.total_amount,
            render: (_value, record) => (
                <span className={record.total_amount < 0 ? 'font-semibold text-[#be3d2a]' : 'font-semibold text-slate-900'}>
                    {formatCurrency(record.total_amount)}
                </span>
            ),
        },
        {
            title: 'Data',
            dataIndex: 'purchased_at',
            key: 'purchased_at',
            sorter: (a, b) =>
                new Date(a.purchased_at ?? '').getTime() -
                new Date(b.purchased_at ?? '').getTime(),
            render: (_value, record) => formatDate(record.purchased_at),
        },
    ];

    const maxCategorySpent = Math.max(
        ...categoryBreakdown.map((category) => category.spent),
        1,
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Dashboard</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Visao geral da casa.</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Monitore gastos e consumos da casa por periodo, categoria, cartao/conta e produto ou servico.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                        >
                            Filtros avancados
                        </button>
                        <Link
                            href={route('products.index')}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                        >
                            Novo item
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    <StatCard
                        label="Gasto no periodo"
                        value={formatCurrency(stats.period_spent)}
                        hint={filters.range_label}
                        tone="bg-[#fff1ec]"
                    />
                    <StatCard
                        label="Ticket medio"
                        value={formatCurrency(stats.average_ticket)}
                        hint={`${stats.entries_count} movimentacoes`}
                        tone="bg-[#eef7f7]"
                    />
                    <StatCard
                        label="Saldo das contas"
                        value={formatCurrency(stats.accounts_balance)}
                        hint="Saldo acumulado geral"
                        tone="bg-[#edf3ff]"
                    />
                    <StatCard
                        label="Categoria com maior gasto"
                        value={topCategory ? formatCurrency(topCategory.spent) : '--'}
                        hint={
                            topCategory
                                ? `${topCategory.name} • ${topCategory.entries_count} lancamentos`
                                : 'Sem dados no periodo'
                        }
                        tone="bg-[#eaf1fb]"
                    />
                    <StatCard
                        label="Produto mais consumido"
                        value={
                            mostConsumedProduct
                                ? `${formatQuantity(mostConsumedProduct.quantity)} ${mostConsumedProduct.unit}`
                                : '--'
                        }
                        hint={
                            mostConsumedProduct
                                ? `${truncateText(mostConsumedProduct.name)} • ${formatCurrency(mostConsumedProduct.spent)}`
                                : 'Sem consumo de produtos no periodo'
                        }
                        tone="bg-[#f3efe6]"
                    />
                    <StatCard
                        label="Movimentacoes no periodo"
                        value={String(stats.entries_count)}
                        hint={`${stats.products_count} produtos e ${stats.services_count} servicos diferentes`}
                        tone="bg-[#f6efff]"
                    />
                </div>

                <SectionCard
                    title="Gastos e consumos"
                    description={`${filteredEntries.length} registros encontrados. Mesmo padrao da tela de estoque com produtos e servicos juntos.`}
                    actions={
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Pesquisar item, categoria, cartao/conta ou referencia"
                            allowClear
                            className="w-full sm:w-96"
                        />
                    }
                >
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Tag color="geekblue">Periodo: {filters.range_label}</Tag>
                        {hasAdvancedFilters ? (
                            activeFilters.map((label) => (
                                <Tag key={label} color="cyan">
                                    {label}
                                </Tag>
                            ))
                        ) : (
                            <Tag color="default">Sem filtros avancados</Tag>
                        )}
                    </div>

                    <div className="purchase-ant-table">
                        <Table<DashboardTableRecord>
                            rowKey="key"
                            columns={columns}
                            dataSource={dataSource}
                            pagination={{ pageSize: 12, showSizeChanger: true }}
                            size="middle"
                            scroll={{ x: 1200 }}
                        />
                    </div>
                </SectionCard>

                <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                    <SectionCard
                        title="Categorias com maior gasto"
                        description="Leitura rapida para entender para onde o dinheiro esta indo."
                    >
                        <div className="space-y-3">
                            {categoryBreakdown.length > 0 ? (
                                categoryBreakdown.map((category) => (
                                    <div
                                        key={category.id}
                                        className="rounded-[22px] border border-slate-200 bg-white p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="h-3.5 w-3.5 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                <p className="font-semibold text-slate-900">{category.name}</p>
                                            </div>
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(category.spent)}
                                            </p>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.max((category.spent / maxCategorySpent) * 100, 4)}%`,
                                                    backgroundColor: category.color,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-2 text-sm text-slate-500">
                                            {category.entries_count} lancamentos • {formatQuantity(category.quantity)} itens
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[24px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                    Sem dados no periodo selecionado.
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Ultimos lancamentos"
                        description="Visao rapida dos registros mais recentes dentro do periodo filtrado."
                    >
                        <div className="space-y-3">
                            {recentEntries.length > 0 ? (
                                recentEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-[#f8f4ec] px-4 py-4"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-900">{entry.product_name}</p>
                                            <p className="text-sm text-slate-500">
                                                {formatQuantity(entry.quantity)} {entry.unit} • {formatDate(entry.purchased_at)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(entry.total_amount)}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {typeLabel(entry.product_type)} • {sourceLabel(entry.source)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[24px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                    Ainda nao ha lancamentos no periodo.
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>

            <FormEntityModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onSubmit={submitFilters}
                processing={isApplyingFilters}
                sectionLabel="Dashboard"
                title="Filtros avancados"
                description="Filtre por periodo, categorias, cartoes/contas e produtos ou servicos para analisar gastos e consumos da casa."
                saveLabel="Aplicar filtros"
                maxWidth="2xl"
                actions={
                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={resetFilters}
                            disabled={isApplyingFilters}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                        >
                            Limpar tudo
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsFilterModalOpen(false)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isApplyingFilters}
                            className="inline-flex items-center rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            Aplicar filtros
                        </button>
                    </div>
                }
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-600">
                        Inicio
                        <input
                            type="date"
                            value={draftFilters.start_date}
                            onChange={(event) =>
                                setDraftFilters((previous) => ({
                                    ...previous,
                                    start_date: event.target.value,
                                }))
                            }
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        />
                    </label>

                    <label className="text-sm font-semibold text-slate-600">
                        Fim
                        <input
                            type="date"
                            value={draftFilters.end_date}
                            onChange={(event) =>
                                setDraftFilters((previous) => ({
                                    ...previous,
                                    end_date: event.target.value,
                                }))
                            }
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        />
                    </label>
                </div>

                <div>
                    <InputLabel htmlFor="filter-categories" value="Categorias" />
                    <Select
                        id="filter-categories"
                        mode="multiple"
                        value={draftFilters.category_ids}
                        onChange={(value) =>
                            setDraftFilters((previous) => ({
                                ...previous,
                                category_ids: value,
                            }))
                        }
                        className="mt-2 w-full"
                        size="large"
                        allowClear
                        placeholder="Selecione uma ou mais categorias"
                        options={categories.map((category) => ({
                            value: String(category.id),
                            label: category.name,
                        }))}
                    />
                </div>

                <div>
                    <InputLabel htmlFor="filter-accounts" value="Cartoes / Contas" />
                    <Select
                        id="filter-accounts"
                        mode="multiple"
                        value={draftFilters.account_ids}
                        onChange={(value) =>
                            setDraftFilters((previous) => ({
                                ...previous,
                                account_ids: value,
                            }))
                        }
                        className="mt-2 w-full"
                        size="large"
                        allowClear
                        placeholder="Selecione um ou mais cartoes/contas"
                        options={accounts.map((account) => ({
                            value: String(account.id),
                            label: `${account.code} - ${account.name}`,
                        }))}
                    />
                </div>

                <div>
                    <InputLabel htmlFor="filter-products" value="Produtos e servicos" />
                    <Select
                        id="filter-products"
                        mode="multiple"
                        value={draftFilters.product_ids}
                        onChange={(value) =>
                            setDraftFilters((previous) => ({
                                ...previous,
                                product_ids: value,
                            }))
                        }
                        className="mt-2 w-full"
                        size="large"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder="Selecione um ou varios itens"
                        options={products.map((product) => ({
                            value: String(product.id),
                            label:
                                product.type === 'non_stockable'
                                    ? `${product.name} (servico)`
                                    : product.name,
                        }))}
                    />
                </div>
            </FormEntityModal>
        </AuthenticatedLayout>
    );
}
