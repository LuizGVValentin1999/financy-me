import DangerButton from '@/Components/DangerButton';
import FormModalActions from '@/Components/FormModalActions';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import AccountFormFields from '@/Components/Accounts/AccountFormFields';
import SectionCard from '@/Components/SectionCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { Button, Table, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useState } from 'react';

interface AccountsPageProps {
    accounts: Array<{
        id: number;
        code: string;
        name: string;
        initial_balance: number;
        initial_balance_date: string;
        created_at: string;
    }>;
}

type AccountRow = AccountsPageProps['accounts'][number];
type AccountTableRecord = AccountRow & { key: string };

export default function AccountsIndex({
    accounts,
}: AccountsPageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        initial_balance: '0',
        initial_balance_date: new Date().toISOString().split('T')[0],
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
        initial_balance: '0',
        initial_balance_date: '',
    });

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('accounts.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleCreateFieldChange = (
        field: keyof typeof data,
        value: string,
    ) => {
        setData(field as keyof typeof data, value as never);
    };

    const closeEditModal = () => {
        setEditingAccount(null);
        resetEdit();
        clearEditErrors();
    };

    const openEditModal = (account: AccountRow) => {
        setEditingAccount(account);
        setEditData({
            code: account.code,
            name: account.name,
            initial_balance: String(account.initial_balance),
            initial_balance_date: account.initial_balance_date,
        });
        clearEditErrors();
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingAccount) {
            return;
        }

        patch(route('accounts.update', editingAccount.id), {
            preserveScroll: true,
            onSuccess: () => closeEditModal(),
        });
    };

    const handleEditFieldChange = (
        field: keyof typeof editData,
        value: string,
    ) => {
        setEditData(field as keyof typeof editData, value as never);
    };

    const deleteEditingAccount = () => {
        if (!editingAccount) {
            return;
        }

        if (!confirm('Excluir esta conta?')) {
            return;
        }

        router.delete(route('accounts.destroy', editingAccount.id), {
            preserveScroll: true,
            onSuccess: () => closeEditModal(),
        });
    };

    const deleteSelectedAccounts = () => {
        if (selectedRowKeys.length === 0) {
            return;
        }

        const total = selectedRowKeys.length;

        if (
            !confirm(
                total === 1
                    ? 'Excluir 1 conta selecionada?'
                    : `Excluir ${total} contas selecionadas?`,
            )
        ) {
            return;
        }

        router.delete(route('accounts.destroy-many'), {
            data: {
                ids: selectedRowKeys.map((key) => Number(key)),
            },
            preserveScroll: true,
            onSuccess: () => setSelectedRowKeys([]),
        });
    };

    const getTextFilter = (
        dataIndex: keyof AccountRow,
        placeholder: string,
    ): ColumnsType<AccountTableRecord>[number] => ({
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
        onFilter: (value: Key | boolean, record: AccountTableRecord) => {
            const current = String(record[dataIndex] ?? '').toLowerCase();
            return current.includes(String(value).toLowerCase());
        },
    });

    const dataSource: AccountTableRecord[] = accounts.map((account) => ({
        ...account,
        key: String(account.id),
    }));

    const columns: ColumnsType<AccountTableRecord> = [
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
            title: 'Conta',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_: unknown, record) => (
                <p className="font-semibold text-slate-900">{record.name}</p>
            ),
            ...getTextFilter('name', 'Filtrar por conta'),
        },
        {
            title: 'Saldo Inicial',
            dataIndex: 'initial_balance',
            key: 'initial_balance',
            align: 'right',
            sorter: (a, b) => a.initial_balance - b.initial_balance,
            render: (value: number) => (
                <span className="font-semibold text-slate-900">
                    {formatCurrency(value)}
                </span>
            ),
        },
        {
            title: 'Data do Saldo',
            dataIndex: 'initial_balance_date',
            key: 'initial_balance_date',
            sorter: (a, b) =>
                String(a.initial_balance_date ?? '').localeCompare(
                    String(b.initial_balance_date ?? ''),
                ),
            render: (value: string) => formatDate(value),
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
                            Contas
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                            Gerencie suas contas bancárias e cartões.
                        </h1>
                    </div>

                    <PrimaryButton
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        Nova conta
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Contas" />

            <div className="space-y-6">
                <SectionCard
                    title="Contas cadastradas"
                    description={`${accounts.length} contas no sistema.`}
                    actions={
                        selectedRowKeys.length > 0 ? (
                            <DangerButton
                                type="button"
                                onClick={deleteSelectedAccounts}
                            >
                                Excluir selecionadas ({selectedRowKeys.length})
                            </DangerButton>
                        ) : null
                    }
                >
                    <div className="purchase-ant-table">
                        <Table<AccountTableRecord>
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
                                    `${range[0]}-${range[1]} de ${total} contas`,
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
                show={Boolean(editingAccount)}
                onClose={closeEditModal}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                            Contas
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            Editar conta
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Ajuste os dados da conta.
                        </p>
                    </div>

                    <form onSubmit={submitEdit} className="mt-6 space-y-5">
                        <AccountFormFields
                            data={editData}
                            errors={editErrors}
                            idPrefix="edit"
                            onFieldChange={handleEditFieldChange}
                        />

                        <FormModalActions
                            onCancel={closeEditModal}
                            onDelete={deleteEditingAccount}
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
                            Contas
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            Nova conta
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Crie contas para rastrear seus saldos e futuro fluxo
                            de caixa.
                        </p>
                    </div>

                    <form onSubmit={submit} className="mt-6 space-y-5">
                        <AccountFormFields
                            data={data}
                            errors={errors}
                            onFieldChange={handleCreateFieldChange}
                        />

                        <FormModalActions
                            onCancel={closeCreateModal}
                            saveLabel="Criar conta"
                            saveDisabled={processing}
                        />
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
