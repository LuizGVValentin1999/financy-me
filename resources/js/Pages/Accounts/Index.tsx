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
import AccountModal from '@/Pages/Accounts/components/AccountModal';
import type { AccountRow, AccountsPageProps, AccountTableRecord } from '@/Pages/Accounts/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { Checkbox, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useState } from 'react';

export default function AccountsIndex({ accounts }: AccountsPageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const { message, modal } = useAntdApp();

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
                message.info('Conta criada com sucesso!');
                reset();
                setIsCreateModalOpen(false);
            },
            onError: () => message.error('Erro ao criar conta'),
        });
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
            onSuccess: () => {
                message.info('Conta atualizada com sucesso!');
                closeEditModal();
            },
            onError: () => message.error('Erro ao atualizar conta'),
        });
    };

    const deleteEditingAccount = () => {
        if (!editingAccount) {
            return;
        }

        modal.confirm({
            title: 'Confirmar exclusão',
            content: 'Excluir esta conta?',
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('accounts.destroy', editingAccount.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info('Conta excluída com sucesso!');
                        closeEditModal();
                    },
                    onError: () => message.error('Erro ao excluir conta'),
                });
            },
        });
    };

    const deleteSelectedAccounts = () => {
        if (selectedRowKeys.length === 0) {
            return;
        }

        const total = selectedRowKeys.length;

        modal.confirm({
            title: 'Confirmar exclusão',
            content: total === 1 ? 'Excluir 1 conta selecionada?' : `Excluir ${total} contas selecionadas?`,
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('accounts.destroy-many'), {
                    data: { ids: selectedRowKeys.map((key) => Number(key)) },
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info(`${selectedRowKeys.length} contas excluídas com sucesso!`);
                        setSelectedRowKeys([]);
                    },
                    onError: () => message.error('Erro ao excluir contas'),
                });
            },
        });
    };

    const getTextFilter = (
        dataIndex: keyof AccountRow,
        placeholder: string,
    ): ColumnsType<AccountTableRecord>[number] => ({
        filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
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
            render: (value: string) => <span className="font-mono text-sm font-semibold text-slate-600">{value}</span>,
            ...getTextFilter('code', 'Filtrar por código'),
        },
        {
            title: 'Conta',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (_: unknown, record) => <p className="font-semibold text-slate-900">{record.name}</p>,
            ...getTextFilter('name', 'Filtrar por conta'),
        },
        {
            title: 'Saldo Inicial',
            dataIndex: 'initial_balance',
            key: 'initial_balance',
            align: 'right',
            sorter: (a, b) => a.initial_balance - b.initial_balance,
            render: (value: number) => <span className="font-semibold text-slate-900">{formatCurrency(value)}</span>,
        },
        {
            title: 'Data do Saldo',
            dataIndex: 'initial_balance_date',
            key: 'initial_balance_date',
            sorter: (a, b) => String(a.initial_balance_date ?? '').localeCompare(String(b.initial_balance_date ?? '')),
            render: (value: string) => formatDate(value),
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
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Contas</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Gerencie suas contas bancárias e cartões.</h1>
                    </div>
                    <PrimaryButton
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full justify-center sm:w-auto"
                    >
                        Nova conta
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Contas" />

            <SectionCard
                title="Contas cadastradas"
                description={`${accounts.length} contas no sistema.`}
                actions={
                    selectedRowKeys.length > 0 ? (
                        <DangerButton type="button" onClick={deleteSelectedAccounts}>
                            Excluir selecionadas ({selectedRowKeys.length})
                        </DangerButton>
                    ) : null
                }
            >
                <ResponsiveDataTable<AccountTableRecord>
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
                        showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} contas`,
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
                    mobileHint="As contas aparecem em cards no celular. Toque para editar e use o checkbox para selecionar exclusao em lote."
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
                                        title={record.name}
                                        trailing={
                                            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                                                {formatCurrency(record.initial_balance)}
                                            </span>
                                        }
                                    />

                                    <ResponsiveCardFields>
                                        <ResponsiveCardField
                                            label="Saldo inicial:"
                                            value={formatCurrency(record.initial_balance)}
                                        />
                                        <ResponsiveCardField
                                            label="Data do saldo:"
                                            value={formatDate(record.initial_balance_date)}
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

            <AccountModal
                isOpen={Boolean(editingAccount)}
                onClose={closeEditModal}
                onSubmit={submitEdit}
                processing={editProcessing}
                data={editData}
                errors={editErrors}
                onFieldChange={(field, value) => setEditData(field as keyof typeof editData, value as never)}
                title="Editar conta"
                description="Ajuste os dados da conta."
                saveLabel="Salvar alterações"
                onDelete={deleteEditingAccount}
                idPrefix="edit"
            />

            <AccountModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                onSubmit={submit}
                processing={processing}
                data={data}
                errors={errors}
                onFieldChange={(field, value) => setData(field as keyof typeof data, value as never)}
                title="Nova conta"
                description="Crie contas para rastrear seus saldos e futuro fluxo de caixa."
                saveLabel="Criar conta"
            />
        </AuthenticatedLayout>
    );
}
