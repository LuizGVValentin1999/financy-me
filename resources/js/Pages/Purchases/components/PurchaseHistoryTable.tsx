import DangerButton from '@/Components/DangerButton';
import SectionCard from '@/Components/SectionCard';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import type { PurchaseEntryRow, PurchasesPageProps } from '@/Pages/Purchases/types';
import { router, useForm } from '@inertiajs/react';
import { Button, Input, Modal as AntdModal, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useState } from 'react';
import { buildPurchaseHistoryDataSource } from './purchaseHistory/buildDataSource';
import GroupingToolbar from './purchaseHistory/GroupingToolbar';
import type { PurchaseGroupBy, PurchaseTableRecord } from './purchaseHistory/types';
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
    const [groupBy, setGroupBy] = useState<PurchaseGroupBy>('none');
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
    const [editingEntry, setEditingEntry] = useState<PurchaseEntryRow | null>(null);
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
        purchased_at: new Date().toISOString().slice(0, 10),
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
            purchased_at: entry.purchased_at ?? new Date().toISOString().slice(0, 10),
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

        AntdModal.confirm({
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

        AntdModal.confirm({
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
                    <Input
                        type="date"
                        value={String(selectedKeys[0] ?? '')}
                        onChange={(event) => setSelectedKeys(event.target.value ? [event.target.value] : [])}
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

            <div className="purchase-ant-table">
                <Table<PurchaseTableRecord>
                    rowKey="key"
                    columns={columns}
                    dataSource={dataSource}
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
                />
            </div>

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
