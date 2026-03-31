import DangerButton from '@/Components/DangerButton';
import FormModalActions from '@/Components/FormModalActions';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import CategoryFormFields from '@/Components/Categories/CategoryFormFields';
import SectionCard from '@/Components/SectionCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { Button, Modal as AntdModal, Table, Tag, message } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useState } from 'react';

interface CategoriesPageProps {
    categories: Array<{
        id: number;
        code: string;
        name: string;
        color: string;
        description: string | null;
        created_at: string;
    }>;
}

type CategoryRow = CategoriesPageProps['categories'][number];
type CategoryTableRecord = CategoryRow & { key: string };

export default function CategoriesIndex({
    categories,
}: CategoriesPageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
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

    const handleCreateFieldChange = (
        field: keyof typeof data,
        value: string,
    ) => {
        setData(field as keyof typeof data, value as never);
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

    const handleEditFieldChange = (
        field: keyof typeof editData,
        value: string,
    ) => {
        setEditData(field as keyof typeof editData, value as never);
    };

    const deleteEditingCategory = () => {
        if (!editingCategory) {
            return;
        }

        AntdModal.confirm({
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

        AntdModal.confirm({
            title: 'Confirmar exclusão',
            content: total === 1
                ? 'Excluir 1 categoria selecionada?'
                : `Excluir ${total} categorias selecionadas?`,
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('categories.destroy-many'), {
                    data: {
                        ids: selectedRowKeys.map((key) => Number(key)),
                    },
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
            render: (value: string) => (
                <span className="font-mono text-sm font-semibold text-slate-600">
                    {value}
                </span>
            ),
            ...getTextFilter('code', 'Filtrar por código'),
        },
        {
            title: 'Categoria',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_: unknown, record) => (
                <div className="flex items-center gap-3">
                    <div
                        className="h-6 w-6 rounded-md border border-slate-200"
                        style={{ backgroundColor: record.color }}
                    />
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
            sorter: (a, b) =>
                String(a.created_at ?? '').localeCompare(
                    String(b.created_at ?? ''),
                ),
            render: (value: string) => formatDate(value),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                            Categorias
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                            Organize seus produtos em categorias.
                        </h1>
                    </div>

                    <PrimaryButton
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Nova categoria
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Categorias" />

            <div className="space-y-6">
                <SectionCard
                    title="Categorias cadastradas"
                    description={`${categories.length} categorias no sistema.`}
                    actions={
                        selectedRowKeys.length > 0 ? (
                            <DangerButton
                                type="button"
                                onClick={deleteSelectedCategories}
                            >
                                Excluir selecionadas ({selectedRowKeys.length})
                            </DangerButton>
                        ) : null
                    }
                >
                    <div className="purchase-ant-table">
                        <Table<CategoryTableRecord>
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
                                    `${range[0]}-${range[1]} de ${total} categorias`,
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
                show={Boolean(editingCategory)}
                onClose={closeEditModal}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                            Categorias
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            Editar categoria
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Ajuste os dados da categoria.
                        </p>
                    </div>

                    <form onSubmit={submitEdit} className="mt-6 space-y-5">
                        <CategoryFormFields
                            data={editData}
                            errors={editErrors}
                            idPrefix="edit"
                            onFieldChange={handleEditFieldChange}
                        />

                        <FormModalActions
                            onCancel={closeEditModal}
                            onDelete={deleteEditingCategory}
                            saveLabel="Salvar alterações"
                            saveDisabled={editProcessing}
                        />
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
                            Categorias
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            Nova categoria
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Crie categorias para organizar seus produtos.
                        </p>
                    </div>

                    <form onSubmit={submit} className="mt-6 space-y-5">
                        <CategoryFormFields
                            data={data}
                            errors={errors}
                            onFieldChange={handleCreateFieldChange}
                        />

                        <FormModalActions
                            onCancel={closeCreateModal}
                            saveLabel="Criar categoria"
                            saveDisabled={processing}
                        />
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
