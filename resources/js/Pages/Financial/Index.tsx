import DangerButton from '@/Components/DangerButton';
import FormModalActions from '@/Components/FormModalActions';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SectionCard from '@/Components/SectionCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { Modal as AntdModal, Select, Table, Tag, message } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useMemo, useState } from 'react';

interface FinancialPageProps {
    accounts: Array<{
        id: number;
        code: string;
        name: string;
    }>;
    categories: Array<{
        id: number;
        code: string;
        name: string;
        color: string;
    }>;
    entries: Array<{
        id: number;
        account_id: number | null;
        account: { id: number; code: string; name: string } | null;
        category_id: number | null;
        category: { id: number; code: string; name: string; color: string } | null;
        direction: 'inflow' | 'outflow';
        origin: string;
        amount: number;
        moved_at: string | null;
        description: string | null;
        created_at: string | null;
    }>;
}

type EntryRow = FinancialPageProps['entries'][number];
type EntryTableRecord = EntryRow & { key: string };

export default function FinancialIndex({ accounts, categories, entries }: FinancialPageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<EntryRow | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        account_id: '',
        category_id: '',
        direction: 'outflow' as 'inflow' | 'outflow',
        amount: '0',
        moved_at: new Date().toISOString().slice(0, 10),
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
        account_id: '',
        category_id: '',
        direction: 'outflow' as 'inflow' | 'outflow',
        amount: '0',
        moved_at: '',
        description: '',
    });

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('financial.store'), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Lançamento criado com sucesso!');
                reset();
                setIsCreateModalOpen(false);
            },
            onError: () => message.error('Erro ao criar lançamento'),
        });
    };

    const closeEditModal = () => {
        setEditingEntry(null);
        resetEdit();
        clearEditErrors();
    };

    const openEditModal = (entry: EntryRow) => {
        if (entry.origin !== 'manual') {
            return;
        }

        setEditingEntry(entry);
        setEditData({
            account_id: entry.account_id ? String(entry.account_id) : '',
            category_id: entry.category_id ? String(entry.category_id) : '',
            direction: entry.direction,
            amount: String(entry.amount),
            moved_at: entry.moved_at ?? new Date().toISOString().slice(0, 10),
            description: entry.description ?? '',
        });
        clearEditErrors();
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingEntry) {
            return;
        }

        patch(route('financial.update', editingEntry.id), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Lançamento atualizado com sucesso!');
                closeEditModal();
            },
            onError: () => message.error('Erro ao atualizar lançamento'),
        });
    };

    const deleteEditingEntry = () => {
        if (!editingEntry) {
            return;
        }

        AntdModal.confirm({
            title: 'Confirmar exclusão',
            content: 'Excluir este lançamento?',
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('financial.destroy', editingEntry.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info('Lançamento excluído com sucesso!');
                        closeEditModal();
                    },
                    onError: () => message.error('Erro ao excluir lançamento'),
                });
            },
        });
    };

    const deleteSelectedEntries = () => {
        if (selectedRowKeys.length === 0) {
            return;
        }

        const total = selectedRowKeys.length;

        AntdModal.confirm({
            title: 'Confirmar exclusão',
            content: total === 1
                ? 'Excluir 1 lançamento manual selecionado?'
                : `Excluir ${total} lançamentos manuais selecionados?`,
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('financial.destroy-many'), {
                    data: {
                        ids: selectedRowKeys.map((key) => Number(key)),
                    },
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info(`${selectedRowKeys.length} lançamentos excluídos com sucesso!`);
                        setSelectedRowKeys([]);
                    },
                    onError: () => message.error('Erro ao excluir lançamentos'),
                });
            },
        });
    };

    const manualIds = useMemo(
        () => new Set(entries.filter((entry) => entry.origin === 'manual').map((entry) => String(entry.id))),
        [entries],
    );

    const directionOptions = useMemo(
        () => [
            { value: 'inflow', label: 'Entrada' },
            { value: 'outflow', label: 'Saída' },
        ],
        [],
    );

    const accountOptions = useMemo(
        () => [
            { value: '', label: 'Sem conta' },
            ...accounts.map((account) => ({
                value: String(account.id),
                label: `${account.code} - ${account.name}`,
            })),
        ],
        [accounts],
    );

    const categoryOptions = useMemo(
        () => [
            { value: '', label: 'Sem categoria' },
            ...categories.map((category) => ({
                value: String(category.id),
                label: `${category.code} - ${category.name}`,
            })),
        ],
        [categories],
    );

    const getTextFilter = (
        dataIndex: keyof EntryRow,
        placeholder: string,
    ): ColumnsType<EntryTableRecord>[number] => ({
        filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
            <TableTextFilterDropdown
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                confirm={confirm}
                clearFilters={clearFilters}
                placeholder={placeholder}
            />
        ),
        onFilter: (value: Key | boolean, record: EntryTableRecord) =>
            String(record[dataIndex] ?? '').toLowerCase().includes(String(value).toLowerCase()),
    });

    const dataSource: EntryTableRecord[] = entries.map((entry) => ({
        ...entry,
        key: String(entry.id),
    }));

    const columns: ColumnsType<EntryTableRecord> = [
        {
            title: 'Data',
            dataIndex: 'moved_at',
            key: 'moved_at',
            sorter: (a, b) => String(a.moved_at ?? '').localeCompare(String(b.moved_at ?? '')),
            render: (value: string | null) => formatDate(value),
        },
        {
            title: 'Tipo',
            dataIndex: 'direction',
            key: 'direction',
            render: (value: 'inflow' | 'outflow') => (
                <Tag color={value === 'inflow' ? 'green' : 'red'}>
                    {value === 'inflow' ? 'Entrada' : 'Saída'}
                </Tag>
            ),
        },
        {
            title: 'Valor',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            sorter: (a, b) => a.amount - b.amount,
            render: (_: number, record) => (
                <span className={record.direction === 'inflow' ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
                    {record.direction === 'inflow' ? '+' : '-'} {formatCurrency(record.amount)}
                </span>
            ),
        },
        {
            title: 'Conta',
            dataIndex: 'account',
            key: 'account',
            render: (_: unknown, record) => record.account ? `${record.account.code} - ${record.account.name}` : '--',
            ...getTextFilter('description', 'Filtrar por descrição'),
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
        },
        {
            title: 'Origem',
            dataIndex: 'origin',
            key: 'origin',
            render: (value: string) => {
                if (value === 'manual') return 'Manual';
                if (value === 'manual_purchase') return 'Compra manual';
                if (value === 'invoice_purchase') return 'Compra importada';
                if (value === 'invoice_discount') return 'Desconto de nota';
                return value;
            },
        },
        {
            title: 'Descrição',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (value: string | null) => value || '--',
            ...getTextFilter('description', 'Filtrar por descrição'),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Financeiro</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Entradas e saídas das contas.</h1>
                    </div>

                    <PrimaryButton type="button" onClick={() => setIsCreateModalOpen(true)}>
                        Novo lançamento
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Financeiro" />

            <SectionCard
                title="Lançamentos financeiros"
                description={`${entries.length} lançamentos no histórico.`}
                actions={
                    selectedRowKeys.length > 0 ? (
                        <DangerButton type="button" onClick={deleteSelectedEntries}>
                            Excluir selecionados ({selectedRowKeys.length})
                        </DangerButton>
                    ) : null
                }
            >
                <div className="purchase-ant-table">
                    <Table<EntryTableRecord>
                        rowKey="key"
                        columns={columns}
                        dataSource={dataSource}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: (keys) => setSelectedRowKeys(keys.filter((key) => manualIds.has(String(key)))),
                            getCheckboxProps: (record) => ({
                                disabled: record.origin !== 'manual',
                            }),
                        }}
                        pagination={{ pageSize: 12, showSizeChanger: true }}
                        size="middle"
                        scroll={{ x: 1200 }}
                        rowClassName={(record) => (record.origin === 'manual' ? 'cursor-pointer' : 'opacity-90')}
                        onRow={(record) => ({
                            onClick: (event) => {
                                const target = event.target as HTMLElement;
                                if (target.closest('button, a, input, label, textarea, .ant-checkbox-wrapper, .ant-checkbox')) {
                                    return;
                                }
                                openEditModal(record);
                            },
                        })}
                    />
                </div>
            </SectionCard>

            <Modal show={Boolean(editingEntry)} onClose={closeEditModal} maxWidth="2xl">
                <div className="p-5 sm:p-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Financeiro</p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">Editar lançamento</h2>

                    <form onSubmit={submitEdit} className="mt-6 space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="edit_direction" value="Direção" />
                                <Select
                                    id="edit_direction"
                                    value={editData.direction}
                                    options={directionOptions}
                                    onChange={(value) => setEditData('direction', value as 'inflow' | 'outflow')}
                                    className="mt-2 block w-full"
                                />
                                <InputError message={editErrors.direction} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_amount" value="Valor" />
                                <input
                                    id="edit_amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editData.amount}
                                    onChange={(event) => setEditData('amount', event.target.value)}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError message={editErrors.amount} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="edit_account_id" value="Conta" />
                                <Select
                                    id="edit_account_id"
                                    value={editData.account_id}
                                    options={accountOptions}
                                    onChange={(value) => setEditData('account_id', value)}
                                    className="mt-2 block w-full"
                                />
                                <InputError message={editErrors.account_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_category_id" value="Categoria" />
                                <Select
                                    id="edit_category_id"
                                    value={editData.category_id}
                                    options={categoryOptions}
                                    onChange={(value) => setEditData('category_id', value)}
                                    className="mt-2 block w-full"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="edit_moved_at" value="Data" />
                                <input
                                    id="edit_moved_at"
                                    type="date"
                                    value={editData.moved_at}
                                    onChange={(event) => setEditData('moved_at', event.target.value)}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_description" value="Descrição" />
                                <input
                                    id="edit_description"
                                    type="text"
                                    value={editData.description}
                                    onChange={(event) => setEditData('description', event.target.value)}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>
                        </div>

                        <FormModalActions
                            onCancel={closeEditModal}
                            onDelete={deleteEditingEntry}
                            saveLabel="Salvar alterações"
                            saveDisabled={editProcessing}
                        />
                    </form>
                </div>
            </Modal>

            <Modal show={isCreateModalOpen} onClose={closeCreateModal} maxWidth="2xl">
                <div className="p-5 sm:p-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Financeiro</p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">Novo lançamento</h2>

                    <form onSubmit={submit} className="mt-6 space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="direction" value="Direção" />
                                <Select
                                    id="direction"
                                    value={data.direction}
                                    options={directionOptions}
                                    onChange={(value) => setData('direction', value as 'inflow' | 'outflow')}
                                    className="mt-2 block w-full"
                                />
                                <InputError message={errors.direction} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="amount" value="Valor" />
                                <input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(event) => setData('amount', event.target.value)}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError message={errors.amount} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="account_id" value="Conta" />
                                <Select
                                    id="account_id"
                                    value={data.account_id}
                                    options={accountOptions}
                                    onChange={(value) => setData('account_id', value)}
                                    className="mt-2 block w-full"
                                />
                                <InputError message={errors.account_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="category_id" value="Categoria" />
                                <Select
                                    id="category_id"
                                    value={data.category_id}
                                    options={categoryOptions}
                                    onChange={(value) => setData('category_id', value)}
                                    className="mt-2 block w-full"
                                />
                                <InputError message={errors.category_id} className="mt-2" />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="moved_at" value="Data" />
                                <input
                                    id="moved_at"
                                    type="date"
                                    value={data.moved_at}
                                    onChange={(event) => setData('moved_at', event.target.value)}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError message={errors.moved_at} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="description" value="Descrição" />
                                <input
                                    id="description"
                                    type="text"
                                    value={data.description}
                                    onChange={(event) => setData('description', event.target.value)}
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        <FormModalActions onCancel={closeCreateModal} saveLabel="Criar lançamento" saveDisabled={processing} />
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
