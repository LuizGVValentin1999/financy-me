import DangerButton from '@/Components/DangerButton';
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
import { todayDateInputValue } from '@/lib/date';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import type { PurchaseEntryRow, PurchasesPageProps } from '@/Pages/Purchases/types';
import { router, useForm } from '@inertiajs/react';
import { Button, Checkbox, DatePicker, Grid, Select, Space, Tag } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { FormEvent, Key, useState } from 'react';
import { buildPurchaseHistoryDataSource } from './purchaseHistory/buildDataSource';
import GroupingToolbar from './purchaseHistory/GroupingToolbar';
import type { PurchaseGroupBy, PurchaseGroupRecord, PurchaseTableRecord } from './purchaseHistory/types';
import PurchaseFormModal from './PurchaseFormModal';

export default function PurchaseHistoryTable({
    entries,
    sources,
    products,
    accounts,
}: {
    entries: PurchasesPageProps['entries'];
    sources: PurchasesPageProps['sources'];
    products: PurchasesPageProps['products'];
    accounts: PurchasesPageProps['accounts'];
}) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [groupBy, setGroupBy] = useState<PurchaseGroupBy>('none');
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const [editingEntry, setEditingEntry] = useState<PurchaseEntryRow | null>(null);
    const { message, modal } = useAntdApp();
    const {
        data: editData,
        setData: setEditData,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        product_id: '',
        account_id: '',
        quantity: '1',
        unit_price: '0',
        purchased_at: todayDateInputValue(),
        source: sources[0]?.value ?? 'manual',
        invoice_reference: '',
        notes: '',
    });

    const closeEditModal = () => {
        setEditingEntry(null);
        reset();
        clearErrors();
    };

    const openEditModal = (entry: PurchaseEntryRow) => {
        setEditingEntry(entry);
        setEditData({
            product_id: entry.product_id ? String(entry.product_id) : '',
            account_id: entry.account_id ? String(entry.account_id) : '',
            quantity: String(entry.quantity),
            unit_price: String(entry.unit_price),
            purchased_at: entry.purchased_at ?? todayDateInputValue(),
            source: entry.source,
            invoice_reference: entry.invoice_reference ?? '',
            notes: entry.notes ?? '',
        });
        clearErrors();
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingEntry) {
            return;
        }

        patch(route('purchases.update', editingEntry.id), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Compra atualizada com sucesso!');
                closeEditModal();
            },
            onError: () => message.error('Erro ao atualizar compra'),
        });
    };

    const deleteEditingEntry = () => {
        if (!editingEntry) {
            return;
        }

        modal.confirm({
            title: 'Confirmar exclusão',
            content: 'Excluir este registro de compra?',
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('purchases.destroy', editingEntry.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info('Compra excluída com sucesso!');
                        closeEditModal();
                    },
                    onError: () => message.error('Erro ao excluir compra'),
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
                    ? 'Excluir 1 registro selecionado?'
                    : `Excluir ${total} registros selecionados?`,
            okText: 'Sim',
            cancelText: 'Não',
            onOk: () => {
                router.delete(route('purchases.destroy-many'), {
                    data: {
                        ids: selectedRowKeys.map((key) => Number(key)),
                    },
                    preserveScroll: true,
                    onSuccess: () => {
                        message.info(`${selectedRowKeys.length} compras excluídas com sucesso!`);
                        setSelectedRowKeys([]);
                    },
                    onError: () => message.error('Erro ao excluir compras'),
                });
            },
        });
    };

    const getTextFilter = (
        dataIndex: keyof PurchaseEntryRow,
        placeholder: string,
    ): ColumnsType<PurchaseTableRecord>[number] => ({
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
        onFilter: (value: Key | boolean, record: PurchaseTableRecord) => {
            if (record.isGroup) return false;
            const current = String((record as PurchaseEntryRow)[dataIndex] ?? '').toLowerCase();
            return current.includes(String(value).toLowerCase());
        },
    });

    const dataSource: PurchaseTableRecord[] = buildPurchaseHistoryDataSource(entries, groupBy);

    const sourceLabel = (source: string) =>
        source === 'invoice' ? 'Nota fiscal' : source === 'manual' ? 'Manual' : '--';

    const columns: ColumnsType<PurchaseTableRecord> = [
        {
            title: 'Produto',
            dataIndex: 'product',
            key: 'product',
            sorter: (a, b) => String(a.product ?? '').localeCompare(String(b.product ?? '')),
            render: (_: unknown, record) =>
                record.isGroup ? (
                    <div>
                        <p className="font-semibold text-slate-900">{record.groupLabel}</p>
                        <p className="mt-1 text-slate-500">{record.children.length} registros neste grupo</p>
                    </div>
                ) : (
                    <div>
                        <p className="font-semibold text-slate-900">{record.product ?? 'Produto removido'}</p>
                        <p className="mt-1 text-slate-500">{record.unit ?? 'un'}</p>
                    </div>
                ),
            ...getTextFilter('product', 'Filtrar por produto'),
        },
        {
            title: 'Data',
            dataIndex: 'purchased_at',
            key: 'purchased_at',
            sorter: (a, b) => String(a.purchased_at ?? '').localeCompare(String(b.purchased_at ?? '')),
            render: (_: unknown, record) =>
                record.isGroup && groupBy !== 'date' ? '--' : formatDate(record.purchased_at),
            filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                <div className="w-56 p-3">
                    <DatePicker
                        value={
                            selectedKeys[0]
                                ? dayjs(String(selectedKeys[0]))
                                : null
                        }
                        format="DD/MM/YYYY"
                        size="large"
                        onChange={(date) =>
                            setSelectedKeys(date ? [date.format('YYYY-MM-DD')] : [])
                        }
                        className="w-full"
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
            onFilter: (value: Key | boolean, record) => String(record.purchased_at ?? '') === String(value),
        },
        {
            title: 'Origem',
            dataIndex: 'source',
            key: 'source',
            sorter: (a, b) => String(a.source).localeCompare(String(b.source)),
            render: (_: unknown, record) =>
                record.isGroup && groupBy !== 'source' ? (
                    '--'
                ) : (
                    <Tag color="cyan">
                        {record.source === 'invoice'
                            ? 'Nota fiscal'
                            : record.source === 'manual'
                              ? 'Manual'
                              : record.isGroup
                                ? record.groupLabel
                                : '--'}
                    </Tag>
                ),
            filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                <div className="w-56 p-3">
                    <Select
                        value={String(selectedKeys[0] ?? '') || undefined}
                        placeholder="Filtrar origem"
                        className="w-full"
                        size="middle"
                        onChange={(value: string | undefined) => setSelectedKeys(value ? [value] : [])}
                        options={sources.map((source) => ({
                            value: source.value,
                            label: source.label,
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
            onFilter: (value: Key | boolean, record) => record.source === value,
        },
        {
            title: 'Nota',
            dataIndex: 'invoice_reference',
            key: 'invoice_reference',
            sorter: (a, b) => String(a.invoice_reference ?? '').localeCompare(String(b.invoice_reference ?? '')),
            render: (_: unknown, record) =>
                record.isGroup && groupBy !== 'invoice_reference' ? '--' : record.invoice_reference || '--',
            ...getTextFilter('invoice_reference', 'Filtrar por referencia'),
        },
        {
            title: 'Quantidade',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right',
            sorter: (a, b) => a.quantity - b.quantity,
            render: (_: unknown, record) =>
                record.isGroup ? formatQuantity(record.quantity) : `${formatQuantity(record.quantity)} ${record.unit ?? 'un'}`,
        },
        {
            title: 'Unitario',
            dataIndex: 'unit_price',
            key: 'unit_price',
            align: 'right',
            sorter: (a, b) => a.unit_price - b.unit_price,
            render: (_: unknown, record) => (record.isGroup ? '--' : formatCurrency(record.unit_price)),
        },
        {
            title: 'Total',
            dataIndex: 'total_amount',
            key: 'total_amount',
            align: 'right',
            sorter: (a, b) => a.total_amount - b.total_amount,
            render: (_: unknown, record) => (
                <span className="font-semibold text-slate-900">{formatCurrency(record.total_amount)}</span>
            ),
        },
        {
            title: 'Observacoes',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            render: (_: unknown, record) => record.notes || 'Sem observacoes.',
            ...getTextFilter('notes', 'Filtrar observacoes'),
        },
        {
            title: 'Conta',
            dataIndex: 'account',
            key: 'account',
            render: (_: unknown, record) => {
                if (record.isGroup) return '--';
                const entryRecord = record as PurchaseEntryRow;
                return entryRecord.account
                    ? `${entryRecord.account.code} - ${entryRecord.account.name}`
                    : 'Sem conta';
            },
        },
    ];

    return (
        <SectionCard
            title="Tabela de compras"
            description="Clique em um registro para editar. Use os checkboxes para selecionar e excluir em lote."
            className={isMobile ? 'p-4' : ''}
            actions={
                selectedRowKeys.length > 0 ? (
                    <DangerButton type="button" onClick={deleteSelectedEntries}>
                        Excluir selecionados ({selectedRowKeys.length})
                    </DangerButton>
                ) : null
            }
        >
            <GroupingToolbar
                groupBy={groupBy}
                entriesCount={entries.length}
                onChangeGroupBy={setGroupBy}
            />

            <ResponsiveDataTable<PurchaseTableRecord>
                rowKey="key"
                columns={columns}
                dataSource={dataSource}
                searchEnabled
                searchPlaceholder="Buscar por produto, conta, referência, observações ou grupo"
                searchMatcher={(record, searchTerm) => {
                    if (record.isGroup) {
                        const groupRecord = record as PurchaseGroupRecord;
                        return groupRecord.groupLabel.toLowerCase().includes(searchTerm);
                    }

                    const entryRecord = record as PurchaseEntryRow;
                    const searchable = [
                        entryRecord.product ?? '',
                        entryRecord.account?.code ?? '',
                        entryRecord.account?.name ?? '',
                        entryRecord.invoice_reference ?? '',
                        entryRecord.notes ?? '',
                        entryRecord.source ?? '',
                        entryRecord.purchased_at ?? '',
                    ]
                        .join(' ')
                        .toLowerCase();

                    return searchable.includes(searchTerm);
                }}
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                    getCheckboxProps: (record) => ({
                        disabled: Boolean(record.isGroup),
                    }),
                    preserveSelectedRowKeys: true,
                }}
                pagination={{
                    pageSize: 12,
                    showSizeChanger: true,
                    pageSizeOptions: [12, 24, 48],
                    showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} compras`,
                }}
                expandable={groupBy === 'none' ? undefined : { defaultExpandAllRows: false }}
                size="middle"
                scroll={{ x: 1200 }}
                rowClassName={(record) => (record.isGroup ? '' : 'cursor-pointer')}
                onRow={(record) => ({
                    onClick: (event) => {
                        if (record.isGroup) {
                            return;
                        }

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
                mobilePageSize={6}
                mobileRenderCard={(record, mobileMeta) => {
                    if (record.isGroup) {
                        const groupRecord = record as PurchaseGroupRecord;

                        return (
                            <ResponsiveCard
                                key={groupRecord.key}
                                tone="warm"
                                className="overflow-hidden p-0"
                            >
                                <div className="border-b border-slate-200/80 px-4 py-4">
                                    <ResponsiveCardHeader
                                        eyebrow="Grupo"
                                        title={groupRecord.groupLabel}
                                        trailing={
                                            <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
                                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                                                    Total
                                                </p>
                                                <p className="mt-1 text-sm font-semibold">
                                                    {formatCurrency(groupRecord.total_amount)}
                                                </p>
                                            </div>
                                        }
                                    />

                                    <ResponsiveCardPills>
                                        <ResponsiveCardPill tone="muted">
                                            {groupRecord.children.length} registros
                                        </ResponsiveCardPill>
                                        <ResponsiveCardPill tone="muted">
                                            {formatQuantity(groupRecord.quantity)}
                                        </ResponsiveCardPill>
                                    </ResponsiveCardPills>
                                </div>

                                <div className="space-y-3 p-3">
                                    {groupRecord.children.map((childRecord) => {
                                        const entry = childRecord as PurchaseEntryRow & {
                                            key: string;
                                        };

                                        const childSelected = mobileMeta.selectedKeys.some(
                                            (selectedKey) =>
                                                String(selectedKey) === String(entry.id),
                                        );

                                        return (
                                            <ResponsiveCard
                                                key={entry.key}
                                                className="rounded-[22px]"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Checkbox
                                                        checked={childSelected}
                                                        onChange={(event) =>
                                                            setSelectedRowKeys((current) => {
                                                                const nextKeys = event.target.checked
                                                                    ? Array.from(
                                                                          new Map(
                                                                              [
                                                                                  ...current,
                                                                                  entry.id,
                                                                              ].map((item) => [
                                                                                  String(item),
                                                                                  item,
                                                                              ]),
                                                                          ).values(),
                                                                      )
                                                                    : current.filter(
                                                                          (key) =>
                                                                              String(key) !==
                                                                              String(entry.id),
                                                                      );

                                                                return nextKeys;
                                                            })
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        className="min-w-0 flex-1 text-left"
                                                        onClick={() => openEditModal(entry)}
                                                    >
                                                        <ResponsiveCardHeader
                                                            title={entry.product ?? 'Produto removido'}
                                                            subtitle={`${formatDate(entry.purchased_at)} • ${sourceLabel(entry.source)}`}
                                                            trailing={
                                                                <span className="rounded-full bg-[#f3ede3] px-3 py-1 text-sm font-semibold text-slate-900">
                                                                    {formatCurrency(entry.total_amount)}
                                                                </span>
                                                            }
                                                        />

                                                        <ResponsiveCardFields columns={2}>
                                                            <ResponsiveCardField
                                                                value={`${formatQuantity(entry.quantity)} ${entry.unit ?? 'un'}`}
                                                            />
                                                            <ResponsiveCardField
                                                                value={`${formatCurrency(entry.unit_price)}/un`}
                                                            />
                                                            <ResponsiveCardField
                                                                value={
                                                                    entry.account
                                                                        ? `${entry.account.code} - ${entry.account.name}`
                                                                        : 'Sem conta'
                                                                }
                                                                colSpan={2}
                                                            />
                                                            <ResponsiveCardField
                                                                value={`Nota: ${entry.invoice_reference || '--'}`}
                                                                colSpan={2}
                                                            />
                                                            <ResponsiveCardField
                                                                value={entry.notes || 'Sem observacoes.'}
                                                                colSpan={2}
                                                            />
                                                        </ResponsiveCardFields>
                                                    </button>
                                                </div>
                                            </ResponsiveCard>
                                        );
                                    })}
                                </div>
                            </ResponsiveCard>
                        );
                    }

                    const entry = record as PurchaseEntryRow & { key: string };

                    return (
                        <ResponsiveCard
                            key={entry.key}
                        >
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
                                    onClick={() => openEditModal(entry)}
                                >
                                    <ResponsiveCardHeader
                                        title={entry.product ?? 'Produto removido'}
                                        subtitle={`${formatDate(entry.purchased_at)} • ${sourceLabel(entry.source)}`}
                                        trailing={
                                            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                                                {formatCurrency(entry.total_amount)}
                                            </span>
                                        }
                                    />

                                    <ResponsiveCardPills>
                                        <ResponsiveCardPill tone="warm">
                                            {formatQuantity(entry.quantity)} {entry.unit ?? 'un'}
                                        </ResponsiveCardPill>
                                        <ResponsiveCardPill>
                                            {formatCurrency(entry.unit_price)}/un
                                        </ResponsiveCardPill>
                                    </ResponsiveCardPills>

                                    <ResponsiveCardFields>
                                        <ResponsiveCardField
                                            label="Conta:"
                                            value={
                                                entry.account
                                                    ? `${entry.account.code} - ${entry.account.name}`
                                                    : 'Sem conta'
                                            }
                                        />
                                        <ResponsiveCardField
                                            label="Nota:"
                                            value={entry.invoice_reference || '--'}
                                        />
                                        <ResponsiveCardField
                                            label="Observacoes:"
                                            value={entry.notes || 'Sem observacoes.'}
                                        />
                                    </ResponsiveCardFields>
                                </button>
                            </div>
                        </ResponsiveCard>
                    );
                }}
            />

            <PurchaseFormModal
                isOpen={Boolean(editingEntry)}
                onClose={closeEditModal}
                isEditing={true}
                products={products}
                sources={sources}
                accounts={accounts}
                formData={editData}
                setFormData={setEditData}
                onSubmit={submitEdit}
                processing={processing}
                errors={errors}
                onDelete={deleteEditingEntry}
            />
        </SectionCard>
    );
}
