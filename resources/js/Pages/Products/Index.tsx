import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
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
import { useAntdApp } from '@/hooks/useAntdApp';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ProductModal from '@/Pages/Products/components/ProductModal';
import type { ProductRow, ProductsPageProps, ProductTableRecord } from '@/Pages/Products/types';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { Button, Checkbox, Select, Space, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useState } from 'react';

export default function ProductsIndex({ categories, units, products }: ProductsPageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const { message, modal } = useAntdApp();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        category_id: '',
        name: '',
        brand: '',
        sku: '',
        unit: units[0]?.value ?? 'un',
        type: 'stockable',
        minimum_stock: '0',
        notes: '',
    });

    const {
        data: editData,
        setData: setEditData,
        patch,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
        clearErrors: clearEditErrors,
    } = useForm({
        category_id: '',
        name: '',
        brand: '',
        sku: '',
        unit: units[0]?.value ?? 'un',
        type: 'stockable',
        minimum_stock: '0',
        notes: '',
    });

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('products.store'), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Produto criado com sucesso!');
                reset();
                setIsCreateModalOpen(false);
            },
            onError: () => message.error('Erro ao criar produto'),
        });
    };

    const closeEditModal = () => {
        setEditingProduct(null);
        resetEdit();
        clearEditErrors();
    };

    const openEditModal = (product: ProductRow) => {
        setEditingProduct(product);
        setEditData({
            category_id: product.category_id ? String(product.category_id) : '',
            name: product.name,
            brand: product.brand ?? '',
            sku: product.sku ?? '',
            unit: product.unit,
            type: product.type,
            minimum_stock: String(product.minimum_stock),
            notes: product.notes ?? '',
        });
        clearEditErrors();
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingProduct) {
            return;
        }

        patch(route('products.update', editingProduct.id), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Produto atualizado com sucesso!');
                closeEditModal();
            },
            onError: () => message.error('Erro ao atualizar produto'),
        });
    };

    const deleteEditingProduct = () => {
        if (!editingProduct) {
            return;
        }

        modal.confirm({
            title: 'Confirmar exclusão',
            content: 'Excluir este produto?',
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('products.destroy', editingProduct.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info('Produto excluído com sucesso!');
                        closeEditModal();
                    },
                    onError: () => message.error('Erro ao excluir produto'),
                });
            },
        });
    };

    const deleteSelectedProducts = () => {
        if (selectedRowKeys.length === 0) {
            return;
        }

        const total = selectedRowKeys.length;

        modal.confirm({
            title: 'Confirmar exclusão',
            content: total === 1 ? 'Excluir 1 produto selecionado?' : `Excluir ${total} produtos selecionados?`,
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('products.destroy-many'), {
                    data: { ids: selectedRowKeys.map((key) => Number(key)) },
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info(`${selectedRowKeys.length} produtos excluídos com sucesso!`);
                        setSelectedRowKeys([]);
                    },
                    onError: () => message.error('Erro ao excluir produtos'),
                });
            },
        });
    };

    const getTextFilter = (
        dataIndex: keyof ProductRow,
        placeholder: string,
    ): ColumnsType<ProductTableRecord>[number] => ({
        filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
            <TableTextFilterDropdown
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                confirm={confirm}
                clearFilters={clearFilters}
                placeholder={placeholder}
            />
        ),
        onFilter: (value: Key | boolean, record: ProductTableRecord) => {
            const current = String(record[dataIndex] ?? '').toLowerCase();
            return current.includes(String(value).toLowerCase());
        },
    });

    const dataSource: ProductTableRecord[] = products.map((product) => ({
        ...product,
        key: String(product.id),
    }));

    const columns: ColumnsType<ProductTableRecord> = [
        {
            title: 'Produto',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_: unknown, record) => (
                <div>
                    <p className="font-semibold text-slate-900">{record.name}</p>
                    <p className="mt-1 text-slate-500">{record.brand || 'Sem marca'}{record.sku ? ` • ${record.sku}` : ''}</p>
                </div>
            ),
            ...getTextFilter('name', 'Filtrar por produto'),
        },
        {
            title: 'Categoria',
            dataIndex: 'category',
            key: 'category',
            render: (_: unknown, record) => (record.category ? <Tag color="cyan">{record.category.name}</Tag> : '--'),
            filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                <div className="w-56 p-3">
                    <Select
                        value={String(selectedKeys[0] ?? '') || undefined}
                        placeholder="Filtrar categoria"
                        className="w-full"
                        onChange={(value: string | undefined) => setSelectedKeys(value ? [value] : [])}
                        options={categories.map((category) => ({ value: category.name, label: category.name }))}
                        allowClear
                    />
                    <Space className="mt-3">
                        <Button type="primary" size="small" onClick={() => confirm()}>Aplicar</Button>
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
            onFilter: (value: Key | boolean, record: ProductTableRecord) => String(record.category?.name ?? '') === String(value),
        },
        {
            title: 'Unidade',
            dataIndex: 'unit',
            key: 'unit',
            sorter: (a, b) => a.unit.localeCompare(b.unit),
            ...getTextFilter('unit', 'Filtrar unidade'),
        },
        {
            title: 'Tipo',
            dataIndex: 'type',
            key: 'type',
            sorter: (a, b) => a.type.localeCompare(b.type),
            render: (value: ProductTableRecord['type']) => {
                const labels: Record<ProductTableRecord['type'], string> = {
                    stockable: 'Estocável',
                    non_stockable: 'Não estocável',
                };
                const colors: Record<ProductTableRecord['type'], string> = {
                    stockable: 'blue',
                    non_stockable: 'orange',
                };
                return <Tag color={colors[value]}>{labels[value]}</Tag>;
            },
            filters: [
                { text: 'Estocável', value: 'stockable' },
                { text: 'Não estocável', value: 'non_stockable' },
            ],
            onFilter: (value: Key | boolean, record: ProductTableRecord) => record.type === String(value),
        },
        {
            title: 'Estoque',
            dataIndex: 'current_stock',
            key: 'current_stock',
            align: 'right',
            sorter: (a, b) => a.current_stock - b.current_stock,
            render: (_: unknown, record) => (
                <span className={`font-semibold ${record.current_stock <= record.minimum_stock ? 'text-[#be3d2a]' : 'text-slate-900'}`}>
                    {formatQuantity(record.current_stock)} {record.unit}
                </span>
            ),
        },
        {
            title: 'Minimo',
            dataIndex: 'minimum_stock',
            key: 'minimum_stock',
            align: 'right',
            sorter: (a, b) => a.minimum_stock - b.minimum_stock,
            render: (_: unknown, record) => `${formatQuantity(record.minimum_stock)} ${record.unit}`,
        },
        {
            title: 'Total gasto',
            dataIndex: 'total_spent',
            key: 'total_spent',
            align: 'right',
            sorter: (a, b) => a.total_spent - b.total_spent,
            render: (value: number) => formatCurrency(value),
        },
        {
            title: 'Última compra',
            dataIndex: 'last_purchase_at',
            key: 'last_purchase_at',
            sorter: (a, b) => String(a.last_purchase_at ?? '').localeCompare(String(b.last_purchase_at ?? '')),
            render: (value: string | null) => formatDate(value),
        },
        {
            title: 'Observacoes',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            render: (value: string | null) => value || 'Sem observacoes.',
            ...getTextFilter('notes', 'Filtrar observacoes'),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Produtos</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Cadastre o que entra no estoque.</h1>
                    </div>
                    <PrimaryButton
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full justify-center sm:w-auto"
                    >
                        Novo produto
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Produtos" />

            <SectionCard
                title="Produtos cadastrados"
                description={`${products.length} itens no catalogo atual.`}
                actions={
                    selectedRowKeys.length > 0 ? (
                        <DangerButton type="button" onClick={deleteSelectedProducts}>
                            Excluir selecionados ({selectedRowKeys.length})
                        </DangerButton>
                    ) : null
                }
            >
                <ResponsiveDataTable<ProductTableRecord>
                    rowKey="key"
                    columns={columns}
                    dataSource={dataSource}
                    searchEnabled
                    searchPlaceholder="Buscar por produto, marca, SKU, categoria ou observações"
                    searchFields={['name', 'brand', 'sku', 'category.name', 'notes']}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                        preserveSelectedRowKeys: true,
                    }}
                    pagination={{
                        pageSize: 12,
                        showSizeChanger: true,
                        pageSizeOptions: [12, 24, 48],
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} produtos`,
                    }}
                    size="middle"
                    scroll={{ x: 1200 }}
                    rowClassName={() => 'cursor-pointer'}
                    onRow={(record) => ({
                        onClick: (event) => {
                            const target = event.target as HTMLElement;
                            if (
                                target.closest(
                                    'button, a, input, label, textarea, .ant-checkbox-wrapper, .ant-checkbox, .ant-table-row-expand-icon',
                                )
                            ) {
                                return;
                            }
                            openEditModal(record);
                        },
                    })}
                    mobileRenderCard={(record, mobileMeta) => {
                        const typeLabel =
                            record.type === 'stockable' ? 'Estocável' : 'Não estocável';
                        const lowStock = record.current_stock <= record.minimum_stock;

                        return (
                            <ResponsiveCard key={record.key}>
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={mobileMeta.isSelected}
                                        onChange={(event) =>
                                            mobileMeta.toggleSelected(event.target.checked)
                                        }
                                    />

                                    <button
                                        type="button"
                                        className="min-w-0 flex-1 text-left"
                                        onClick={() => openEditModal(record)}
                                    >
                                        <ResponsiveCardHeader
                                            title={record.name}
                                            subtitle={`${record.brand || 'Sem marca'}${record.sku ? ` • ${record.sku}` : ''}`}
                                            trailing={
                                                <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                                                    {formatCurrency(record.total_spent)}
                                                </span>
                                            }
                                        />

                                        <ResponsiveCardPills>
                                            <ResponsiveCardPill tone="warm">
                                                {record.category?.name ?? 'Sem categoria'}
                                            </ResponsiveCardPill>
                                            <ResponsiveCardPill>{typeLabel}</ResponsiveCardPill>
                                        </ResponsiveCardPills>

                                        <ResponsiveCardFields columns={2}>
                                            <ResponsiveCardField label="Unidade:" value={record.unit} />
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
                                                label="Última compra:"
                                                value={formatDate(record.last_purchase_at)}
                                            />
                                            <ResponsiveCardField
                                                label="Observacoes:"
                                                value={record.notes || 'Sem observacoes.'}
                                                colSpan={2}
                                            />
                                        </ResponsiveCardFields>
                                    </button>
                                </div>
                            </ResponsiveCard>
                        );
                    }}
                />
            </SectionCard>

            <ProductModal
                isOpen={Boolean(editingProduct)}
                onClose={closeEditModal}
                onSubmit={submitEdit}
                processing={editProcessing}
                data={editData}
                errors={editErrors}
                onFieldChange={(field, value) => setEditData(field as keyof typeof editData, value as never)}
                title="Editar produto"
                description="Ajuste os dados do produto sem perder o historico de compras."
                saveLabel="Salvar alteracoes"
                categories={categories}
                units={units}
                onDelete={deleteEditingProduct}
                idPrefix="edit"
            />

            <ProductModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                onSubmit={submit}
                processing={processing}
                data={data}
                errors={errors}
                onFieldChange={(field, value) => setData(field as keyof typeof data, value as never)}
                title="Novo produto"
                description="Estoque inicial fica em zero e passa a crescer conforme voce registra compras."
                saveLabel="Criar produto"
                categories={categories}
                units={units}
            />
        </AuthenticatedLayout>
    );
}
