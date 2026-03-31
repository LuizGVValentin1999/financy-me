import Checkbox from '@/Components/Checkbox';
import DangerButton from '@/Components/DangerButton';
import FormModalActions from '@/Components/FormModalActions';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SectionCard from '@/Components/SectionCard';
import SecondaryButton from '@/Components/SecondaryButton';
import TableTextFilterDropdown from '@/Components/TableTextFilterDropdown';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { useDependencyErrorNotification } from '@/hooks/useDependencyErrorNotification';
import { Head, router, useForm } from '@inertiajs/react';
import { Button, Input, Modal as AntdModal, Select, Space, Table, Tag, message } from 'antd';
import axios from 'axios';
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface';
import { FormEvent, Key, useEffect, useMemo, useState } from 'react';

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
    accounts: Array<{
        id: number;
        code: string;
        name: string;
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
        account_id: number | null;
        account: { id: number; code: string; name: string } | null;
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
    accounts,
}: {
    preview: NonNullable<PurchasesPageProps['importPreview']>;
    products: PurchasesPageProps['products'];
    categories: PurchasesPageProps['categories'];
    importUnits: PurchasesPageProps['importUnits'];
    accounts: PurchasesPageProps['accounts'];
}) {
    const firstAccountId = accounts[0] ? String(accounts[0].id) : '';

    const meaningfulPaymentMethods = useMemo(
        () =>
            preview.payment_methods.filter((payment) => {
                const normalizedMethod = payment.method
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .trim();

                if (payment.amount <= 0) {
                    return false;
                }

                if (!normalizedMethod) {
                    return false;
                }

                return ![
                    'forma de pagamento',
                    'informacao dos tributos',
                    'tributos totais incidentes',
                    'lei federal',
                    'valor aproximado dos tributos',
                ].some((fragment) => normalizedMethod.includes(fragment));
            }),
        [preview.payment_methods],
    );

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
            type: item.is_discount ? 'non_stockable' : 'stockable',
        })),
        payments: [
            {
                account_id: firstAccountId,
                type: 'cash',
                principal_amount: String(preview.amount_paid || 0),
                first_due_date:
                    preview.issued_at ?? new Date().toISOString().slice(0, 10),
                installments: '12',
                interest_type: 'rate',
                interest_rate: '1',
                installment_amount: '',
            },
        ],
    });


    useDependencyErrorNotification(errors, {
        dependencyPatterns: [/^payments\./, /account_id$/],
        customMessage: 'Revise a(s) conta(s) de pagamento e campos obrigatórios'
    });

    const updateItem = (
        index: number,
        key:
            | 'include'
            | 'product_id'
            | 'product_name'
            | 'quantity'
            | 'category_id'
            | 'unit'
            | 'type',
        value: boolean | string,
    ) => {
        setData(
            'items',
            data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        );
    };

    const updatePayment = (
        index: number,
        key:
            | 'account_id'
            | 'type'
            | 'principal_amount'
            | 'first_due_date'
            | 'installments'
            | 'interest_type'
            | 'interest_rate'
            | 'installment_amount',
        value: string,
    ) => {
        setData(
            'payments',
            data.payments.map((payment, paymentIndex) =>
                paymentIndex === index ? { ...payment, [key]: value } : payment,
            ),
        );
    };

    const addPayment = () => {
        setData('payments', [
            ...data.payments,
            {
                account_id: firstAccountId,
                type: 'cash',
                principal_amount: '0',
                first_due_date:
                    preview.issued_at ?? new Date().toISOString().slice(0, 10),
                installments: '12',
                interest_type: 'rate',
                interest_rate: '1',
                installment_amount: '',
            },
        ]);
    };

    const removePayment = (index: number) => {
        if (data.payments.length <= 1) {
            return;
        }

        setData(
            'payments',
            data.payments.filter((_, paymentIndex) => paymentIndex !== index),
        );
    };

    const includedItems = preview.items.filter((_, index) => data.items[index]?.include);
    const includedTotal = includedItems.reduce(
        (total, item) => total + item.total_amount,
        0,
    );

    const paymentsPrincipalTotal = data.payments.reduce(
        (total, payment) => total + (Number(payment.principal_amount) || 0),
        0,
    );

    const estimatedFinancialTotal = data.payments.reduce((total, payment) => {
        const principalAmount = Number(payment.principal_amount) || 0;

        if (payment.type === 'cash') {
            return total + principalAmount;
        }

        const installments = Math.max(2, Number(payment.installments) || 2);

        if (payment.interest_type === 'fixed_installment') {
            return total + (Number(payment.installment_amount) || 0) * installments;
        }

        const rate = (Number(payment.interest_rate) || 0) / 100;
        if (rate <= 0) {
            return total + principalAmount;
        }

        const factor = Math.pow(1 + rate, installments);
        const installmentAmount = principalAmount * ((rate * factor) / (factor - 1));

        return total + installmentAmount * installments;
    }, 0);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.import-confirm'), {
            preserveScroll: true,
            onSuccess: () => message.success('Nota fiscal importada com sucesso!'),
            onError: () => message.error('Erro ao importar nota fiscal'),
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
                    onClick={() => {
                        AntdModal.confirm({
                            title: 'Confirmar exclusão',
                            content: 'Excluir rascunho da importação?',
                            okText: 'Sim',
                            cancelText: 'Não',
                            onOk: () => {
                                router.delete(route('purchases.import-clear'), {
                                    preserveScroll: true,
                                    onSuccess: () => message.info('Rascunho da importação removido.'),
                                    onError: () => message.error('Erro ao remover rascunho'),
                                });
                            },
                        });
                    }}
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
                                Pagamentos identificados no cupom
                            </p>
                            {meaningfulPaymentMethods.length > 0 ? (
                                <div className="mt-3 space-y-2">
                                    {meaningfulPaymentMethods.map((payment) => (
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
                            ) : (
                                <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                                    O cupom nao trouxe formas de pagamento claras. Use a secao "Pagamento da nota" ao lado para registrar corretamente.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                    Pagamento da nota
                                </p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                    Escolha como essa compra foi paga por conta.
                                </p>
                            </div>

                            <SecondaryButton
                                type="button"
                                className="px-4 py-2 text-xs"
                                onClick={addPayment}
                            >
                                Adicionar conta
                            </SecondaryButton>
                        </div>

                        <div className="mt-4 space-y-4">
                            {data.payments.map((payment, paymentIndex) => (
                                <div
                                    key={`payment-${paymentIndex}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <div>
                                            <InputLabel
                                                htmlFor={`payments.${paymentIndex}.account_id`}
                                                value="Conta"
                                            />
                                            <Select
                                                id={`payments.${paymentIndex}.account_id`}
                                                value={payment.account_id || undefined}
                                                onChange={(value) =>
                                                    updatePayment(
                                                        paymentIndex,
                                                        'account_id',
                                                        value ?? '',
                                                    )
                                                }
                                                className="mt-2 w-full"
                                                size="large"
                                                options={accounts.map((account) => ({
                                                    value: String(account.id),
                                                    label: `${account.code} - ${account.name}`,
                                                }))}
                                            />
                                            <InputError
                                                message={errors[`payments.${paymentIndex}.account_id`]}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div>
                                            <InputLabel
                                                htmlFor={`payments.${paymentIndex}.principal_amount`}
                                                value="Valor base"
                                            />
                                            <input
                                                id={`payments.${paymentIndex}.principal_amount`}
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={payment.principal_amount}
                                                onChange={(event) =>
                                                    updatePayment(
                                                        paymentIndex,
                                                        'principal_amount',
                                                        event.target.value,
                                                    )
                                                }
                                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                            />
                                            <InputError
                                                message={errors[`payments.${paymentIndex}.principal_amount`]}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div>
                                            <InputLabel
                                                htmlFor={`payments.${paymentIndex}.type`}
                                                value="Forma"
                                            />
                                            <Select
                                                id={`payments.${paymentIndex}.type`}
                                                value={payment.type}
                                                onChange={(value) =>
                                                    updatePayment(
                                                        paymentIndex,
                                                        'type',
                                                        value,
                                                    )
                                                }
                                                className="mt-2 w-full"
                                                size="large"
                                                options={[
                                                    { value: 'cash', label: 'À vista' },
                                                    { value: 'installment', label: 'Parcelado' },
                                                ]}
                                            />
                                            <InputError
                                                message={errors[`payments.${paymentIndex}.type`]}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div>
                                            <InputLabel
                                                htmlFor={`payments.${paymentIndex}.first_due_date`}
                                                value="1º vencimento"
                                            />
                                            <input
                                                id={`payments.${paymentIndex}.first_due_date`}
                                                type="date"
                                                value={payment.first_due_date}
                                                onChange={(event) =>
                                                    updatePayment(
                                                        paymentIndex,
                                                        'first_due_date',
                                                        event.target.value,
                                                    )
                                                }
                                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                            />
                                            <InputError
                                                message={errors[`payments.${paymentIndex}.first_due_date`]}
                                                className="mt-2"
                                            />
                                        </div>
                                    </div>

                                    {payment.type === 'installment' && (
                                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            <div>
                                                <InputLabel
                                                    htmlFor={`payments.${paymentIndex}.installments`}
                                                    value="Parcelas"
                                                />
                                                <input
                                                    id={`payments.${paymentIndex}.installments`}
                                                    type="number"
                                                    min="2"
                                                    step="1"
                                                    value={payment.installments}
                                                    onChange={(event) =>
                                                        updatePayment(
                                                            paymentIndex,
                                                            'installments',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                                />
                                                <InputError
                                                    message={errors[`payments.${paymentIndex}.installments`]}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    htmlFor={`payments.${paymentIndex}.interest_type`}
                                                    value="Juros por"
                                                />
                                                <Select
                                                    id={`payments.${paymentIndex}.interest_type`}
                                                    value={payment.interest_type}
                                                    onChange={(value) =>
                                                        updatePayment(
                                                            paymentIndex,
                                                            'interest_type',
                                                            value,
                                                        )
                                                    }
                                                    className="mt-2 w-full"
                                                    size="large"
                                                    options={[
                                                        { value: 'rate', label: '% ao mês' },
                                                        { value: 'fixed_installment', label: 'Valor da parcela' },
                                                    ]}
                                                />
                                                <InputError
                                                    message={errors[`payments.${paymentIndex}.interest_type`]}
                                                    className="mt-2"
                                                />
                                            </div>

                                            {payment.interest_type === 'rate' ? (
                                                <div>
                                                    <InputLabel
                                                        htmlFor={`payments.${paymentIndex}.interest_rate`}
                                                        value="Juros (%)"
                                                    />
                                                    <input
                                                        id={`payments.${paymentIndex}.interest_rate`}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={payment.interest_rate}
                                                        onChange={(event) =>
                                                            updatePayment(
                                                                paymentIndex,
                                                                'interest_rate',
                                                                event.target.value,
                                                            )
                                                        }
                                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                                    />
                                                    <InputError
                                                        message={errors[`payments.${paymentIndex}.interest_rate`]}
                                                        className="mt-2"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <InputLabel
                                                        htmlFor={`payments.${paymentIndex}.installment_amount`}
                                                        value="Valor da parcela"
                                                    />
                                                    <input
                                                        id={`payments.${paymentIndex}.installment_amount`}
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={payment.installment_amount}
                                                        onChange={(event) =>
                                                            updatePayment(
                                                                paymentIndex,
                                                                'installment_amount',
                                                                event.target.value,
                                                            )
                                                        }
                                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                                    />
                                                    <InputError
                                                        message={errors[`payments.${paymentIndex}.installment_amount`]}
                                                        className="mt-2"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-end justify-end">
                                                <DangerButton
                                                    type="button"
                                                    onClick={() => removePayment(paymentIndex)}
                                                    className="px-4 py-2 text-xs"
                                                >
                                                    Remover conta
                                                </DangerButton>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <InputError message={errors.payments} className="mt-3" />
                    </div>

                    {preview.items.map((item, index) => {
                        const isIncluded = data.items[index].include;
                        const hasExistingProduct = Boolean(data.items[index].product_id);

                        return (
                        <div
                            key={`${item.index}-${item.name}`}
                            className={`rounded-[28px] border p-5 shadow-sm transition ${
                                isIncluded
                                    ? 'border-slate-200 bg-white'
                                    : 'border-dashed border-slate-200 bg-slate-50/90 opacity-80'
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
                                        {!isIncluded && (
                                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                Excluido do lancamento
                                            </span>
                                        )}
                                        {isIncluded && hasExistingProduct && (
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                Produto existente
                                            </span>
                                        )}
                                        {isIncluded && !hasExistingProduct && !item.is_discount && (
                                            <span className="rounded-full bg-[#eef7f7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                Novo produto
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

                                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                    item.is_discount
                                        ? 'bg-[#fff1ec] text-[#be3d2a]'
                                        : 'bg-[#eef7f7] text-slate-700'
                                }`}>
                                    {formatCurrency(item.total_amount)}
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                <label
                                    htmlFor={`items.${index}.include`}
                                    className="flex items-center gap-3 text-sm font-medium text-slate-700"
                                >
                                    <Checkbox
                                        id={`items.${index}.include`}
                                        checked={isIncluded}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'include',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    Incluir este item no lancamento
                                </label>

                                <SecondaryButton
                                    type="button"
                                    className="px-4 py-2 text-xs"
                                    onClick={() =>
                                        updateItem(
                                            index,
                                            'include',
                                            !isIncluded,
                                        )
                                    }
                                >
                                    {isIncluded
                                        ? 'Excluir desta importacao'
                                        : 'Restaurar item'}
                                </SecondaryButton>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                                            !isIncluded ||
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
                                            !isIncluded ||
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
                                        disabled={!isIncluded}
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
                                        placeholder="Criar novo produto"
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
                                            !isIncluded ||
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

                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.type`}
                                        value="Tipo do novo produto"
                                    />
                                    <Select
                                        id={`items.${index}.type`}
                                        value={data.items[index].type}
                                        disabled={
                                            !isIncluded
                                            || item.is_discount
                                            || hasExistingProduct
                                        }
                                        onChange={(value) =>
                                            updateItem(index, 'type', value)
                                        }
                                        className="mt-2 w-full"
                                        size="large"
                                        options={[
                                            { value: 'stockable', label: 'Estocável' },
                                            { value: 'non_stockable', label: 'Não estocável' },
                                        ]}
                                    />
                                    <p className="mt-2 text-xs text-slate-500">
                                        {hasExistingProduct
                                            ? 'Limpe o produto existente para definir o tipo do novo cadastro.'
                                            : 'Usado apenas quando o produto for criado pelo nome.'}
                                    </p>
                                    <InputError
                                        message={errors[`items.${index}.type`]}
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
                                    disabled={!isIncluded || hasExistingProduct}
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
                                <p className="mt-2 text-xs text-slate-500">
                                    {hasExistingProduct
                                        ? 'Campo desativado porque um produto existente foi selecionado.'
                                        : 'Esse nome sera usado no cadastro automatico do novo produto.'}
                                </p>
                            </div>
                        </div>
                        );
                    })}

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
                            <p className="mt-1 text-sm text-slate-500">
                                Soma base das contas: {formatCurrency(paymentsPrincipalTotal)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Total financeiro previsto: {formatCurrency(estimatedFinancialTotal)}
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
    account_id: null;
    account: null;
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
    accounts,
}: {
    entries: PurchasesPageProps['entries'];
    sources: PurchasesPageProps['sources'];
    products: PurchasesPageProps['products'];
    accounts: PurchasesPageProps['accounts'];
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
            content: total === 1
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
                                    ? entry.source === 'invoice'
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
                  account_id: null,
                  account: null,
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
                          ? 'invoice'
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
                        {record.source === 'invoice'
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
        {
            title: 'Conta',
            dataIndex: 'account',
            key: 'account',
            render: (_: unknown, record: PurchaseTableRecord) => {
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

function PurchaseFormModal({
    isOpen,
    onClose,
    isEditing,
    products,
    categories,
    sources,
    accounts,
    formData,
    setFormData,
    onSubmit,
    processing,
    errors,
    onDelete,
    onProductCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
    products: PurchasesPageProps['products'];
    categories?: PurchasesPageProps['categories'];
    sources: PurchasesPageProps['sources'];
    accounts: PurchasesPageProps['accounts'];
    formData: Record<string, string>;
    setFormData: (key: string, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    errors: Record<string, string>;
    onDelete?: () => void;
    onProductCreated?: (product: PurchasesPageProps['products'][number]) => void;
}) {
    const totalValue = Number(formData.quantity || 0) * Number(formData.unit_price || 0);
    const [productSearch, setProductSearch] = useState('');
    const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
    const [isQuickProductProcessing, setIsQuickProductProcessing] = useState(false);
    const [quickProductErrors, setQuickProductErrors] = useState<Record<string, string>>({});
    const [quickProductData, setQuickProductData] = useState({
        name: '',
        category_id: '',
        unit: 'un',
        type: 'stockable',
    });

    const openQuickProductModal = () => {
        setQuickProductErrors({});
        setQuickProductData((current) => ({
            ...current,
            name: productSearch.trim(),
        }));
        setIsQuickProductModalOpen(true);
    };

    const submitQuickProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsQuickProductProcessing(true);
        setQuickProductErrors({});

        try {
            const response = await axios.post(route('products.quick-store'), {
                name: quickProductData.name,
                category_id: quickProductData.category_id || null,
                unit: quickProductData.unit,
                type: quickProductData.type,
            });

            const createdProduct = response.data.product as PurchasesPageProps['products'][number];

            onProductCreated?.(createdProduct);
            setFormData('product_id', String(createdProduct.id));
            setProductSearch(createdProduct.name);
            setIsQuickProductModalOpen(false);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const serverErrors = (error.response.data?.errors ?? {}) as Record<string, string | string[]>;

                setQuickProductErrors(
                    Object.entries(serverErrors).reduce<Record<string, string>>(
                        (acc, [key, value]) => {
                            acc[key] = Array.isArray(value) ? value[0] : value;
                            return acc;
                        },
                        {},
                    ),
                );
            } else {
                setQuickProductErrors({
                    general: 'Nao foi possivel criar o produto agora. Tente novamente.',
                });
            }
        } finally {
            setIsQuickProductProcessing(false);
        }
    };

    return (
        <>
            <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
                <div className="p-5 sm:p-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                            Compras
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                            {isEditing ? 'Editar registro' : 'Nova compra manual'}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            {isEditing
                                ? 'Ajuste o produto, a quantidade e os valores. O estoque sera recalculado automaticamente.'
                                : 'Pesquise o produto para agilizar o lancamento ou crie um novo sem sair desta tela.'}
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="mt-6 space-y-5">
                        <div>
                            <InputLabel htmlFor="product_id" value="Produto" />
                            <Select
                                id="product_id"
                                value={formData.product_id || undefined}
                                onSearch={(value) => setProductSearch(value)}
                                onChange={(value) =>
                                    setFormData('product_id', (value ?? '') as string)
                                }
                                className="mt-2 w-full"
                                size="large"
                                showSearch
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    String(option?.label ?? '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                allowClear
                                placeholder="Pesquise por nome do produto"
                                options={products.map((product) => ({
                                    value: String(product.id),
                                    label: product.name,
                                }))}
                                notFoundContent="Nenhum produto encontrado"
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                <span>Não encontrou o produto na busca?</span>
                                <button
                                    type="button"
                                    onClick={openQuickProductModal}
                                    className="font-semibold text-slate-700 underline underline-offset-2"
                                >
                                    Cadastrar novo produto agora
                                </button>
                            </div>
                            <InputError
                                message={errors.product_id}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="account_id" value="Conta " />
                            <Select
                                id="account_id"
                                value={formData.account_id || undefined}
                                onChange={(value) =>
                                    setFormData('account_id', (value ?? '') as string)
                                }
                                className="mt-2 w-full"
                                size="large"
                                allowClear
                                placeholder="Sem conta"
                                options={accounts.map((account) => ({
                                    value: String(account.id),
                                    label: `${account.code} - ${account.name}`,
                                }))}
                            />
                            <InputError
                                message={errors.account_id}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="quantity" value="Quantidade" />
                                <input
                                    id="quantity"
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={formData.quantity}
                                    onChange={(event) =>
                                        setFormData('quantity', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError
                                    message={errors.quantity}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="unit_price" value="Preco unitario" />
                                <input
                                    id="unit_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.unit_price}
                                    onChange={(event) =>
                                        setFormData('unit_price', event.target.value)
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
                                <InputLabel htmlFor="purchased_at" value="Data da compra" />
                                <input
                                    id="purchased_at"
                                    type="date"
                                    value={formData.purchased_at}
                                    onChange={(event) =>
                                        setFormData('purchased_at', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError
                                    message={errors.purchased_at}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="source" value="Origem" />
                                <Select
                                    id="source"
                                    value={formData.source}
                                    onChange={(value) =>
                                        setFormData('source', value)
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
                                htmlFor="invoice_reference"
                                value="Referencia da nota"
                            />
                            <input
                                id="invoice_reference"
                                type="text"
                                value={formData.invoice_reference}
                                onChange={(event) =>
                                    setFormData('invoice_reference', event.target.value)
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={errors.invoice_reference}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Observacoes" />
                            <textarea
                                id="notes"
                                rows={5}
                                value={formData.notes}
                                onChange={(event) =>
                                    setFormData('notes', event.target.value)
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
                                {formatCurrency(totalValue)}
                            </p>
                        </div>

                        {isEditing ? (
                            <FormModalActions
                                onCancel={onClose}
                                onDelete={onDelete}
                                saveLabel="Salvar alteracoes"
                                saveDisabled={processing}
                            />
                        ) : (
                            <div className="flex flex-wrap justify-end gap-3">
                                <SecondaryButton type="button" onClick={onClose}>
                                    Cancelar
                                </SecondaryButton>
                                <PrimaryButton disabled={processing}>
                                    Registrar compra
                                </PrimaryButton>
                            </div>
                        )}
                    </form>
                </div>
            </Modal>

            <Modal
                show={isQuickProductModalOpen}
                onClose={() => setIsQuickProductModalOpen(false)}
                maxWidth="xl"
            >
                <div className="p-5 sm:p-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                            Produtos
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                            Cadastro rapido de produto
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Crie o produto sem sair da compra. Ao salvar, ele sera selecionado automaticamente.
                        </p>
                    </div>

                    <form onSubmit={submitQuickProduct} className="mt-6 space-y-4">
                        <div>
                            <InputLabel htmlFor="quick_product_name" value="Nome" />
                            <input
                                id="quick_product_name"
                                type="text"
                                value={quickProductData.name}
                                onChange={(event) =>
                                    setQuickProductData((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError message={quickProductErrors.name} className="mt-2" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="quick_product_category" value="Categoria" />
                                <Select
                                    id="quick_product_category"
                                    value={quickProductData.category_id || undefined}
                                    onChange={(value) =>
                                        setQuickProductData((current) => ({
                                            ...current,
                                            category_id: (value ?? '') as string,
                                        }))
                                    }
                                    className="mt-2 w-full"
                                    size="large"
                                    allowClear
                                    placeholder="Sem categoria"
                                    options={(categories ?? []).map((category) => ({
                                        value: String(category.id),
                                        label: category.name,
                                    }))}
                                />
                                <InputError message={quickProductErrors.category_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="quick_product_unit" value="Unidade" />
                                <Select
                                    id="quick_product_unit"
                                    value={quickProductData.unit}
                                    onChange={(value) =>
                                        setQuickProductData((current) => ({
                                            ...current,
                                            unit: value,
                                        }))
                                    }
                                    className="mt-2 w-full"
                                    size="large"
                                    options={[
                                        { value: 'un', label: 'Unidade' },
                                        { value: 'kg', label: 'Quilo' },
                                        { value: 'g', label: 'Grama' },
                                        { value: 'l', label: 'Litro' },
                                        { value: 'ml', label: 'Mililitro' },
                                        { value: 'cx', label: 'Caixa' },
                                    ]}
                                />
                                <InputError message={quickProductErrors.unit} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="quick_product_type" value="Tipo" />
                            <Select
                                id="quick_product_type"
                                value={quickProductData.type}
                                onChange={(value) =>
                                    setQuickProductData((current) => ({
                                        ...current,
                                        type: value,
                                    }))
                                }
                                className="mt-2 w-full"
                                size="large"
                                options={[
                                    { value: 'stockable', label: 'Estocável' },
                                    { value: 'non_stockable', label: 'Não estocável' },
                                ]}
                            />
                            <InputError message={quickProductErrors.type} className="mt-2" />
                        </div>

                        <InputError message={quickProductErrors.general} className="mt-2" />

                        <div className="flex flex-wrap justify-end gap-3">
                            <SecondaryButton
                                type="button"
                                onClick={() => setIsQuickProductModalOpen(false)}
                            >
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton disabled={isQuickProductProcessing}>
                                Criar produto
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}

export default function PurchasesIndex({
    products,
    categories,
    accounts,
    importUnits,
    sources,
    importPreview,
    entries,
}: PurchasesPageProps) {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [productsCatalog, setProductsCatalog] = useState(products);

    useEffect(() => {
        setProductsCatalog(products);
    }, [products]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        product_id: products[0] ? String(products[0].id) : '',
        account_id: '',
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

    const submitImport = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        importForm.post(route('purchases.import-link'), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Link de NFC-e importado com sucesso!');
                importForm.setData('receipt_url', '');
                setIsImportModalOpen(false);
            },
            onError: () => message.error('Erro ao importar link de NFC-e'),
        });
    };

    const onSubmitPurchase = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.store'), {
            preserveScroll: true,
            onSuccess: () => {
                message.info('Compra criada com sucesso!');
                reset();
                setIsPurchaseModalOpen(false);
            },
            onError: () => message.error('Erro ao criar compra'),
        });
    };

    const handleProductCreated = (
        product: PurchasesPageProps['products'][number],
    ) => {
        setProductsCatalog((current) => {
            if (current.some((item) => item.id === product.id)) {
                return current;
            }

            return [...current, product].sort((a, b) => a.name.localeCompare(b.name));
        });

        setData('product_id', String(product.id));
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
                        products={productsCatalog}
                        categories={categories}
                        importUnits={importUnits}
                        accounts={accounts}
                    />
                )}

                <PurchaseHistoryTable
                    entries={entries}
                    sources={sources}
                    products={productsCatalog}
                    accounts={accounts}
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

            <PurchaseFormModal
                isOpen={isPurchaseModalOpen}
                onClose={closePurchaseModal}
                isEditing={false}
                products={productsCatalog}
                categories={categories}
                sources={sources}
                accounts={accounts}
                formData={data}
                setFormData={setData}
                onSubmit={onSubmitPurchase}
                processing={processing}
                errors={errors}
                onProductCreated={handleProductCreated}
            />
        </AuthenticatedLayout>
    );
}
