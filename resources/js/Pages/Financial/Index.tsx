import DangerButton from '@/Components/DangerButton';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import ResponsiveDateRangePicker from '@/Components/ResponsiveDateRangePicker';
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
import FinancialEntryModal from '@/Pages/Financial/components/FinancialEntryModal';
import type { EntryRow, EntryTableRecord, FinancialPageProps } from '@/Pages/Financial/types';
import { todayDateInputValue } from '@/lib/date';
import { formatCurrency, formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { Button, Checkbox, Select, Space, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { FormEvent, Key, useMemo, useState } from 'react';

export default function FinancialIndex({ accounts, categories, entries }: FinancialPageProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<EntryRow | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const [periodStartDate, setPeriodStartDate] = useState('');
    const [periodEndDate, setPeriodEndDate] = useState('');
    const { message, modal } = useAntdApp();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        account_id: '',
        category_id: '',
        direction: 'outflow' as 'inflow' | 'outflow',
        amount: '0',
        moved_at: todayDateInputValue(),
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
            moved_at: entry.moved_at ?? todayDateInputValue(),
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

        modal.confirm({
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

        modal.confirm({
            title: 'Confirmar exclusão',
            content:
                total === 1
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

    const filteredEntries = useMemo(
        () =>
            entries.filter((entry) => {
                if (!entry.moved_at) {
                    return !periodStartDate && !periodEndDate;
                }

                const movedAt = dayjs(entry.moved_at).format('YYYY-MM-DD');

                if (periodStartDate && movedAt < periodStartDate) {
                    return false;
                }

                if (periodEndDate && movedAt > periodEndDate) {
                    return false;
                }

                return true;
            }),
        [entries, periodEndDate, periodStartDate],
    );

    const dataSource: EntryTableRecord[] = filteredEntries.map((entry) => ({
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
            render: (value: 'inflow' | 'outflow') => <Tag color={value === 'inflow' ? 'green' : 'red'}>{value === 'inflow' ? 'Entrada' : 'Saída'}</Tag>,
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
            render: (_: unknown, record) => (record.account ? `${record.account.code} - ${record.account.name}` : '--'),
            filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                <div className="w-72 p-3">
                    <Select
                        mode="multiple"
                        value={selectedKeys.map(String)}
                        placeholder="Filtrar contas"
                        className="w-full"
                        onChange={(values: string[]) => setSelectedKeys(values)}
                        options={accounts.map((account) => ({
                            value: String(account.id),
                            label: `${account.code} - ${account.name}`,
                        }))}
                        allowClear
                        maxTagCount="responsive"
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
            onFilter: (value: Key | boolean, record: EntryTableRecord) =>
                String(record.account?.id ?? '') === String(value),
        },
        {
            title: 'Categoria',
            dataIndex: 'category',
            key: 'category',
            render: (_: unknown, record) => (record.category ? <Tag color="cyan">{record.category.name}</Tag> : '--'),
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
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Financeiro</p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Entradas e saídas das contas.</h1>
                    </div>
                    <PrimaryButton
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full justify-center sm:w-auto"
                    >
                        Novo lançamento
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Financeiro" />

            <SectionCard
                title="Lançamentos financeiros"
                description={`${filteredEntries.length} lançamentos no histórico${periodStartDate || periodEndDate ? ' no período filtrado' : ''}.`}
                actions={
                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:flex-wrap lg:items-end lg:justify-end">
                        <div className="w-full lg:w-auto">
                            <InputLabel value="Período" />
                            <ResponsiveDateRangePicker
                                value={[
                                    periodStartDate ? dayjs(periodStartDate) : null,
                                    periodEndDate ? dayjs(periodEndDate) : null,
                                ]}
                                onChange={([startDate, endDate]) => {
                                    setPeriodStartDate(startDate ? startDate.format('YYYY-MM-DD') : '');
                                    setPeriodEndDate(endDate ? endDate.format('YYYY-MM-DD') : '');
                                }}
                                className="mt-2 w-full min-w-0 lg:min-w-[336px]"
                                placeholder={['De', 'Até']}
                            />
                        </div>

                        {selectedRowKeys.length > 0 ? (
                            <DangerButton type="button" onClick={deleteSelectedEntries}>
                                Excluir selecionados ({selectedRowKeys.length})
                            </DangerButton>
                        ) : null}
                    </div>
                }
            >
                <ResponsiveDataTable<EntryTableRecord>
                    rowKey="key"
                    columns={columns}
                    dataSource={dataSource}
                    searchEnabled
                    searchPlaceholder="Buscar por descrição, conta, categoria ou data"
                    searchFields={['description', 'account.name', 'account.code', 'category.name', 'moved_at']}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) =>
                            setSelectedRowKeys(keys.filter((key) => manualIds.has(String(key)))),
                        getCheckboxProps: (record) => ({
                            disabled: record.origin !== 'manual',
                        }),
                    }}
                    pagination={{ pageSize: 12, showSizeChanger: true }}
                    size="middle"
                    scroll={{ x: 1200 }}
                    rowClassName={(record) =>
                        record.origin === 'manual' ? 'cursor-pointer' : 'opacity-90'
                    }
                    onRow={(record) => ({
                        onClick: (event) => {
                            const target = event.target as HTMLElement;
                            if (
                                target.closest(
                                    'button, a, input, label, textarea, .ant-checkbox-wrapper, .ant-checkbox',
                                )
                            ) {
                                return;
                            }
                            openEditModal(record);
                        },
                    })}
                    mobileHint="No celular os lançamentos aparecem em cards. Toque para editar quando a origem for manual e use o checkbox para exclusao em lote."
                    mobileRenderCard={(record, mobileMeta) => {
                        const originLabel =
                            record.origin === 'manual'
                                ? 'Manual'
                                : record.origin === 'manual_purchase'
                                  ? 'Compra manual'
                                  : record.origin === 'invoice_purchase'
                                    ? 'Compra importada'
                                    : record.origin === 'invoice_discount'
                                      ? 'Desconto de nota'
                                      : record.origin;

                        return (
                            <ResponsiveCard key={record.key}>
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={mobileMeta.isSelected}
                                        disabled={mobileMeta.selectionDisabled}
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
                                            eyebrow={formatDate(record.moved_at)}
                                            title={record.description || 'Sem descrição'}
                                            trailing={
                                                <span
                                                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                                        record.direction === 'inflow'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {record.direction === 'inflow' ? '+' : '-'}{' '}
                                                    {formatCurrency(record.amount)}
                                                </span>
                                            }
                                        />

                                        <ResponsiveCardPills>
                                            <ResponsiveCardPill tone="warm">
                                                {record.direction === 'inflow' ? 'Entrada' : 'Saída'}
                                            </ResponsiveCardPill>
                                            <ResponsiveCardPill>
                                                {originLabel}
                                            </ResponsiveCardPill>
                                        </ResponsiveCardPills>

                                        <ResponsiveCardFields>
                                            <ResponsiveCardField
                                                label="Conta:"
                                                value={
                                                    record.account
                                                        ? `${record.account.code} - ${record.account.name}`
                                                        : '--'
                                                }
                                            />
                                            <ResponsiveCardField
                                                label="Categoria:"
                                                value={record.category?.name ?? '--'}
                                            />
                                        </ResponsiveCardFields>
                                    </button>
                                </div>
                            </ResponsiveCard>
                        );
                    }}
                />
            </SectionCard>

            <FinancialEntryModal
                isOpen={Boolean(editingEntry)}
                onClose={closeEditModal}
                onSubmit={submitEdit}
                processing={editProcessing}
                data={editData}
                errors={editErrors}
                setData={(field, value) => setEditData(field as keyof typeof editData, value as never)}
                title="Editar lançamento"
                sectionLabel="Financeiro"
                saveLabel="Salvar alterações"
                accountOptions={accountOptions}
                categoryOptions={categoryOptions}
                directionOptions={directionOptions}
                onDelete={deleteEditingEntry}
            />

            <FinancialEntryModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                onSubmit={submit}
                processing={processing}
                data={data}
                errors={errors}
                setData={(field, value) => setData(field as keyof typeof data, value as never)}
                title="Novo lançamento"
                sectionLabel="Financeiro"
                saveLabel="Criar lançamento"
                accountOptions={accountOptions}
                categoryOptions={categoryOptions}
                directionOptions={directionOptions}
            />
        </AuthenticatedLayout>
    );
}
