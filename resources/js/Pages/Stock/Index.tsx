import FormEntityModal from '@/Components/FormEntityModal';
import InputLabel from '@/Components/InputLabel';
import ResponsiveDateRangePicker from '@/Components/ResponsiveDateRangePicker';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import LabeledTextAreaField from '@/Components/form-fields/LabeledTextAreaField';
import Modal from '@/Components/Modal';
import ResponsiveDataTable from '@/Components/ResponsiveDataTable';
import {
    ResponsiveCard,
    ResponsiveCardField,
    ResponsiveCardFields,
    ResponsiveCardHeader,
    ResponsiveCardPill,
    ResponsiveCardPills,
} from '@/Components/responsive-table/ResponsiveCard';
import SecondaryButton from '@/Components/SecondaryButton';
import SectionCard from '@/Components/SectionCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate, formatQuantity } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';
import { Button, Input, Select, Space, Tabs, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { FormEvent, Key, useMemo, useState } from 'react';

interface StockPageProps {
    products: Array<{
        id: number;
        name: string;
        brand: string | null;
        sku: string | null;
        unit: string;
        type: 'stockable' | 'non_stockable';
        minimum_stock: number;
        current_stock: number;
        category: { name: string; color: string } | null;
    }>;
    movements: Array<{
        id: string;
        product_id: number | null;
        product_name: string | null;
        unit: string | null;
        direction: 'inflow' | 'outflow';
        origin: 'manual_purchase' | 'invoice_purchase' | 'manual_withdrawal' | string;
        quantity: number;
        moved_at: string | null;
        notes: string | null;
        reference: string | null;
    }>;
}

type ProductRow = StockPageProps['products'][number];
type StockTableRecord = ProductRow & { key: string };
type StockMovementRow = StockPageProps['movements'][number];
type OutputSummaryRow = {
    key: string;
    product_id: number;
    product_name: string;
    unit: string;
    brand: string | null;
    sku: string | null;
    category: ProductRow['category'];
    current_stock: number;
    total_output: number;
    withdrawals_count: number;
    first_output_at: string | null;
    last_output_at: string | null;
};

const movementOriginLabel = (origin: StockMovementRow['origin']) => {
    if (origin === 'manual_purchase') return 'Compra manual';
    if (origin === 'invoice_purchase') return 'Compra importada';
    if (origin === 'manual_withdrawal') return 'Saida manual';

    return origin;
};

const movementDirectionLabel = (direction: StockMovementRow['direction']) =>
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

const isWithinRange = (value: string | null, startDate: string, endDate: string) => {
    if (!value) {
        return false;
    }

    const current = dayjs(value);

    if (!current.isValid()) {
        return false;
    }

    if (startDate && current.isBefore(dayjs(startDate), 'day')) {
        return false;
    }

    if (endDate && current.isAfter(dayjs(endDate), 'day')) {
        return false;
    }

    return true;
};

export default function StockIndex({ products, movements }: StockPageProps) {
    const [activeTab, setActiveTab] = useState<'stock' | 'outputs'>('stock');
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
    const [selectedHistoryProduct, setSelectedHistoryProduct] = useState<OutputSummaryRow | null>(null);
    const [outputStartDate, setOutputStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [outputEndDate, setOutputEndDate] = useState(dayjs().format('YYYY-MM-DD'));

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        product_id: '',
        quantity: '1',
        notes: '',
    });

    const openWithdrawModal = (product: ProductRow) => {
        if (product.type !== 'stockable') {
            return;
        }

        setSelectedProduct(product);
        setData({
            product_id: String(product.id),
            quantity: '1',
            notes: '',
        });
        clearErrors();
    };

    const closeWithdrawModal = () => {
        setSelectedProduct(null);
        reset();
        clearErrors();
    };

    const submitWithdraw = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('stock.withdraw'), {
            preserveScroll: true,
            onSuccess: () => closeWithdrawModal(),
        });
    };

    const normalizedSearch = search.trim().toLowerCase();

    const filteredProducts = useMemo(() => {
        if (!normalizedSearch) {
            return products;
        }

        return products.filter((product) => {
            const searchable = [
                product.name,
                product.brand ?? '',
                product.sku ?? '',
                product.category?.name ?? '',
                product.unit,
            ]
                .join(' ')
                .toLowerCase();

            return searchable.includes(normalizedSearch);
        });
    }, [products, normalizedSearch]);

    const productsById = useMemo(
        () => new Map(products.map((product) => [product.id, product])),
        [products],
    );

    const dataSource: StockTableRecord[] = filteredProducts.map((product) => ({
        ...product,
        key: String(product.id),
    }));

    const filteredOutputMovements = useMemo(() => {
        return movements.filter((movement) => {
            if (movement.direction !== 'outflow' || !movement.product_id) {
                return false;
            }

            if (!isWithinRange(movement.moved_at, outputStartDate, outputEndDate)) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const product = productsById.get(movement.product_id);
            const searchable = [
                movement.product_name ?? '',
                product?.brand ?? '',
                product?.sku ?? '',
                product?.category?.name ?? '',
                movement.notes ?? '',
            ]
                .join(' ')
                .toLowerCase();

            return searchable.includes(normalizedSearch);
        });
    }, [movements, normalizedSearch, outputStartDate, outputEndDate, productsById]);

    const outputSummary = useMemo<OutputSummaryRow[]>(() => {
        const grouped = new Map<number, OutputSummaryRow>();

        for (const movement of filteredOutputMovements) {
            if (!movement.product_id) {
                continue;
            }

            const product = productsById.get(movement.product_id);
            const current = grouped.get(movement.product_id);

            if (!current) {
                grouped.set(movement.product_id, {
                    key: String(movement.product_id),
                    product_id: movement.product_id,
                    product_name: movement.product_name ?? product?.name ?? 'Produto removido',
                    unit: movement.unit ?? product?.unit ?? 'un',
                    brand: product?.brand ?? null,
                    sku: product?.sku ?? null,
                    category: product?.category ?? null,
                    current_stock: product?.current_stock ?? 0,
                    total_output: movement.quantity,
                    withdrawals_count: 1,
                    first_output_at: movement.moved_at,
                    last_output_at: movement.moved_at,
                });

                continue;
            }

            current.total_output += movement.quantity;
            current.withdrawals_count += 1;

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
    }, [filteredOutputMovements, productsById]);

    const historyRows = useMemo(() => {
        if (!selectedHistoryProduct) {
            return [] as StockMovementRow[];
        }

        return movements
            .filter((movement) => movement.product_id === selectedHistoryProduct.product_id)
            .sort((a, b) => dayjs(b.moved_at).valueOf() - dayjs(a.moved_at).valueOf());
    }, [movements, selectedHistoryProduct]);

    const getTextFilter = (
        dataIndex: keyof ProductRow,
        placeholder: string,
    ): ColumnsType<StockTableRecord>[number] => ({
        filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
            <TableTextFilterDropdown
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                confirm={confirm}
                clearFilters={clearFilters}
                placeholder={placeholder}
            />
        ),
        onFilter: (value: Key | boolean, record: StockTableRecord) =>
            String(record[dataIndex] ?? '').toLowerCase().includes(String(value).toLowerCase()),
    });

    const stockColumns: ColumnsType<StockTableRecord> = [
        {
            title: 'Produto',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_value, record) => (
                <div>
                    <p className="font-semibold text-slate-900">{record.name}</p>
                    <p className="text-slate-500">{record.brand || 'Sem marca'}{record.sku ? ` • ${record.sku}` : ''}</p>
                </div>
            ),
            ...getTextFilter('name', 'Filtrar por produto'),
        },
        {
            title: 'Categoria',
            dataIndex: 'category',
            key: 'category',
            render: (_value, record) =>
                record.category ? <Tag color="cyan">{record.category.name}</Tag> : '--',
            filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                <div className="w-56 p-3">
                    <Select
                        value={String(selectedKeys[0] ?? '') || undefined}
                        placeholder="Filtrar categoria"
                        className="w-full"
                        onChange={(value: string | undefined) => setSelectedKeys(value ? [value] : [])}
                        options={products
                            .map((product) => product.category?.name)
                            .filter((value): value is string => Boolean(value))
                            .filter((value, index, all) => all.indexOf(value) === index)
                            .sort((a, b) => a.localeCompare(b))
                            .map((value) => ({ value, label: value }))}
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
            onFilter: (value: Key | boolean, record: StockTableRecord) =>
                String(record.category?.name ?? '') === String(value),
        },
        {
            title: 'Estoque atual',
            dataIndex: 'current_stock',
            key: 'current_stock',
            align: 'right',
            sorter: (a, b) => a.current_stock - b.current_stock,
            render: (_value, record) => (
                <span className={record.current_stock <= record.minimum_stock ? 'font-semibold text-[#be3d2a]' : 'font-semibold text-slate-900'}>
                    {formatQuantity(record.current_stock)} {record.unit}
                </span>
            ),
            ...getTextFilter('current_stock', 'Filtrar por estoque atual'),
        },
        {
            title: 'Mínimo',
            dataIndex: 'minimum_stock',
            key: 'minimum_stock',
            align: 'right',
            render: (_value, record) => `${formatQuantity(record.minimum_stock)} ${record.unit}`,
            ...getTextFilter('minimum_stock', 'Filtrar por mínimo'),
        },
    ];

    const outputColumns: ColumnsType<OutputSummaryRow> = [
        {
            title: 'Produto',
            dataIndex: 'product_name',
            key: 'product_name',
            sorter: (a, b) => a.product_name.localeCompare(b.product_name),
            render: (_value, record) => (
                <div>
                    <p className="font-semibold text-slate-900">{record.product_name}</p>
                    <p className="text-slate-500">{record.brand || 'Sem marca'}{record.sku ? ` • ${record.sku}` : ''}</p>
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
            title: 'Saída no período',
            dataIndex: 'total_output',
            key: 'total_output',
            align: 'right',
            sorter: (a, b) => a.total_output - b.total_output,
            render: (_value, record) => `${formatQuantity(record.total_output)} ${record.unit}`,
        },
        {
            title: 'Movimentações',
            dataIndex: 'withdrawals_count',
            key: 'withdrawals_count',
            align: 'right',
            sorter: (a, b) => a.withdrawals_count - b.withdrawals_count,
        },
        {
            title: 'Última saída',
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Estoque</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Controle de estoque e saídas dos produtos.</h1>
                    </div>
                </div>
            }
        >
            <Head title="Estoque" />

            <SectionCard
                title="Estoque e saídas"
                description={
                    activeTab === 'stock'
                        ? `${filteredProducts.length} produtos encontrados. Clique em uma linha para retirar do estoque.`
                        : `${outputSummary.length} produtos com saídas no período selecionado.`
                }
                actions={
                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:flex-wrap lg:items-end lg:justify-end">
                        {activeTab === 'outputs' ? (
                            <div className="w-full lg:w-auto">
                                <InputLabel value="Período de saída" />
                                <ResponsiveDateRangePicker
                                    value={[
                                        outputStartDate ? dayjs(outputStartDate) : null,
                                        outputEndDate ? dayjs(outputEndDate) : null,
                                    ]}
                                    onChange={([startDate, endDate]) => {
                                        setOutputStartDate(startDate ? startDate.format('YYYY-MM-DD') : '');
                                        setOutputEndDate(endDate ? endDate.format('YYYY-MM-DD') : '');
                                    }}
                                    className="mt-2 w-full min-w-0 lg:min-w-[336px]"
                                    placeholder={['De', 'Até']}
                                />
                            </div>
                        ) : null}

                        <div className="w-full sm:w-80">
                            {activeTab === 'outputs' ? (
                                <InputLabel value="Pesquisar" className="invisible" aria-hidden="true" />
                            ) : null}
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={
                                    activeTab === 'stock'
                                        ? 'Pesquisar produto, marca, SKU ou categoria'
                                        : 'Pesquisar produto, marca, SKU, categoria ou observação'
                                }
                                allowClear
                                size="large"
                                className={activeTab === 'outputs' ? 'mt-2 w-full' : 'w-full'}
                            />
                        </div>
                    </div>
                }
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'stock' | 'outputs')}
                    items={[
                        {
                            key: 'stock',
                            label: 'Estoque atual',
                            children: (
                                <ResponsiveDataTable<StockTableRecord>
                                    rowKey="key"
                                    columns={stockColumns}
                                    dataSource={dataSource}
                                    pagination={{ pageSize: 12, showSizeChanger: true }}
                                    size="middle"
                                    scroll={{ x: 980 }}
                                    rowClassName={(record) =>
                                        record.type === 'stockable' && record.current_stock > 0
                                            ? 'cursor-pointer'
                                            : 'opacity-80'
                                    }
                                    onRow={(record) => ({
                                        onClick: (event) => {
                                            const target = event.target as HTMLElement;

                                            if (
                                                target.closest('button, a, input, label, textarea, .ant-input, .ant-select')
                                            ) {
                                                return;
                                            }

                                            if (record.type !== 'stockable' || record.current_stock <= 0) {
                                                return;
                                            }

                                            openWithdrawModal(record);
                                        },
                                    })}
                                    mobileHint="No celular o estoque aparece em cards. Toque em um item estocável para retirar quantidade."
                                    mobileRenderCard={(record) => {
                                        const canWithdraw =
                                            record.type === 'stockable' && record.current_stock > 0;
                                        const lowStock = record.current_stock <= record.minimum_stock;

                                        return (
                                            <ResponsiveCard
                                                key={record.key}
                                                tone={canWithdraw ? 'default' : 'muted'}
                                                className={!canWithdraw ? 'text-slate-500' : ''}
                                                onClick={() => {
                                                    if (canWithdraw) {
                                                        openWithdrawModal(record);
                                                    }
                                                }}
                                            >
                                                <ResponsiveCardHeader
                                                    title={record.name}
                                                    subtitle={`${record.brand || 'Sem marca'}${record.sku ? ` • ${record.sku}` : ''}`}
                                                    trailing={
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                                                lowStock
                                                                    ? 'bg-[#fff1ec] text-[#be3d2a]'
                                                                    : 'bg-slate-900 text-white'
                                                            }`}
                                                        >
                                                            {formatQuantity(record.current_stock)} {record.unit}
                                                        </span>
                                                    }
                                                />

                                                <ResponsiveCardPills>
                                                    <ResponsiveCardPill tone="warm">
                                                        {record.category?.name ?? 'Sem categoria'}
                                                    </ResponsiveCardPill>
                                                    <ResponsiveCardPill>
                                                        {record.type === 'stockable' ? 'Estocável' : 'Não estocável'}
                                                    </ResponsiveCardPill>
                                                </ResponsiveCardPills>

                                                <ResponsiveCardFields columns={2}>
                                                    <ResponsiveCardField
                                                        label="Estoque:"
                                                        value={`${formatQuantity(record.current_stock)} ${record.unit}`}
                                                        tone={lowStock ? 'danger' : 'default'}
                                                    />
                                                    <ResponsiveCardField
                                                        label="Mínimo:"
                                                        value={`${formatQuantity(record.minimum_stock)} ${record.unit}`}
                                                    />
                                                    <ResponsiveCardField
                                                        value={
                                                            canWithdraw
                                                                ? 'Toque para retirar do estoque.'
                                                                : 'Sem retirada disponível para este item.'
                                                        }
                                                        colSpan={2}
                                                    />
                                                </ResponsiveCardFields>
                                            </ResponsiveCard>
                                        );
                                    }}
                                />
                            ),
                        },
                        {
                            key: 'outputs',
                            label: 'Saídas de produto',
                            children: (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <Tag color="geekblue">
                                            Período: {formatDate(outputStartDate)} até {formatDate(outputEndDate)}
                                        </Tag>
                                        <Tag color="cyan">{filteredOutputMovements.length} saídas registradas</Tag>
                                    </div>

                                    <ResponsiveDataTable<OutputSummaryRow>
                                        rowKey="key"
                                        columns={outputColumns}
                                        dataSource={outputSummary}
                                        pagination={{ pageSize: 12, showSizeChanger: true }}
                                        size="middle"
                                        scroll={{ x: 980 }}
                                        rowClassName={() => 'cursor-pointer'}
                                        onRow={(record) => ({
                                            onClick: () => setSelectedHistoryProduct(record),
                                        })}
                                        mobileHint="As saídas ficam agrupadas por produto. Toque em um item para abrir o histórico completo de entradas e saídas."
                                        mobileRenderCard={(record) => (
                                            <ResponsiveCard
                                                key={record.key}
                                                onClick={() => setSelectedHistoryProduct(record)}
                                            >
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
                                                        {record.withdrawals_count} saídas
                                                    </ResponsiveCardPill>
                                                </ResponsiveCardPills>

                                                <ResponsiveCardFields columns={2}>
                                                    <ResponsiveCardField
                                                        label="Saída no período:"
                                                        value={`${formatQuantity(record.total_output)} ${record.unit}`}
                                                    />
                                                    <ResponsiveCardField
                                                        label="Estoque atual:"
                                                        value={`${formatQuantity(record.current_stock)} ${record.unit}`}
                                                    />
                                                    <ResponsiveCardField
                                                        label="Primeira saída:"
                                                        value={formatDate(record.first_output_at)}
                                                    />
                                                    <ResponsiveCardField
                                                        label="Última saída:"
                                                        value={formatDate(record.last_output_at)}
                                                    />
                                                </ResponsiveCardFields>
                                            </ResponsiveCard>
                                        )}
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            </SectionCard>

            <FormEntityModal
                isOpen={Boolean(selectedProduct)}
                onClose={closeWithdrawModal}
                onSubmit={submitWithdraw}
                processing={processing}
                sectionLabel="Estoque"
                title="Retirar do estoque"
                description={
                    selectedProduct
                        ? `${selectedProduct.name} • disponível: ${formatQuantity(selectedProduct.current_stock)} ${selectedProduct.unit}`
                        : undefined
                }
                saveLabel="Confirmar retirada"
                maxWidth="lg"
            >
                <LabeledInputField
                    id="quantity"
                    label="Quantidade"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={data.quantity}
                    onChange={(value) => setData('quantity', value)}
                    error={errors.quantity}
                />

                <LabeledTextAreaField
                    id="notes"
                    label="Observações da saída"
                    value={data.notes}
                    onChange={(value) => setData('notes', value)}
                    error={errors.notes}
                    rows={4}
                />
            </FormEntityModal>

            <Modal
                show={Boolean(selectedHistoryProduct)}
                onClose={() => setSelectedHistoryProduct(null)}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Histórico de movimentação</p>
                            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                                {selectedHistoryProduct?.product_name ?? '--'}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Veja quando o produto entrou por compra e quando saiu do estoque.
                            </p>
                        </div>

                        <SecondaryButton type="button" onClick={() => setSelectedHistoryProduct(null)}>
                            Fechar
                        </SecondaryButton>
                    </div>

                    <div className="mt-6 space-y-3">
                        {historyRows.length > 0 ? (
                            historyRows.map((movement) => (
                                <ResponsiveCard key={movement.id} tone={movement.direction === 'inflow' ? 'default' : 'warm'}>
                                    <ResponsiveCardHeader
                                        eyebrow={formatMovementMoment(movement.moved_at)}
                                        title={movement.product_name ?? 'Produto removido'}
                                        subtitle={`${movementOriginLabel(movement.origin)}${movement.reference ? ` • ${movement.reference}` : ''}`}
                                        trailing={
                                            <span
                                                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                                    movement.direction === 'inflow'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-[#fff1ec] text-[#be3d2a]'
                                                }`}
                                            >
                                                {movement.direction === 'inflow' ? '+' : '-'} {formatQuantity(movement.quantity)} {movement.unit ?? 'un'}
                                            </span>
                                        }
                                    />

                                    <ResponsiveCardPills>
                                        <ResponsiveCardPill tone={movement.direction === 'inflow' ? 'default' : 'warm'}>
                                            {movementDirectionLabel(movement.direction)}
                                        </ResponsiveCardPill>
                                        <ResponsiveCardPill>{movementOriginLabel(movement.origin)}</ResponsiveCardPill>
                                    </ResponsiveCardPills>

                                    <ResponsiveCardFields>
                                        <ResponsiveCardField
                                            label="Observações:"
                                            value={movement.notes || 'Sem observações.'}
                                        />
                                    </ResponsiveCardFields>
                                </ResponsiveCard>
                            ))
                        ) : (
                            <div className="rounded-[26px] border border-white/80 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)]">
                                Nenhuma movimentação encontrada para este produto.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
