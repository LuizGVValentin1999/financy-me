import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SectionCard from '@/Components/SectionCard';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useState } from 'react';

interface ProductsPageProps {
    categories: Array<{
        id: number;
        name: string;
        color: string;
        kind: string;
    }>;
    units: Array<{
        value: string;
        label: string;
    }>;
    products: Array<{
        id: number;
        category_id: number | null;
        name: string;
        brand: string | null;
        sku: string | null;
        unit: string;
        minimum_stock: number;
        current_stock: number;
        is_active: boolean;
        notes: string | null;
        category: { name: string; color: string } | null;
        total_spent: number;
        last_purchase_at: string | null;
    }>;
}

type ProductRow = ProductsPageProps['products'][number];
type ProductTableRecord = ProductRow & { key: string };

export default function ProductsIndex({
    categories,
    units,
    products,
}: ProductsPageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        category_id: '',
        name: '',
        brand: '',
        sku: '',
        unit: units[0]?.value ?? 'un',
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
                reset();
                setIsCreateModalOpen(false);
            },
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
            onSuccess: () => closeEditModal(),
        });
    };

    const deleteEditingProduct = () => {
        if (!editingProduct) {
            return;
        }

        if (!confirm('Excluir este produto?')) {
            return;
        }

        router.delete(route('products.destroy', editingProduct.id), {
            preserveScroll: true,
            onSuccess: () => closeEditModal(),
        });
    };

    const deleteSelectedProducts = () => {
        if (selectedRowKeys.length === 0) {
            return;
        }

        const total = selectedRowKeys.length;

        if (
            !confirm(
                total === 1
                    ? 'Excluir 1 produto selecionado?'
                    : `Excluir ${total} produtos selecionados?`,
            )
        ) {
            return;
        }

        router.delete(route('products.destroy-many'), {
            data: {
                ids: selectedRowKeys.map((key) => Number(key)),
            },
            preserveScroll: true,
            onSuccess: () => setSelectedRowKeys([]),
        });
    };

    const getTextFilter = (
        dataIndex: keyof ProductRow,
        placeholder: string,
    ): ColumnsType<ProductTableRecord>[number] => ({
        filterDropdown: ({
            selectedKeys,
            setSelectedKeys,
            confirm,
            clearFilters,
        }: FilterDropdownProps) => (
            <div className="w-64 p-3">
                <Input
                    value={String(selectedKeys[0] ?? '')}
                    placeholder={placeholder}
                    onChange={(event) =>
                        setSelectedKeys(
                            event.target.value ? [event.target.value] : [],
                        )
                    }
                    onPressEnter={() => confirm()}
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
                    <p className="mt-1 text-slate-500">
                        {record.brand || 'Sem marca'}
                        {record.sku ? ` • ${record.sku}` : ''}
                    </p>
                </div>
            ),
            ...getTextFilter('name', 'Filtrar por produto'),
        },
        {
            title: 'Categoria',
            dataIndex: 'category',
            key: 'category',
            render: (_: unknown, record) =>
                record.category ? (
                    <Tag color="cyan">{record.category.name}</Tag>
                ) : (
                    '--'
                ),
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
                        onChange={(value: string | undefined) =>
                            setSelectedKeys(value ? [value] : [])
                        }
                        options={categories
                            .filter((category) => category.kind === 'produto')
                            .map((category) => ({
                                value: category.name,
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
            onFilter: (value: Key | boolean, record: ProductTableRecord) =>
                String(record.category?.name ?? '') === String(value),
        },
        {
            title: 'Unidade',
            dataIndex: 'unit',
            key: 'unit',
            sorter: (a, b) => a.unit.localeCompare(b.unit),
            ...getTextFilter('unit', 'Filtrar unidade'),
        },
        {
            title: 'Estoque',
            dataIndex: 'current_stock',
            key: 'current_stock',
            align: 'right',
            sorter: (a, b) => a.current_stock - b.current_stock,
            render: (_: unknown, record) => (
                <span
                    className={`font-semibold ${
                        record.current_stock <= record.minimum_stock
                            ? 'text-[#be3d2a]'
                            : 'text-slate-900'
                    }`}
                >
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
            render: (_: unknown, record) =>
                `${formatQuantity(record.minimum_stock)} ${record.unit}`,
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
            title: 'Ultima compra',
            dataIndex: 'last_purchase_at',
            key: 'last_purchase_at',
            sorter: (a, b) =>
                String(a.last_purchase_at ?? '').localeCompare(
                    String(b.last_purchase_at ?? ''),
                ),
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
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                            Produtos
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                            Cadastre o que entra no estoque.
                        </h1>
                    </div>

                    <PrimaryButton
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Novo produto
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Produtos" />

            <div className="space-y-6">
                <SectionCard
                    title="Produtos cadastrados"
                    description={`${products.length} itens no catalogo atual.`}
                    actions={
                        selectedRowKeys.length > 0 ? (
                            <DangerButton
                                type="button"
                                onClick={deleteSelectedProducts}
                            >
                                Excluir selecionados ({selectedRowKeys.length})
                            </DangerButton>
                        ) : null
                    }
                >
                    <div className="purchase-ant-table">
                        <Table<ProductTableRecord>
                            rowKey="key"
                            columns={columns}
                            dataSource={dataSource}
                            rowSelection={{
                                selectedRowKeys,
                                onChange: (keys) => setSelectedRowKeys(keys),
                                preserveSelectedRowKeys: true,
                            }}
                            pagination={{
                                pageSize: 12,
                                showSizeChanger: true,
                                pageSizeOptions: [12, 24, 48],
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} de ${total} produtos`,
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
                        />
                    </div>
                </SectionCard>
            </div>

            <Modal
                show={Boolean(editingProduct)}
                onClose={closeEditModal}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                            Produtos
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            Editar produto
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Ajuste os dados do produto sem perder o historico de compras.
                        </p>
                    </div>

                    <form onSubmit={submitEdit} className="mt-6 space-y-5">
                        <div>
                            <InputLabel htmlFor="edit_name" value="Nome" />
                            <input
                                id="edit_name"
                                type="text"
                                value={editData.name}
                                onChange={(event) =>
                                    setEditData('name', event.target.value)
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError message={editErrors.name} className="mt-2" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="edit_brand" value="Marca" />
                                <input
                                    id="edit_brand"
                                    type="text"
                                    value={editData.brand}
                                    onChange={(event) =>
                                        setEditData('brand', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="edit_sku" value="SKU ou codigo" />
                                <input
                                    id="edit_sku"
                                    type="text"
                                    value={editData.sku}
                                    onChange={(event) =>
                                        setEditData('sku', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <InputLabel
                                    htmlFor="edit_category_id"
                                    value="Categoria"
                                />
                                <Select
                                    id="edit_category_id"
                                    value={editData.category_id || undefined}
                                    onChange={(value) =>
                                        setEditData('category_id', value ?? '')
                                    }
                                    className="mt-2 w-full"
                                    size="large"
                                    allowClear
                                    placeholder="Sem categoria"
                                    options={categories
                                        .filter(
                                            (category) =>
                                                category.kind === 'produto',
                                        )
                                        .map((category) => ({
                                            value: String(category.id),
                                            label: category.name,
                                        }))}
                                />
                                <InputError
                                    message={editErrors.category_id}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="edit_unit" value="Unidade" />
                                <Select
                                    id="edit_unit"
                                    value={editData.unit}
                                    onChange={(value) => setEditData('unit', value)}
                                    className="mt-2 w-full"
                                    size="large"
                                    options={units.map((unit) => ({
                                        value: unit.value,
                                        label: unit.label,
                                    }))}
                                />
                                <InputError message={editErrors.unit} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit_minimum_stock"
                                value="Estoque minimo"
                            />
                            <input
                                id="edit_minimum_stock"
                                type="number"
                                min="0"
                                step="0.001"
                                value={editData.minimum_stock}
                                onChange={(event) =>
                                    setEditData(
                                        'minimum_stock',
                                        event.target.value,
                                    )
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={editErrors.minimum_stock}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_notes" value="Observacoes" />
                            <textarea
                                id="edit_notes"
                                rows={5}
                                value={editData.notes}
                                onChange={(event) =>
                                    setEditData('notes', event.target.value)
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError message={editErrors.notes} className="mt-2" />
                        </div>

                        <div className="flex flex-wrap justify-end gap-3">
                            <SecondaryButton
                                type="button"
                                onClick={closeEditModal}
                            >
                                Cancelar
                            </SecondaryButton>
                            <DangerButton
                                type="button"
                                onClick={deleteEditingProduct}
                            >
                                Excluir
                            </DangerButton>
                            <PrimaryButton disabled={editProcessing}>
                                Salvar alteracoes
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                show={isCreateModalOpen}
                onClose={closeCreateModal}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                            Produtos
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            Novo produto
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Estoque inicial fica em zero e passa a crescer
                            conforme voce registra compras.
                        </p>
                    </div>

                    <form onSubmit={submit} className="mt-6 space-y-5">
                        <div>
                            <InputLabel htmlFor="name" value="Nome" />
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="brand" value="Marca" />
                                <input
                                    id="brand"
                                    type="text"
                                    value={data.brand}
                                    onChange={(event) =>
                                        setData('brand', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="sku" value="SKU ou codigo" />
                                <input
                                    id="sku"
                                    type="text"
                                    value={data.sku}
                                    onChange={(event) =>
                                        setData('sku', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <InputLabel
                                    htmlFor="category_id"
                                    value="Categoria"
                                />
                                <Select
                                    id="category_id"
                                    value={data.category_id || undefined}
                                    onChange={(value) =>
                                        setData('category_id', value ?? '')
                                    }
                                    className="mt-2 w-full"
                                    size="large"
                                    allowClear
                                    placeholder="Sem categoria"
                                    options={categories
                                        .filter(
                                            (category) =>
                                                category.kind === 'produto',
                                        )
                                        .map((category) => ({
                                            value: String(category.id),
                                            label: category.name,
                                        }))}
                                />
                                <InputError
                                    message={errors.category_id}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="unit" value="Unidade" />
                                <Select
                                    id="unit"
                                    value={data.unit}
                                    onChange={(value) => setData('unit', value)}
                                    className="mt-2 w-full"
                                    size="large"
                                    options={units.map((unit) => ({
                                        value: unit.value,
                                        label: unit.label,
                                    }))}
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="minimum_stock"
                                value="Estoque minimo"
                            />
                            <input
                                id="minimum_stock"
                                type="number"
                                min="0"
                                step="0.001"
                                value={data.minimum_stock}
                                onChange={(event) =>
                                    setData(
                                        'minimum_stock',
                                        event.target.value,
                                    )
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={errors.minimum_stock}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Observacoes" />
                            <textarea
                                id="notes"
                                rows={5}
                                value={data.notes}
                                onChange={(event) =>
                                    setData('notes', event.target.value)
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex flex-wrap justify-end gap-3">
                            <SecondaryButton
                                type="button"
                                onClick={closeCreateModal}
                            >
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                Criar produto
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
