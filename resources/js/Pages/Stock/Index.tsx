import FormEntityModal from '@/Components/FormEntityModal';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import ResponsiveDataTable from '@/Components/ResponsiveDataTable';
import {
    ResponsiveCard,
    ResponsiveCardField,
    ResponsiveCardFields,
    ResponsiveCardHeader,
    ResponsiveCardPill,
    ResponsiveCardPills,
} from '@/Components/responsive-table/ResponsiveCard';
import SectionCard from '@/Components/SectionCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatQuantity } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';
import { Button, Input, Select, Space, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
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
}

type ProductRow = StockPageProps['products'][number];
type StockTableRecord = ProductRow & { key: string };

export default function StockIndex({ products }: StockPageProps) {
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        product_id: '',
        quantity: '1',
    });

    const openWithdrawModal = (product: ProductRow) => {
        if (product.type !== 'stockable') {
            return;
        }

        setSelectedProduct(product);
        setData({
            product_id: String(product.id),
            quantity: '1',
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

    const dataSource: StockTableRecord[] = filteredProducts.map((product) => ({
        ...product,
        key: String(product.id),
    }));

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

    const columns: ColumnsType<StockTableRecord> = [
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Estoque</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Controle de estoque dos produtos.</h1>
                    </div>
                </div>
            }
        >
            <Head title="Estoque" />

            <SectionCard
                title="Produtos em estoque"
                description={`${filteredProducts.length} produtos encontrados. Clique em uma linha para retirar do estoque.`}
                actions={
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Pesquisar produto, marca, SKU ou categoria"
                        allowClear
                        className="w-full sm:w-80"
                    />
                }
            >
                <ResponsiveDataTable<StockTableRecord>
                    rowKey="key"
                    columns={columns}
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
                    mobileHint="No celular o estoque aparece em cards. Toque em um item estocavel para retirar quantidade."
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
                                        label="Minimo:"
                                        value={`${formatQuantity(record.minimum_stock)} ${record.unit}`}
                                    />
                                    <ResponsiveCardField
                                        value={
                                            canWithdraw
                                                ? 'Toque para retirar do estoque.'
                                                : 'Sem retirada disponivel para este item.'
                                        }
                                        colSpan={2}
                                    />
                                </ResponsiveCardFields>
                            </ResponsiveCard>
                        );
                    }}
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
                        ? `${selectedProduct.name} • disponivel: ${formatQuantity(selectedProduct.current_stock)} ${selectedProduct.unit}`
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
            </FormEntityModal>
        </AuthenticatedLayout>
    );
}
