import FormEntityModal from '@/Components/FormEntityModal';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import ResponsiveDataTable from '@/Components/ResponsiveDataTable';
import SecondaryButton from '@/Components/SecondaryButton';
import {
    ResponsiveCard,
    ResponsiveCardField,
    ResponsiveCardFields,
    ResponsiveCardHeader,
    ResponsiveCardPill,
    ResponsiveCardPills,
} from '@/Components/responsive-table/ResponsiveCard';
import SectionCard from '@/Components/SectionCard';
import StatCard from '@/Components/StatCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { Button, DatePicker, Input, Select, Space, Tabs, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import dayjs from 'dayjs';
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
        product_id: number | null;
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
        current_balance: number;
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
    stockMovements: Array<{
        id: string;
        product_id: number | null;
        product_name: string | null;
        brand: string | null;
        sku: string | null;
        unit: string;
        category: { id: number; name: string; color: string } | null;
        current_stock: number;
        direction: 'inflow' | 'outflow';
        origin: 'manual_purchase' | 'invoice_purchase' | 'manual_withdrawal' | string;
        quantity: number;
        moved_at: string | null;
        notes: string | null;
        reference: string | null;
    }>;
    accountMovements: Array<{
        id: number;
        account_id: number | null;
        account: { id: number; code: string; name: string } | null;
        category: { id: number; name: string; color: string } | null;
        direction: 'inflow' | 'outflow';
        origin: string;
        amount: number;
        moved_at: string | null;
        description: string | null;
        reference: string | null;
        related_items: string[];
    }>;
}

type DashboardEntry = DashboardProps['entries'][number];
type DashboardTableRecord = DashboardEntry & { key: string };
type StockMovementRow = DashboardProps['stockMovements'][number];
type AccountMovementRow = DashboardProps['accountMovements'][number];
type ConsumptionSummaryRow = {
    key: string;
    product_id: number;
    product_name: string;
    brand: string | null;
    sku: string | null;
    unit: string;
    category: StockMovementRow['category'];
    current_stock: number;
    total_output: number;
    withdrawals_count: number;
    first_output_at: string | null;
    last_output_at: string | null;
};
type AccountMovementSummaryRow = {
    key: string;
    account_id: number;
    account_code: string;
    account_name: string;
    current_balance: number;
    total_inflow: number;
    total_outflow: number;
    movements_count: number;
    first_moved_at: string | null;
    last_moved_at: string | null;
};

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
    type === 'non_stockable' ? 'Serviço' : 'Produto';

const stockMovementOriginLabel = (origin: StockMovementRow['origin']) => {
    if (origin === 'manual_purchase') return 'Compra manual';
    if (origin === 'invoice_purchase') return 'Compra importada';
    if (origin === 'manual_withdrawal') return 'Saida manual';

    return origin;
};

const stockMovementDirectionLabel = (direction: StockMovementRow['direction']) =>
    direction === 'inflow' ? 'Entrada' : 'Saida';

const accountMovementOriginLabel = (origin: string) => {
    if (origin === 'manual') return 'Lançamento manual';
    if (origin === 'manual_purchase') return 'Compra manual';
    if (origin === 'invoice_purchase') return 'Compra importada';

    return origin;
};

const accountMovementDirectionLabel = (direction: AccountMovementRow['direction']) =>
    direction === 'inflow' ? 'Entrada' : 'Saida';

const formatMovementMoment = (value: string | null) => {
    if (!value) {
        return '--';
    }

    const parsed = dayjs(value);

    if (!parsed.isValid()) {
        return '--';
    }

    return parsed.hour() === 0 && parsed.minute() === 0
        ? parsed.format('DD/MM/YYYY')
        : parsed.format('DD/MM/YYYY HH:mm');
};

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
    stockMovements,
    accountMovements,
}: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'expenses' | 'consumption' | 'accounts'>('expenses');
    const [search, setSearch] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isApplyingFilters, setIsApplyingFilters] = useState(false);
    const [selectedConsumptionProduct, setSelectedConsumptionProduct] = useState<ConsumptionSummaryRow | null>(null);
    const [selectedAccountSummary, setSelectedAccountSummary] = useState<AccountMovementSummaryRow | null>(null);
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
                        ? `${product.name} (serviço)`
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

    const filteredConsumptionMovements = useMemo(
        () =>
            stockMovements.filter((movement) => {
                if (movement.direction !== 'outflow' || !movement.product_id) {
                    return false;
                }

                if (!normalizedSearch) {
                    return true;
                }

                const searchable = [
                    movement.product_name ?? '',
                    movement.brand ?? '',
                    movement.sku ?? '',
                    movement.category?.name ?? '',
                    movement.notes ?? '',
                    stockMovementOriginLabel(movement.origin),
                ]
                    .join(' ')
                    .toLowerCase();

                return searchable.includes(normalizedSearch);
            }),
        [normalizedSearch, stockMovements],
    );

    const consumptionSummary = useMemo<ConsumptionSummaryRow[]>(() => {
        const grouped = new Map<number, ConsumptionSummaryRow>();

        for (const movement of filteredConsumptionMovements) {
            if (!movement.product_id) {
                continue;
            }

            const current = grouped.get(movement.product_id);

            if (!current) {
                grouped.set(movement.product_id, {
                    key: String(movement.product_id),
                    product_id: movement.product_id,
                    product_name: movement.product_name ?? 'Produto removido',
                    brand: movement.brand,
                    sku: movement.sku,
                    unit: movement.unit,
                    category: movement.category,
                    current_stock: movement.current_stock,
                    total_output: movement.quantity,
                    withdrawals_count: 1,
                    first_output_at: movement.moved_at,
                    last_output_at: movement.moved_at,
                });

                continue;
            }

            current.total_output += movement.quantity;
            current.withdrawals_count += 1;
            current.current_stock = movement.current_stock;

            if (movement.moved_at && (!current.first_output_at || dayjs(movement.moved_at).isBefore(dayjs(current.first_output_at)))) {
                current.first_output_at = movement.moved_at;
            }

            if (movement.moved_at && (!current.last_output_at || dayjs(movement.moved_at).isAfter(dayjs(current.last_output_at)))) {
                current.last_output_at = movement.moved_at;
            }
        }

        return [...grouped.values()].sort((a, b) => {
            if (b.total_output !== a.total_output) {
                return b.total_output - a.total_output;
            }

            return a.product_name.localeCompare(b.product_name);
        });
    }, [filteredConsumptionMovements]);

    const filteredAccountMovements = useMemo(
        () =>
            accountMovements.filter((movement) => {
                if (!movement.account_id) {
                    return false;
                }

                if (!normalizedSearch) {
                    return true;
                }

                const searchable = [
                    movement.account ? `${movement.account.code} ${movement.account.name}` : '',
                    movement.category?.name ?? '',
                    movement.description ?? '',
                    movement.reference ?? '',
                    movement.related_items.join(' '),
                    accountMovementOriginLabel(movement.origin),
                    accountMovementDirectionLabel(movement.direction),
                ]
                    .join(' ')
                    .toLowerCase();

                return searchable.includes(normalizedSearch);
            }),
        [accountMovements, normalizedSearch],
    );

    const accountSummary = useMemo<AccountMovementSummaryRow[]>(() => {
        const accountsById = new Map(accounts.map((account) => [account.id, account]));
        const grouped = new Map<number, AccountMovementSummaryRow>();

        for (const movement of filteredAccountMovements) {
            if (!movement.account_id || !movement.account) {
                continue;
            }

            const current = grouped.get(movement.account_id);
            const account = accountsById.get(movement.account_id);

            if (!current) {
                grouped.set(movement.account_id, {
                    key: String(movement.account_id),
                    account_id: movement.account_id,
                    account_code: movement.account.code,
                    account_name: movement.account.name,
                    current_balance: account?.current_balance ?? 0,
                    total_inflow: movement.direction === 'inflow' ? movement.amount : 0,
                    total_outflow: movement.direction === 'outflow' ? movement.amount : 0,
                    movements_count: 1,
                    first_moved_at: movement.moved_at,
                    last_moved_at: movement.moved_at,
                });

                continue;
            }

            current.movements_count += 1;
            current.current_balance = account?.current_balance ?? current.current_balance;

            if (movement.direction === 'inflow') {
                current.total_inflow += movement.amount;
            } else {
                current.total_outflow += movement.amount;
            }

            if (movement.moved_at && (!current.first_moved_at || dayjs(movement.moved_at).isBefore(dayjs(current.first_moved_at)))) {
                current.first_moved_at = movement.moved_at;
            }

            if (movement.moved_at && (!current.last_moved_at || dayjs(movement.moved_at).isAfter(dayjs(current.last_moved_at)))) {
                current.last_moved_at = movement.moved_at;
            }
        }

        return [...grouped.values()].sort((a, b) => {
            const movementDelta = Math.max(b.total_inflow, b.total_outflow) - Math.max(a.total_inflow, a.total_outflow);

            if (movementDelta !== 0) {
                return movementDelta;
            }

            return a.account_name.localeCompare(b.account_name);
        });
    }, [accounts, filteredAccountMovements]);

    const topCategory = categoryBreakdown[0] ?? null;

    const mostConsumedProduct = useMemo(() => {
        const aggregateByProduct = new Map<
            string,
            { name: string; quantity: number; unit: string }
        >();

        for (const movement of stockMovements) {
            if (movement.direction !== 'outflow' || !movement.product_name) {
                continue;
            }

            const current = aggregateByProduct.get(movement.product_name);

            if (!current) {
                aggregateByProduct.set(movement.product_name, {
                    name: movement.product_name,
                    quantity: movement.quantity,
                    unit: movement.unit,
                });
                continue;
            }

            current.quantity += movement.quantity;
        }

        return [...aggregateByProduct.values()].sort((a, b) => {
            if (b.quantity !== a.quantity) {
                return b.quantity - a.quantity;
            }

            return a.name.localeCompare(b.name);
        })[0] ?? null;
    }, [stockMovements]);

    const selectedConsumptionHistory = useMemo(
        () =>
            selectedConsumptionProduct
                ? stockMovements
                    .filter((movement) => movement.product_id === selectedConsumptionProduct.product_id)
                    .sort((a, b) => dayjs(b.moved_at).valueOf() - dayjs(a.moved_at).valueOf())
                : [],
        [selectedConsumptionProduct, stockMovements],
    );

    const selectedAccountHistory = useMemo(
        () =>
            selectedAccountSummary
                ? accountMovements
                    .filter((movement) => movement.account_id === selectedAccountSummary.account_id)
                    .sort((a, b) => dayjs(b.moved_at).valueOf() - dayjs(a.moved_at).valueOf())
                : [],
        [accountMovements, selectedAccountSummary],
    );

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
                { text: 'Serviço', value: 'non_stockable' },
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
                dayjs(a.purchased_at ?? '').valueOf() -
                dayjs(b.purchased_at ?? '').valueOf(),
            render: (_value, record) => formatDate(record.purchased_at),
        },
    ];

    const consumptionColumns: ColumnsType<ConsumptionSummaryRow> = [
        {
            title: 'Produto',
            dataIndex: 'product_name',
            key: 'product_name',
            sorter: (a, b) => a.product_name.localeCompare(b.product_name),
            render: (_value, record) => (
                <div>
                    <p className="font-semibold text-slate-900">{record.product_name}</p>
                    <p className="text-slate-500">
                        {record.brand || 'Sem marca'}
                        {record.sku ? ` • ${record.sku}` : ''}
                    </p>
                </div>
            ),
        },
        {
            title: 'Categoria',
            dataIndex: 'category',
            key: 'category',
            render: (_value, record) =>
                record.category ? <Tag color="cyan">{record.category.name}</Tag> : '--',
        },
        {
            title: 'Saida no período',
            dataIndex: 'total_output',
            key: 'total_output',
            align: 'right',
            sorter: (a, b) => a.total_output - b.total_output,
            render: (_value, record) => `${formatQuantity(record.total_output)} ${record.unit}`,
        },
        {
            title: 'Movimentacoes',
            dataIndex: 'withdrawals_count',
            key: 'withdrawals_count',
            align: 'right',
            sorter: (a, b) => a.withdrawals_count - b.withdrawals_count,
        },
        {
            title: 'Última saida',
            dataIndex: 'last_output_at',
            key: 'last_output_at',
            sorter: (a, b) => dayjs(a.last_output_at).valueOf() - dayjs(b.last_output_at).valueOf(),
            render: (value) => formatDate(value),
        },
        {
            title: 'Estoque atual',
            dataIndex: 'current_stock',
            key: 'current_stock',
            align: 'right',
            render: (_value, record) => `${formatQuantity(record.current_stock)} ${record.unit}`,
        },
    ];

    const accountMovementColumns: ColumnsType<AccountMovementSummaryRow> = [
        {
            title: 'Conta',
            dataIndex: 'account_name',
            key: 'account_name',
            sorter: (a, b) => a.account_name.localeCompare(b.account_name),
            render: (_value, record) => (
                <div>
                    <p className="font-semibold text-slate-900">
                        {record.account_code} - {record.account_name}
                    </p>
                    <p className="text-slate-500">{record.movements_count} movimentacoes no período</p>
                </div>
            ),
        },
        {
            title: 'Entradas',
            dataIndex: 'total_inflow',
            key: 'total_inflow',
            align: 'right',
            sorter: (a, b) => a.total_inflow - b.total_inflow,
            render: (value) => <span className="font-semibold text-[#1e7a8a]">{formatCurrency(value)}</span>,
        },
        {
            title: 'Saidas',
            dataIndex: 'total_outflow',
            key: 'total_outflow',
            align: 'right',
            sorter: (a, b) => a.total_outflow - b.total_outflow,
            render: (value) => <span className="font-semibold text-[#be3d2a]">{formatCurrency(value)}</span>,
        },
        {
            title: 'Saldo atual',
            dataIndex: 'current_balance',
            key: 'current_balance',
            align: 'right',
            sorter: (a, b) => a.current_balance - b.current_balance,
            render: (value) => <span className="font-semibold text-slate-900">{formatCurrency(value)}</span>,
        },
        {
            title: 'Última movimentação',
            dataIndex: 'last_moved_at',
            key: 'last_moved_at',
            sorter: (a, b) => dayjs(a.last_moved_at).valueOf() - dayjs(b.last_moved_at).valueOf(),
            render: (value) => formatDate(value),
        },
    ];

    const maxCategorySpent = Math.max(
        ...categoryBreakdown.map((category) => category.spent),
        1,
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Dashboard</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Visao geral da casa.</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Monitore gastos e consumos da casa por período, categoria, cartao/conta e produto ou serviço.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                        <button
                            type="button"
                            onClick={() => setIsFilterModalOpen(true)}
                            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 sm:w-auto"
                        >
                            Filtros
                        </button>
                        <Link
                            href={route('products.index')}
                            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 sm:w-auto"
                        >
                            Novo item
                        </Link>
                        <Link
                            href={route('purchases.index')}
                            className="inline-flex w-full items-center justify-center rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 sm:w-auto"
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
                        label="Gasto no período"
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
                                ? `${topCategory.name} • ${topCategory.entries_count} lançamentos`
                                : 'Sem dados no período'
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
                                ? `${truncateText(mostConsumedProduct.name)} • consumo no período`
                                : 'Sem consumo de produtos no período'
                        }
                        tone="bg-[#f3efe6]"
                    />
                    <StatCard
                        label="Movimentacoes no período"
                        value={String(stats.entries_count)}
                        hint={`${stats.products_count} produtos e ${stats.services_count} serviços diferentes`}
                        tone="bg-[#f6efff]"
                    />
                </div>

                <SectionCard
                    title="Painel analitico"
                    description={
                        activeTab === 'expenses'
                            ? `${filteredEntries.length} gastos encontrados no período.`
                            : activeTab === 'consumption'
                              ? `${consumptionSummary.length} produtos com consumo no período.`
                              : `${accountSummary.length} contas com movimentacoes no período.`
                    }
                    actions={
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={
                                activeTab === 'expenses'
                                    ? 'Pesquisar item, categoria, cartao/conta ou referencia'
                                    : activeTab === 'consumption'
                                      ? 'Pesquisar produto, marca, SKU, categoria ou observação'
                                      : 'Pesquisar conta, categoria, descrição, referencia ou item'
                            }
                            allowClear
                            size="large"
                            className="w-full sm:w-96"
                        />
                    }
                >
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Tag color="geekblue">Período: {filters.range_label}</Tag>
                        {hasAdvancedFilters ? (
                            activeFilters.map((label) => (
                                <Tag key={label} color="cyan">
                                    {label}
                                </Tag>
                            ))
                        ) : (
                            <Tag color="default">Sem filtros</Tag>
                        )}
                    </div>

                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as 'expenses' | 'consumption' | 'accounts')}
                        items={[
                            {
                                key: 'expenses',
                                label: 'Gastos',
                                children: (
                                    <ResponsiveDataTable<DashboardTableRecord>
                                        rowKey="key"
                                        columns={columns}
                                        dataSource={dataSource}
                                        pagination={{ pageSize: 12, showSizeChanger: true }}
                                        size="middle"
                                        scroll={{ x: 1200 }}
                                        mobileRenderCard={(record) => (
                                            <ResponsiveCard key={record.key}>
                                                <ResponsiveCardHeader
                                                    title={record.product_name}
                                                    subtitle={`${sourceLabel(record.source)}${record.invoice_reference ? ` • ${record.invoice_reference}` : ''}`}
                                                    trailing={
                                                        <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                                                            {formatCurrency(record.total_amount)}
                                                        </span>
                                                    }
                                                />

                                                <ResponsiveCardPills>
                                                    <ResponsiveCardPill tone="warm">
                                                        {typeLabel(record.product_type)}
                                                    </ResponsiveCardPill>
                                                    <ResponsiveCardPill>
                                                        {record.category?.name ?? 'Sem categoria'}
                                                    </ResponsiveCardPill>
                                                </ResponsiveCardPills>

                                                <ResponsiveCardFields columns={2}>
                                                    <ResponsiveCardField
                                                        label="Conta:"
                                                        value={
                                                            record.account
                                                                ? `${record.account.code} - ${record.account.name}`
                                                                : '--'
                                                        }
                                                        colSpan={2}
                                                    />
                                                    <ResponsiveCardField
                                                        label="Quantidade:"
                                                        value={`${formatQuantity(record.quantity)} ${record.unit}`}
                                                    />
                                                    <ResponsiveCardField
                                                        label="Data:"
                                                        value={formatDate(record.purchased_at)}
                                                    />
                                                </ResponsiveCardFields>
                                            </ResponsiveCard>
                                        )}
                                    />
                                ),
                            },
                            {
                                key: 'consumption',
                                label: 'Consumo',
                                children: (
                                    <ResponsiveDataTable<ConsumptionSummaryRow>
                                        rowKey="key"
                                        columns={consumptionColumns}
                                        dataSource={consumptionSummary}
                                        pagination={{ pageSize: 12, showSizeChanger: true }}
                                        size="middle"
                                        scroll={{ x: 1100 }}
                                        rowClassName={() => 'cursor-pointer'}
                                        onRow={(record) => ({
                                            onClick: (event) => {
                                                const target = event.target as HTMLElement;

                                                if (target.closest('button, a, input, label, textarea, .ant-input, .ant-select')) {
                                                    return;
                                                }

                                                setSelectedConsumptionProduct(record);
                                            },
                                        })}
                                        mobileRenderCard={(record) => (
                                            <button
                                                key={record.key}
                                                type="button"
                                                onClick={() => setSelectedConsumptionProduct(record)}
                                                className="block w-full text-left"
                                            >
                                                <ResponsiveCard tone="warm">
                                                    <ResponsiveCardHeader
                                                        title={record.product_name}
                                                        subtitle={`${record.brand || 'Sem marca'}${record.sku ? ` • ${record.sku}` : ''}`}
                                                        trailing={
                                                            <span className="rounded-full bg-[#fff1ec] px-3 py-1 text-sm font-semibold text-[#be3d2a]">
                                                                {formatQuantity(record.total_output)} {record.unit}
                                                            </span>
                                                        }
                                                    />

                                                    <ResponsiveCardPills>
                                                        <ResponsiveCardPill tone="warm">
                                                            {record.category?.name ?? 'Sem categoria'}
                                                        </ResponsiveCardPill>
                                                        <ResponsiveCardPill>
                                                            {record.withdrawals_count} saidas
                                                        </ResponsiveCardPill>
                                                    </ResponsiveCardPills>

                                                    <ResponsiveCardFields columns={2}>
                                                        <ResponsiveCardField
                                                            label="Consumo no período:"
                                                            value={`${formatQuantity(record.total_output)} ${record.unit}`}
                                                        />
                                                        <ResponsiveCardField
                                                            label="Estoque atual:"
                                                            value={`${formatQuantity(record.current_stock)} ${record.unit}`}
                                                        />
                                                        <ResponsiveCardField
                                                            label="Primeira saida:"
                                                            value={formatDate(record.first_output_at)}
                                                        />
                                                        <ResponsiveCardField
                                                            label="Última saida:"
                                                            value={formatDate(record.last_output_at)}
                                                        />
                                                    </ResponsiveCardFields>
                                                </ResponsiveCard>
                                            </button>
                                        )}
                                    />
                                ),
                            },
                            {
                                key: 'accounts',
                                label: 'Movimentacoes de conta',
                                children: (
                                    <ResponsiveDataTable<AccountMovementSummaryRow>
                                        rowKey="key"
                                        columns={accountMovementColumns}
                                        dataSource={accountSummary}
                                        pagination={{ pageSize: 12, showSizeChanger: true }}
                                        size="middle"
                                        scroll={{ x: 1050 }}
                                        rowClassName={() => 'cursor-pointer'}
                                        onRow={(record) => ({
                                            onClick: (event) => {
                                                const target = event.target as HTMLElement;

                                                if (target.closest('button, a, input, label, textarea, .ant-input, .ant-select')) {
                                                    return;
                                                }

                                                setSelectedAccountSummary(record);
                                            },
                                        })}
                                        mobileRenderCard={(record) => (
                                            <button
                                                key={record.key}
                                                type="button"
                                                onClick={() => setSelectedAccountSummary(record)}
                                                className="block w-full text-left"
                                            >
                                                <ResponsiveCard>
                                                    <ResponsiveCardHeader
                                                        title={`${record.account_code} - ${record.account_name}`}
                                                        subtitle={`${record.movements_count} movimentacoes no período`}
                                                        trailing={
                                                            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                                                                {formatCurrency(record.current_balance)}
                                                            </span>
                                                        }
                                                    />

                                                    <ResponsiveCardPills>
                                                        <ResponsiveCardPill>Entradas {formatCurrency(record.total_inflow)}</ResponsiveCardPill>
                                                        <ResponsiveCardPill tone="warm">Saidas {formatCurrency(record.total_outflow)}</ResponsiveCardPill>
                                                    </ResponsiveCardPills>

                                                    <ResponsiveCardFields columns={2}>
                                                        <ResponsiveCardField
                                                            label="Primeira movimentação:"
                                                            value={formatDate(record.first_moved_at)}
                                                        />
                                                        <ResponsiveCardField
                                                            label="Última movimentação:"
                                                            value={formatDate(record.last_moved_at)}
                                                        />
                                                    </ResponsiveCardFields>
                                                </ResponsiveCard>
                                            </button>
                                        )}
                                    />
                                ),
                            },
                        ]}
                    />
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
                                            {category.entries_count} lançamentos • {formatQuantity(category.quantity)} itens
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[24px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                    Sem dados no período selecionado.
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Últimos lançamentos"
                        description="Visao rapida dos registros mais recentes dentro do período filtrado."
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
                                    Ainda não ha lançamentos no período.
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>

            <Modal
                show={Boolean(selectedConsumptionProduct)}
                onClose={() => setSelectedConsumptionProduct(null)}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Historico de consumo</p>
                            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                                {selectedConsumptionProduct?.product_name ?? '--'}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Entradas e saidas do produto dentro do período filtrado da dashboard.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedConsumptionProduct(null)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                            Fechar
                        </button>
                    </div>

                    <div className="mt-6 space-y-3">
                        {selectedConsumptionHistory.length > 0 ? (
                            selectedConsumptionHistory.map((movement) => (
                                <ResponsiveCard key={movement.id} tone={movement.direction === 'inflow' ? 'default' : 'warm'}>
                                    <ResponsiveCardHeader
                                        eyebrow={formatMovementMoment(movement.moved_at)}
                                        title={movement.product_name ?? 'Produto removido'}
                                        subtitle={`${stockMovementOriginLabel(movement.origin)}${movement.reference ? ` • ${movement.reference}` : ''}`}
                                        trailing={
                                            <span
                                                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                                    movement.direction === 'inflow'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-[#fff1ec] text-[#be3d2a]'
                                                }`}
                                            >
                                                {movement.direction === 'inflow' ? '+' : '-'} {formatQuantity(movement.quantity)} {movement.unit}
                                            </span>
                                        }
                                    />

                                    <ResponsiveCardPills>
                                        <ResponsiveCardPill tone={movement.direction === 'inflow' ? 'default' : 'warm'}>
                                            {stockMovementDirectionLabel(movement.direction)}
                                        </ResponsiveCardPill>
                                        <ResponsiveCardPill>{stockMovementOriginLabel(movement.origin)}</ResponsiveCardPill>
                                    </ResponsiveCardPills>

                                    <ResponsiveCardFields>
                                        <ResponsiveCardField
                                            label="Observacoes:"
                                            value={movement.notes || 'Sem observacoes.'}
                                        />
                                    </ResponsiveCardFields>
                                </ResponsiveCard>
                            ))
                        ) : (
                            <div className="rounded-[24px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                Nenhuma movimentação encontrada para este produto no período filtrado.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal
                show={Boolean(selectedAccountSummary)}
                onClose={() => setSelectedAccountSummary(null)}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Historico da conta</p>
                            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                                {selectedAccountSummary
                                    ? `${selectedAccountSummary.account_code} - ${selectedAccountSummary.account_name}`
                                    : '--'}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Entradas e saidas de saldo registradas no período filtrado.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedAccountSummary(null)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                            Fechar
                        </button>
                    </div>

                    <div className="mt-6 space-y-3">
                        {selectedAccountHistory.length > 0 ? (
                            selectedAccountHistory.map((movement) => (
                                <ResponsiveCard key={movement.id} tone={movement.direction === 'inflow' ? 'default' : 'warm'}>
                                    <ResponsiveCardHeader
                                        eyebrow={formatMovementMoment(movement.moved_at)}
                                        title={
                                            movement.description ||
                                            movement.related_items[0] ||
                                            'Movimentação sem descrição'
                                        }
                                        subtitle={`${accountMovementOriginLabel(movement.origin)}${movement.reference ? ` • ${movement.reference}` : ''}`}
                                        trailing={
                                            <span
                                                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                                    movement.direction === 'inflow'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-[#fff1ec] text-[#be3d2a]'
                                                }`}
                                            >
                                                {movement.direction === 'inflow' ? '+' : '-'} {formatCurrency(movement.amount)}
                                            </span>
                                        }
                                    />

                                    <ResponsiveCardPills>
                                        <ResponsiveCardPill tone={movement.direction === 'inflow' ? 'default' : 'warm'}>
                                            {accountMovementDirectionLabel(movement.direction)}
                                        </ResponsiveCardPill>
                                        <ResponsiveCardPill>{movement.category?.name ?? 'Sem categoria'}</ResponsiveCardPill>
                                    </ResponsiveCardPills>

                                    <ResponsiveCardFields columns={2}>
                                        <ResponsiveCardField
                                            label="Origem:"
                                            value={accountMovementOriginLabel(movement.origin)}
                                        />
                                        <ResponsiveCardField
                                            label="Referencia:"
                                            value={movement.reference || 'Sem referencia'}
                                        />
                                        <ResponsiveCardField
                                            label="Itens relacionados:"
                                            value={
                                                movement.related_items.length > 0
                                                    ? movement.related_items.join(', ')
                                                    : 'Sem item relacionado'
                                            }
                                            colSpan={2}
                                        />
                                    </ResponsiveCardFields>
                                </ResponsiveCard>
                            ))
                        ) : (
                            <div className="rounded-[24px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                Nenhuma movimentação encontrada para esta conta no período filtrado.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <FormEntityModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onSubmit={submitFilters}
                processing={isApplyingFilters}
                sectionLabel="Dashboard"
                title="Filtros"
                description="Filtre por período, categorias, cartões/contas e produtos ou serviços para analisar gastos e consumos da casa."
                saveLabel="Aplicar filtros"
                maxWidth="2xl"
                actions={
                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-3">
                        <SecondaryButton
                            type="button"
                            onClick={resetFilters}
                            disabled={isApplyingFilters}
                            className="w-full sm:w-auto"
                        >
                            Limpar tudo
                        </SecondaryButton>
                        <SecondaryButton
                            type="button"
                            onClick={() => setIsFilterModalOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={isApplyingFilters}
                            className="col-span-2 w-full sm:w-auto"
                        >
                            Aplicar filtros
                        </PrimaryButton>
                    </div>
                }
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-600">
                        Inicio
                        <DatePicker
                            value={
                                draftFilters.start_date
                                    ? dayjs(draftFilters.start_date)
                                    : null
                            }
                            format="DD/MM/YYYY"
                            size="large"
                            onChange={(date) =>
                                setDraftFilters((previous) => ({
                                    ...previous,
                                    start_date: date ? date.format('YYYY-MM-DD') : '',
                                }))
                            }
                            className="mt-2 w-full"
                        />
                    </label>

                    <label className="text-sm font-semibold text-slate-600">
                        Fim
                        <DatePicker
                            value={
                                draftFilters.end_date ? dayjs(draftFilters.end_date) : null
                            }
                            format="DD/MM/YYYY"
                            size="large"
                            onChange={(date) =>
                                setDraftFilters((previous) => ({
                                    ...previous,
                                    end_date: date ? date.format('YYYY-MM-DD') : '',
                                }))
                            }
                            className="mt-2 w-full"
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
                    <InputLabel htmlFor="filter-accounts" value="Cartões / Contas" />
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
                        placeholder="Selecione um ou mais cartões/contas"
                        options={accounts.map((account) => ({
                            value: String(account.id),
                            label: `${account.code} - ${account.name}`,
                        }))}
                    />
                </div>

                <div>
                    <InputLabel htmlFor="filter-products" value="Produtos e serviços" />
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
                                    ? `${product.name} (serviço)`
                                    : product.name,
                        }))}
                    />
                </div>
            </FormEntityModal>
        </AuthenticatedLayout>
    );
}
