import Checkbox from '@/Components/Checkbox';
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

interface PurchasesPageProps {
    products: Array<{
        id: number;
        name: string;
        unit: string;
        current_stock: number;
        category: string | null;
        category_id: number | null;
    }>;
    categories: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    importUnits: Array<{
        value: string;
        label: string;
    }>;
    sources: Array<{
        value: string;
        label: string;
    }>;
    importPreview: {
        token: string;
        receipt_url: string | null;
        store_name: string | null;
        cnpj: string | null;
        address: string | null;
        invoice_number: string | null;
        series: string | null;
        issued_at: string | null;
        issued_at_label: string | null;
        access_key: string | null;
        total_items: number;
        total_amount: number;
        discount_amount: number;
        amount_paid: number;
        payment_methods: Array<{
            method: string;
            amount: number;
        }>;
        items: Array<{
            index: number;
            name: string;
            code: string | null;
            quantity: number;
            unit: string;
            unit_price: number;
            total_amount: number;
            is_discount: boolean;
            suggested_product_id: number | null;
            suggested_product_name: string;
            suggested_category_id: number | null;
            suggestion_score: number | null;
            suggested_unit: string;
        }>;
    } | null;
    entries: Array<{
        id: number;
        product_id: number | null;
        product: string | null;
        unit: string | null;
        quantity: number;
        unit_price: number;
        total_amount: number;
        source: string;
        invoice_reference: string | null;
        notes: string | null;
        purchased_at: string | null;
        created_at: string | null;
    }>;
}

function ImportPreviewSection({
    preview,
    products,
    categories,
    importUnits,
}: {
    preview: NonNullable<PurchasesPageProps['importPreview']>;
    products: PurchasesPageProps['products'];
    categories: PurchasesPageProps['categories'];
    importUnits: PurchasesPageProps['importUnits'];
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        token: preview.token,
        items: preview.items.map((item) => ({
            include: true,
            product_id: item.suggested_product_id
                ? String(item.suggested_product_id)
                : '',
            product_name: item.suggested_product_name,
            quantity: String(item.quantity),
            category_id: item.suggested_category_id
                ? String(item.suggested_category_id)
                : '',
            unit: item.suggested_unit,
        })),
    });

    const updateItem = (
        index: number,
        key:
            | 'include'
            | 'product_id'
            | 'product_name'
            | 'quantity'
            | 'category_id'
            | 'unit',
        value: boolean | string,
    ) => {
        setData(
            'items',
            data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        );
    };

    const includedItems = preview.items.filter((_, index) => data.items[index]?.include);
    const includedTotal = includedItems.reduce(
        (total, item) => total + item.total_amount,
        0,
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.import-confirm'), {
            preserveScroll: true,
        });
    };

    return (
        <SectionCard
            title="Revisar NFC-e importada"
            description="Classifique cada item. Você pode reaproveitar um produto existente ou criar um novo pelo nome."
            actions={
                <DangerButton
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() =>
                        router.delete(route('purchases.import-clear'), {
                            preserveScroll: true,
                        })
                    }
                >
                    Limpar rascunho
                </DangerButton>
            }
        >
            <div className="grid gap-4 2xl:grid-cols-[0.9fr,1.1fr]">
                <div className="space-y-4 rounded-[28px] bg-[#f8f4ec] p-5">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                            Estabelecimento
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">
                            {preview.store_name}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            {preview.cnpj}
                            {preview.address ? ` • ${preview.address}` : ''}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Emissao
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {preview.issued_at_label ??
                                    formatDate(preview.issued_at)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Nota
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {preview.invoice_number ?? '--'} / serie{' '}
                                {preview.series ?? '--'}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Valor pago
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {formatCurrency(preview.amount_paid)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Desconto
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {formatCurrency(preview.discount_amount)}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Chave de acesso
                        </p>
                        <p className="mt-2 break-all text-sm text-slate-600">
                            {preview.access_key ?? '--'}
                        </p>
                    </div>

                    {preview.payment_methods.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Pagamentos
                            </p>
                            <div className="mt-3 space-y-2">
                                {preview.payment_methods.map((payment) => (
                                    <div
                                        key={`${payment.method}-${payment.amount}`}
                                        className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm"
                                    >
                                        <span className="text-slate-600">
                                            {payment.method}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {preview.items.map((item, index) => (
                        <div
                            key={`${item.index}-${item.name}`}
                            className={`rounded-[28px] border p-5 transition ${
                                data.items[index].include
                                    ? 'border-slate-200 bg-white'
                                    : 'border-dashed border-slate-200 bg-slate-50/90'
                            }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xl font-semibold text-slate-900">
                                            {item.name}
                                        </p>
                                        {item.suggested_product_id && (
                                            <span className="rounded-full bg-[#eef7f7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                Sugestao {Math.round(item.suggestion_score ?? 0)}%
                                            </span>
                                        )}
                                        {item.is_discount && (
                                            <span className="rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#be3d2a]">
                                                Desconto global
                                            </span>
                                        )}
                                        {!data.items[index].include && (
                                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                Excluido do lancamento
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Nota: {formatQuantity(item.quantity)} {item.unit}{' '}
                                        • {formatCurrency(item.unit_price)} cada
                                        {item.code ? ` • codigo ${item.code}` : ''}
                                    </p>
                                    {item.suggested_product_id && (
                                        <p className="mt-2 text-sm text-slate-600">
                                            Produto mais proximo encontrado:{' '}
                                            <span className="font-semibold text-slate-900">
                                                {item.suggested_product_name}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-full bg-[#eef7f7] px-4 py-2 text-sm font-semibold text-slate-700">
                                    {formatCurrency(item.total_amount)}
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f8f4ec] px-4 py-3">
                            
                                <SecondaryButton
                                    type="button"
                                    className="px-4 py-2 text-xs"
                                    onClick={() =>
                                        updateItem(
                                            index,
                                            'include',
                                            !data.items[index].include,
                                        )
                                    }
                                >
                                    {data.items[index].include
                                        ? 'Excluir desta importacao'
                                        : 'Restaurar item'}
                                </SecondaryButton>
                            </div>

                            <div className="mt-5 grid gap-4 2xl:grid-cols-4">
                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.quantity`}
                                        value={
                                            item.is_discount
                                                ? 'Quantidade'
                                                : 'Quantidade para estoque'
                                        }
                                    />
                                    <input
                                        id={`items.${index}.quantity`}
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={data.items[index].quantity}
                                        disabled={
                                            !data.items[index].include ||
                                            item.is_discount
                                        }
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'quantity',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        {item.is_discount
                                            ? 'Esse item so ajusta o valor gasto e nao altera o estoque.'
                                            : 'O valor total da nota sera mantido e o custo unitario sera recalculado.'}
                                    </p>
                                    <InputError
                                        message={
                                            errors[`items.${index}.quantity`]
                                        }
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.unit`}
                                        value="Unidade"
                                    />
                                    <Select
                                        id={`items.${index}.unit`}
                                        value={data.items[index].unit}
                                        disabled={
                                            !data.items[index].include ||
                                            item.is_discount
                                        }
                                        onChange={(value) =>
                                            updateItem(index, 'unit', value)
                                        }
                                        className="mt-2 w-full"
                                        size="large"
                                        options={importUnits.map((unit) => ({
                                            value: unit.value,
                                            label: unit.value.toUpperCase(),
                                        }))}
                                    />
                                    <InputError
                                        message={errors[`items.${index}.unit`]}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.product_id`}
                                        value="Produto existente"
                                    />
                                    <Select
                                        id={`items.${index}.product_id`}
                                        value={data.items[index].product_id || undefined}
                                        disabled={!data.items[index].include}
                                        onChange={(value) =>
                                            updateItem(
                                                index,
                                                'product_id',
                                                value ?? '',
                                            )
                                        }
                                        className="mt-2 w-full"
                                        size="large"
                                        allowClear
                                        placeholder="Criar pelo nome abaixo"
                                        options={products.map((product) => ({
                                            value: String(product.id),
                                            label: product.name,
                                        }))}
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `items.${index}.product_id`
                                            ]
                                        }
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.category_id`}
                                        value="Categoria"
                                    />
                                    <Select
                                        id={`items.${index}.category_id`}
                                        value={data.items[index].category_id || undefined}
                                        disabled={
                                            !data.items[index].include ||
                                            item.is_discount
                                        }
                                        onChange={(value) =>
                                            updateItem(
                                                index,
                                                'category_id',
                                                value ?? '',
                                            )
                                        }
                                        className="mt-2 w-full"
                                        size="large"
                                        allowClear
                                        placeholder="Sem categoria"
                                        options={categories.map((category) => ({
                                            value: String(category.id),
                                            label: category.name,
                                        }))}
                                    />
                                    <InputError
                                        message={
                                            errors[
                                                `items.${index}.category_id`
                                            ]
                                        }
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <InputLabel
                                    htmlFor={`items.${index}.product_name`}
                                    value="Nome do produto para criar"
                                />
                                <input
                                    id={`items.${index}.product_name`}
                                    type="text"
                                    value={data.items[index].product_name}
                                    disabled={!data.items[index].include}
                                    onChange={(event) =>
                                        updateItem(
                                            index,
                                            'product_name',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                                <InputError
                                    message={
                                        errors[`items.${index}.product_name`]
                                    }
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    ))}

                    <input type="hidden" name="token" value={data.token} />
                    <InputError message={errors.token} className="mt-2" />

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] bg-[#f3efe6] px-5 py-5">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                                Total da importacao
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">
                                {formatCurrency(includedTotal)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {includedItems.length} de {preview.items.length} itens selecionados
                            </p>
                        </div>

                        <PrimaryButton disabled={processing}>
                            Confirmar NFC-e
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </SectionCard>
    );
}

type PurchaseEntryRow = PurchasesPageProps['entries'][number];

type PurchaseGroupRecord = {
    key: string;
    id: string;
    isGroup: true;
    groupLabel: string;
    groupValue: string;
    groupBy: string;
    product_id: null;
    product: string | null;
    unit: string | null;
    quantity: number;
    unit_price: number;
    total_amount: number;
    source: string;
    invoice_reference: string | null;
    notes: string | null;
    purchased_at: string | null;
    created_at: string | null;
    children: PurchaseTableRecord[];
};

type PurchaseTableRecord =
    | (PurchaseEntryRow & {
          key: string;
          isGroup?: false;
      })
    | PurchaseGroupRecord;

function PurchaseHistoryTable({
    entries,
    sources,
    products,
}: {
    entries: PurchasesPageProps['entries'];
    sources: PurchasesPageProps['sources'];
    products: PurchasesPageProps['products'];
}) {
    const [groupBy, setGroupBy] = useState('none');
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
            onSuccess: () => closeEditModal(),
        });
    };

    const deleteEditingEntry = () => {
        if (!editingEntry) {
            return;
        }

        if (!confirm('Excluir este registro de compra?')) {
            return;
        }

        router.delete(route('purchases.destroy', editingEntry.id), {
            preserveScroll: true,
            onSuccess: () => closeEditModal(),
        });
    };

    const deleteSelectedEntries = () => {
        if (selectedRowKeys.length === 0) {
            return;
        }

        const total = selectedRowKeys.length;

        if (
            !confirm(
                total === 1
                    ? 'Excluir 1 registro selecionado?'
                    : `Excluir ${total} registros selecionados?`,
            )
        ) {
            return;
        }

        router.delete(route('purchases.destroy-many'), {
            data: {
                ids: selectedRowKeys.map((key) => Number(key)),
            },
            preserveScroll: true,
            onSuccess: () => setSelectedRowKeys([]),
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
        onFilter: (value: Key | boolean, record: PurchaseTableRecord) => {
            const current = String(record[dataIndex] ?? '').toLowerCase();
            return current.includes(String(value).toLowerCase());
        },
    });

    const dataSource: PurchaseTableRecord[] =
        groupBy === 'none'
            ? entries.map((entry) => ({
                  ...entry,
                  key: String(entry.id),
              }))
            : Object.entries(
                  entries.reduce<Record<string, PurchaseEntryRow[]>>(
                      (groups, entry) => {
                          const key =
                              groupBy === 'product'
                                  ? entry.product ?? 'Produto removido'
                                  : groupBy === 'source'
                                    ? entry.source === 'nota_fiscal'
                                        ? 'Nota fiscal'
                                        : 'Manual'
                                    : groupBy === 'invoice_reference'
                                      ? entry.invoice_reference || 'Sem referencia'
                                      : formatDate(entry.purchased_at);

                          groups[key] ??= [];
                          groups[key].push(entry);

                          return groups;
                      },
                      {},
                  ),
              ).map(([label, groupEntries]) => ({
                  key: `group-${groupBy}-${label}`,
                  id: `group-${groupBy}-${label}`,
                  isGroup: true,
                  groupLabel: label,
                  groupValue: label,
                  groupBy,
                  product_id: null,
                  product: groupBy === 'product' ? label : null,
                  unit: null,
                  quantity: groupEntries.reduce(
                      (total, entry) => total + entry.quantity,
                      0,
                  ),
                  unit_price: 0,
                  total_amount: groupEntries.reduce(
                      (total, entry) => total + entry.total_amount,
                      0,
                  ),
                  source:
                      groupBy === 'source' && label === 'Nota fiscal'
                          ? 'nota_fiscal'
                          : groupBy === 'source' && label === 'Manual'
                            ? 'manual'
                            : '',
                  invoice_reference:
                      groupBy === 'invoice_reference' ? label : null,
                  notes: `${groupEntries.length} registros`,
                  purchased_at: groupBy === 'date' ? groupEntries[0]?.purchased_at ?? null : null,
                  created_at: null,
                  children: groupEntries.map((entry) => ({
                      ...entry,
                      key: String(entry.id),
                  })),
              }));

    const columns: ColumnsType<PurchaseTableRecord> = [
        {
            title: 'Produto',
            dataIndex: 'product',
            key: 'product',
            sorter: (a: PurchaseTableRecord, b: PurchaseTableRecord) =>
                String(a.product ?? '').localeCompare(String(b.product ?? '')),
            render: (_: unknown, record: PurchaseTableRecord) =>
                record.isGroup ? (
                    <div>
                        <p className="font-semibold text-slate-900">
                            {record.groupLabel}
                        </p>
                        <p className="mt-1 text-slate-500">
                            {record.children.length} registros neste grupo
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="font-semibold text-slate-900">
                            {record.product ?? 'Produto removido'}
                        </p>
                        <p className="mt-1 text-slate-500">
                            {record.unit ?? 'un'}
                        </p>
                    </div>
                ),
            ...getTextFilter('product', 'Filtrar por produto'),
        },
        {
            title: 'Data',
            dataIndex: 'purchased_at',
            key: 'purchased_at',
            sorter: (a: PurchaseTableRecord, b: PurchaseTableRecord) =>
                String(a.purchased_at ?? '').localeCompare(
                    String(b.purchased_at ?? ''),
                ),
            render: (_: unknown, record: PurchaseTableRecord) =>
                record.isGroup && groupBy !== 'date'
                    ? '--'
                    : formatDate(record.purchased_at),
            filterDropdown: ({
                selectedKeys,
                setSelectedKeys,
                confirm,
                clearFilters,
            }: FilterDropdownProps) => (
                <div className="w-56 p-3">
                    <Input
                        type="date"
                        value={String(selectedKeys[0] ?? '')}
                        onChange={(event) =>
                            setSelectedKeys(
                                event.target.value ? [event.target.value] : [],
                            )
                        }
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
            onFilter: (value: Key | boolean, record: PurchaseTableRecord) =>
                String(record.purchased_at ?? '') === String(value),
        },
        {
            title: 'Origem',
            dataIndex: 'source',
            key: 'source',
            sorter: (a: PurchaseTableRecord, b: PurchaseTableRecord) =>
                String(a.source).localeCompare(String(b.source)),
            render: (_: unknown, record: PurchaseTableRecord) =>
                record.isGroup && groupBy !== 'source' ? (
                    '--'
                ) : (
                    <Tag color="cyan">
                        {record.source === 'nota_fiscal'
                            ? 'Nota fiscal'
                            : record.source === 'manual'
                              ? 'Manual'
                              : record.isGroup
                                ? record.groupLabel
                                : '--'}
                    </Tag>
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
                        placeholder="Filtrar origem"
                        className="w-full"
                        size="middle"
                        onChange={(value: string | undefined) =>
                            setSelectedKeys(value ? [value] : [])
                        }
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
            onFilter: (value: Key | boolean, record: PurchaseTableRecord) =>
                record.source === value,
        },
        {
            title: 'Nota',
            dataIndex: 'invoice_reference',
            key: 'invoice_reference',
            sorter: (a: PurchaseTableRecord, b: PurchaseTableRecord) =>
                String(a.invoice_reference ?? '').localeCompare(
                    String(b.invoice_reference ?? ''),
                ),
            render: (_: unknown, record: PurchaseTableRecord) =>
                record.isGroup && groupBy !== 'invoice_reference'
                    ? '--'
                    : record.invoice_reference || '--',
            ...getTextFilter('invoice_reference', 'Filtrar por referencia'),
        },
        {
            title: 'Quantidade',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'right',
            sorter: (a: PurchaseTableRecord, b: PurchaseTableRecord) =>
                a.quantity - b.quantity,
            render: (_: unknown, record: PurchaseTableRecord) =>
                record.isGroup
                    ? formatQuantity(record.quantity)
                    : `${formatQuantity(record.quantity)} ${record.unit ?? 'un'}`,
        },
        {
            title: 'Unitario',
            dataIndex: 'unit_price',
            key: 'unit_price',
            align: 'right',
            sorter: (a: PurchaseTableRecord, b: PurchaseTableRecord) =>
                a.unit_price - b.unit_price,
            render: (_: unknown, record: PurchaseTableRecord) =>
                record.isGroup ? '--' : formatCurrency(record.unit_price),
        },
        {
            title: 'Total',
            dataIndex: 'total_amount',
            key: 'total_amount',
            align: 'right',
            sorter: (a: PurchaseTableRecord, b: PurchaseTableRecord) =>
                a.total_amount - b.total_amount,
            render: (_: unknown, record: PurchaseTableRecord) => (
                <span className="font-semibold text-slate-900">
                    {formatCurrency(record.total_amount)}
                </span>
            ),
        },
        {
            title: 'Observacoes',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
            render: (_: unknown, record: PurchaseTableRecord) =>
                record.notes || 'Sem observacoes.',
            ...getTextFilter('notes', 'Filtrar observacoes'),
        },
    ];

    return (
        <SectionCard
            title="Tabela de compras"
            description="Clique em um registro para editar. Use os checkboxes para selecionar e excluir em lote."
            actions={
                selectedRowKeys.length > 0 ? (
                    <DangerButton
                        type="button"
                        onClick={deleteSelectedEntries}
                    >
                        Excluir selecionados ({selectedRowKeys.length})
                    </DangerButton>
                ) : null
            }
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#f8f4ec] px-4 py-4">
                <div>
                    <p className="text-sm font-semibold text-slate-700">
                        {entries.length} registros carregados
                    </p>
                    <p className="text-sm text-slate-500">
                        Use os filtros do cabeçalho, clique na linha para editar e agrupe quando fizer sentido.
                    </p>
                </div>

                <div className="flex min-w-[260px] items-center gap-3">
                    <Select
                        value={groupBy}
                        className="w-full"
                        size="large"
                        onChange={setGroupBy}
                        options={[
                            { value: 'none', label: 'Sem agrupamento' },
                            { value: 'product', label: 'Agrupar por produto' },
                            { value: 'source', label: 'Agrupar por origem' },
                            {
                                value: 'invoice_reference',
                                label: 'Agrupar por referencia',
                            },
                            { value: 'date', label: 'Agrupar por data' },
                        ]}
                    />
                    {groupBy !== 'none' && (
                        <Button onClick={() => setGroupBy('none')}>
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

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
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} de ${total} compras`,
                    }}
                    expandable={
                        groupBy === 'none'
                            ? undefined
                            : {
                                  defaultExpandAllRows: false,
                              }
                    }
                    size="middle"
                    scroll={{ x: 1200 }}
                    rowClassName={(record) =>
                        record.isGroup ? '' : 'cursor-pointer'
                    }
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

            <Modal
                show={Boolean(editingEntry)}
                onClose={closeEditModal}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                                Compras
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                                Editar registro
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Ajuste o produto, a quantidade e os valores. O estoque sera recalculado automaticamente.
                            </p>
                        </div>

                        <DangerButton
                            type="button"
                            onClick={deleteEditingEntry}
                        >
                            Excluir
                        </DangerButton>
                    </div>

                    <form onSubmit={submitEdit} className="mt-6 space-y-5">
                        <div>
                            <InputLabel htmlFor="edit_product_id" value="Produto" />
                            <Select
                                id="edit_product_id"
                                value={editData.product_id || undefined}
                                onChange={(value) =>
                                    setEditData('product_id', value ?? '')
                                }
                                className="mt-2 w-full"
                                size="large"
                                allowClear
                                placeholder="Selecione um produto"
                                options={products.map((product) => ({
                                    value: String(product.id),
                                    label: product.name,
                                }))}
                            />
                            <InputError
                                message={errors.product_id}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="edit_quantity" value="Quantidade" />
                                <input
                                    id="edit_quantity"
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={editData.quantity}
                                    onChange={(event) =>
                                        setEditData('quantity', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError
                                    message={errors.quantity}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="edit_unit_price" value="Preco unitario" />
                                <input
                                    id="edit_unit_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editData.unit_price}
                                    onChange={(event) =>
                                        setEditData('unit_price', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError
                                    message={errors.unit_price}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="edit_purchased_at" value="Data da compra" />
                                <input
                                    id="edit_purchased_at"
                                    type="date"
                                    value={editData.purchased_at}
                                    onChange={(event) =>
                                        setEditData('purchased_at', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError
                                    message={errors.purchased_at}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="edit_source" value="Origem" />
                                <Select
                                    id="edit_source"
                                    value={editData.source}
                                    onChange={(value) =>
                                        setEditData('source', value)
                                    }
                                    className="mt-2 w-full"
                                    size="large"
                                    options={sources.map((source) => ({
                                        value: source.value,
                                        label: source.label,
                                    }))}
                                />
                                <InputError
                                    message={errors.source}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit_invoice_reference"
                                value="Referencia da nota"
                            />
                            <input
                                id="edit_invoice_reference"
                                type="text"
                                value={editData.invoice_reference}
                                onChange={(event) =>
                                    setEditData('invoice_reference', event.target.value)
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={errors.invoice_reference}
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
                            <InputError
                                message={errors.notes}
                                className="mt-2"
                            />
                        </div>

                        <div className="rounded-[28px] bg-[#f8f4ec] p-5">
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                                Total previsto
                            </p>
                            <p className="mt-3 text-3xl font-semibold text-slate-900">
                                {formatCurrency(
                                    Number(editData.quantity || 0) *
                                        Number(editData.unit_price || 0),
                                )}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-3">
                            <SecondaryButton
                                type="button"
                                onClick={closeEditModal}
                            >
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                Salvar alteracoes
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </SectionCard>
    );
}

export default function PurchasesIndex({
    products,
    categories,
    importUnits,
    sources,
    importPreview,
    entries,
}: PurchasesPageProps) {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        product_id: products[0] ? String(products[0].id) : '',
        quantity: '1',
        unit_price: '0',
        purchased_at: new Date().toISOString().slice(0, 10),
        source: sources[0]?.value ?? 'manual',
        invoice_reference: '',
        notes: '',
    });

    const importForm = useForm({
        receipt_url: importPreview?.receipt_url ?? '',
    });

    const totalPreview =
        Number(data.quantity || 0) * Number(data.unit_price || 0);

    const closeImportModal = () => {
        setIsImportModalOpen(false);
        importForm.setData('receipt_url', '');
        importForm.clearErrors();
    };

    const closePurchaseModal = () => {
        setIsPurchaseModalOpen(false);
        reset();
        clearErrors();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsPurchaseModalOpen(false);
            },
        });
    };

    const submitImport = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        importForm.post(route('purchases.import-link'), {
            preserveScroll: true,
            onSuccess: () => {
                importForm.setData('receipt_url', '');
                setIsImportModalOpen(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                            Compras
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                            Registre entradas no estoque.
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <SecondaryButton
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                        >
                            Importar NFC-e
                        </SecondaryButton>
                        <PrimaryButton
                            type="button"
                            onClick={() => setIsPurchaseModalOpen(true)}
                        >
                            Nova compra manual
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title="Compras" />

            <div className="space-y-6">
                {importPreview && (
                    <ImportPreviewSection
                        preview={importPreview}
                        products={products}
                        categories={categories}
                        importUnits={importUnits}
                    />
                )}

                <PurchaseHistoryTable
                    entries={entries}
                    sources={sources}
                    products={products}
                />
            </div>

            <Modal
                show={isImportModalOpen}
                onClose={closeImportModal}
                maxWidth="xl"
            >
                <div className="p-5 sm:p-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                            Compras
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            Importar compra por link da NFC-e
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Cole o link publico da SEFAZ do Parana. O sistema
                            busca os itens da nota, monta um rascunho e voce
                            classifica cada produto antes de confirmar.
                        </p>
                    </div>

                    <form onSubmit={submitImport} className="mt-6 space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="receipt_url"
                                value="Link da NFC-e"
                            />
                            <input
                                id="receipt_url"
                                type="text"
                                value={importForm.data.receipt_url}
                                onChange={(event) =>
                                    importForm.setData(
                                        'receipt_url',
                                        event.target.value,
                                    )
                                }
                                placeholder="https://www.fazenda.pr.gov.br/nfce/qrcode?p=..."
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={importForm.errors.receipt_url}
                                className="mt-2"
                            />
                        </div>

                        <div className="rounded-[24px] bg-[#f8f4ec] px-4 py-4 text-sm text-slate-600">
                            Suporte inicial para consulta publica da NFC-e do
                            Parana.
                        </div>

                        <div className="flex flex-wrap justify-end gap-3">
                            <SecondaryButton
                                type="button"
                                onClick={closeImportModal}
                            >
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton disabled={importForm.processing}>
                                Buscar nota
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal
                show={isPurchaseModalOpen}
                onClose={closePurchaseModal}
                maxWidth="2xl"
            >
                <div className="p-5 sm:p-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                            Compras
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            Nova compra manual
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Cada registro aumenta o estoque do produto
                            automaticamente.
                        </p>
                    </div>

                    {products.length > 0 ? (
                        <form onSubmit={submit} className="mt-6 space-y-5">
                            <div>
                                <InputLabel
                                    htmlFor="product_id"
                                    value="Produto"
                                />
                                <Select
                                    id="product_id"
                                    value={data.product_id}
                                    onChange={(value) =>
                                        setData('product_id', value)
                                    }
                                    className="mt-2 w-full"
                                    size="large"
                                    options={products.map((product) => ({
                                        value: String(product.id),
                                        label: product.name,
                                    }))}
                                />
                                <InputError
                                    message={errors.product_id}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="quantity"
                                        value="Quantidade"
                                    />
                                    <input
                                        id="quantity"
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={data.quantity}
                                        onChange={(event) =>
                                            setData(
                                                'quantity',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    />
                                    <InputError
                                        message={errors.quantity}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="unit_price"
                                        value="Preco unitario"
                                    />
                                    <input
                                        id="unit_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.unit_price}
                                        onChange={(event) =>
                                            setData(
                                                'unit_price',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    />
                                    <InputError
                                        message={errors.unit_price}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="purchased_at"
                                        value="Data da compra"
                                    />
                                    <input
                                        id="purchased_at"
                                        type="date"
                                        value={data.purchased_at}
                                        onChange={(event) =>
                                            setData(
                                                'purchased_at',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="source"
                                        value="Origem"
                                    />
                                    <Select
                                        id="source"
                                        value={data.source}
                                        onChange={(value) =>
                                            setData('source', value)
                                        }
                                        className="mt-2 w-full"
                                        size="large"
                                        options={sources.map((source) => ({
                                            value: source.value,
                                            label: source.label,
                                        }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="invoice_reference"
                                    value="Referencia da nota"
                                />
                                <input
                                    id="invoice_reference"
                                    type="text"
                                    value={data.invoice_reference}
                                    onChange={(event) =>
                                        setData(
                                            'invoice_reference',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="notes"
                                    value="Observacoes"
                                />
                                <textarea
                                    id="notes"
                                    rows={5}
                                    value={data.notes}
                                    onChange={(event) =>
                                        setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>

                            <div className="rounded-[28px] bg-[#f8f4ec] p-5">
                                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                                    Total previsto
                                </p>
                                <p className="mt-3 text-3xl font-semibold text-slate-900">
                                    {formatCurrency(totalPreview)}
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-end gap-3">
                                <SecondaryButton
                                    type="button"
                                    onClick={closePurchaseModal}
                                >
                                    Cancelar
                                </SecondaryButton>
                                <PrimaryButton disabled={processing}>
                                    Registrar compra
                                </PrimaryButton>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-6 rounded-[28px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                            Cadastre um produto antes de registrar compras.
                        </div>
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
