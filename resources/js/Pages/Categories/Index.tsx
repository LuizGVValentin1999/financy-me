import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import ResponsiveDataTable from '@/Components/ResponsiveDataTable';
import {
    ResponsiveCard,
    ResponsiveCardField,
    ResponsiveCardFields,
    ResponsiveCardHeader,
} from '@/Components/responsive-table/ResponsiveCard';
import SectionCard from '@/Components/SectionCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import { useAntdApp } from '@/hooks/useAntdApp';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CategoryModal from '@/Pages/Categories/components/CategoryModal';
import type { CategoriesPageProps, CategoryRow, CategoryTableRecord } from '@/Pages/Categories/types';
import { formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { Checkbox } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useState } from 'react';

export default function CategoriesIndex({ categories }: CategoriesPageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const { message, modal } = useAntdApp();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        color: '#1F7A8C',
        description: '',
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
        code: '',
        name: '',
        color: '#1F7A8C',
        description: '',
    });

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('categories.store'), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Categoria criada com sucesso!');
                reset();
                setIsCreateModalOpen(false);
            },
            onError: () => message.error('Erro ao criar categoria'),
        });
    };

    const closeEditModal = () => {
        setEditingCategory(null);
        resetEdit();
        clearEditErrors();
    };

    const openEditModal = (category: CategoryRow) => {
        setEditingCategory(category);
        setEditData({
            code: category.code,
            name: category.name,
            color: category.color,
            description: category.description ?? '',
        });
        clearEditErrors();
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingCategory) {
            return;
        }

        patch(route('categories.update', editingCategory.id), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Categoria atualizada com sucesso!');
                closeEditModal();
            },
            onError: () => message.error('Erro ao atualizar categoria'),
        });
    };

    const deleteEditingCategory = () => {
        if (!editingCategory) {
            return;
        }

        modal.confirm({
            title: 'Confirmar exclusão',
            content: 'Excluir esta categoria?',
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('categories.destroy', editingCategory.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info('Categoria excluída com sucesso!');
                        closeEditModal();
                    },
                    onError: () => message.error('Erro ao excluir categoria'),
                });
            },
        });
    };

    const deleteSelectedCategories = () => {
        if (selectedRowKeys.length === 0) {
            return;
        }

        const total = selectedRowKeys.length;

        modal.confirm({
            title: 'Confirmar exclusão',
            content: total === 1 ? 'Excluir 1 categoria selecionada?' : `Excluir ${total} categorias selecionadas?`,
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('categories.destroy-many'), {
                    data: { ids: selectedRowKeys.map((key) => Number(key)) },
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info(`${selectedRowKeys.length} categorias excluídas com sucesso!`);
                        setSelectedRowKeys([]);
                    },
                    onError: () => message.error('Erro ao excluir categorias'),
                });
            },
        });
    };

    const getTextFilter = (
        dataIndex: keyof CategoryRow,
        placeholder: string,
    ): ColumnsType<CategoryTableRecord>[number] => ({
        filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
            <TableTextFilterDropdown
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                confirm={confirm}
                clearFilters={clearFilters}
                placeholder={placeholder}
            />
        ),
        onFilter: (value: Key | boolean, record: CategoryTableRecord) => {
            const current = String(record[dataIndex] ?? '').toLowerCase();
            return current.includes(String(value).toLowerCase());
        },
    });

    const dataSource: CategoryTableRecord[] = categories.map((category) => ({
        ...category,
        key: String(category.id),
    }));

    const columns: ColumnsType<CategoryTableRecord> = [
        {
            title: 'Código',
            dataIndex: 'code',
            key: 'code',
            width: 120,
            sorter: (a, b) => a.code.localeCompare(b.code),
            render: (value: string) => <span className="font-mono text-sm font-semibold text-slate-600">{value}</span>,
            ...getTextFilter('code', 'Filtrar por código'),
        },
        {
            title: 'Categoria',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_: unknown, record) => (
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-md border border-slate-200" style={{ backgroundColor: record.color }} />
                    <p className="font-semibold text-slate-900">{record.name}</p>
                </div>
            ),
            ...getTextFilter('name', 'Filtrar por categoria'),
        },
        {
            title: 'Descrição',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (value: string | null) => value || 'Sem descrição.',
            ...getTextFilter('description', 'Filtrar por descrição'),
        },
        {
            title: 'Criado em',
            dataIndex: 'created_at',
            key: 'created_at',
            sorter: (a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')),
            render: (value: string) => formatDate(value),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Categorias</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Organize seus produtos em categorias.</h1>
                    </div>
                    <PrimaryButton
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full justify-center sm:w-auto"
                    >
                        Nova categoria
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Categorias" />

            <SectionCard
                title="Categorias cadastradas"
                description={`${categories.length} categorias no sistema.`}
                actions={
                    selectedRowKeys.length > 0 ? (
                        <DangerButton type="button" onClick={deleteSelectedCategories}>
                            Excluir selecionadas ({selectedRowKeys.length})
                        </DangerButton>
                    ) : null
                }
            >
                <ResponsiveDataTable<CategoryTableRecord>
                    rowKey="key"
                    columns={columns}
                    dataSource={dataSource}
                    searchEnabled
                    searchPlaceholder="Buscar por código, categoria ou descrição"
                    searchFields={['code', 'name', 'description']}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                        preserveSelectedRowKeys: true,
                    }}
                    pagination={{
                        pageSize: 12,
                        showSizeChanger: true,
                        pageSizeOptions: [12, 24, 48],
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} categorias`,
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
                    mobileRenderCard={(record, mobileMeta) => (
                        <ResponsiveCard key={record.key}>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    checked={mobileMeta.isSelected}
                                    onChange={(event) => mobileMeta.toggleSelected(event.target.checked)}
                                />

                                <button
                                    type="button"
                                    className="min-w-0 flex-1 text-left"
                                    onClick={() => openEditModal(record)}
                                >
                                    <ResponsiveCardHeader
                                        eyebrow={record.code}
                                        title={
                                            <span className="flex items-center gap-3">
                                                <span
                                                    className="h-6 w-6 rounded-md border border-slate-200"
                                                    style={{ backgroundColor: record.color }}
                                                />
                                                <span className="truncate">{record.name}</span>
                                            </span>
                                        }
                                    />

                                    <ResponsiveCardFields>
                                        <ResponsiveCardField
                                            label="Descrição:"
                                            value={record.description || 'Sem descrição.'}
                                        />
                                        <ResponsiveCardField
                                            label="Criada em:"
                                            value={formatDate(record.created_at)}
                                        />
                                    </ResponsiveCardFields>
                                </button>
                            </div>
                        </ResponsiveCard>
                    )}
                />
            </SectionCard>

            <CategoryModal
                isOpen={Boolean(editingCategory)}
                onClose={closeEditModal}
                onSubmit={submitEdit}
                processing={editProcessing}
                data={editData}
                errors={editErrors}
                onFieldChange={(field, value) => setEditData(field as keyof typeof editData, value as never)}
                title="Editar categoria"
                description="Ajuste os dados da categoria."
                saveLabel="Salvar alterações"
                onDelete={deleteEditingCategory}
                idPrefix="edit"
            />

            <CategoryModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                onSubmit={submit}
                processing={processing}
                data={data}
                errors={errors}
                onFieldChange={(field, value) => setData(field as keyof typeof data, value as never)}
                title="Nova categoria"
                description="Crie categorias para organizar seus produtos."
                saveLabel="Criar categoria"
            />
        </AuthenticatedLayout>
    );
}
