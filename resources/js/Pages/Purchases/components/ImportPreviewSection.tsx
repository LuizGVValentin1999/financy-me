import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SectionCard from '@/Components/SectionCard';
import SecondaryButton from '@/Components/SecondaryButton';
import { useAntdApp } from '@/hooks/useAntdApp';
import { useDependencyErrorNotification } from '@/hooks/useDependencyErrorNotification';
import { formatCurrency } from '@/lib/format';
import type { PurchasesPageProps } from '@/Pages/Purchases/types';
import { router, useForm } from '@inertiajs/react';
import { DatePicker, Select } from 'antd';
import { FormEvent, useMemo } from 'react';
import dayjs from 'dayjs';
import ImportPreviewItemCard from './importPreview/ImportPreviewItemCard';
import ImportPreviewSidebar from './importPreview/ImportPreviewSidebar';
import {
    calculateEstimatedFinancialTotal,
    getMeaningfulPaymentMethods,
} from './importPreview/calculations';

export default function ImportPreviewSection({
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
    const { message, modal } = useAntdApp();

    const meaningfulPaymentMethods = useMemo(
        () => getMeaningfulPaymentMethods(preview.payment_methods),
        [preview.payment_methods],
    );

    const { data, setData, post, processing, errors } = useForm({
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
        customMessage: 'Revise a(s) conta(s) de pagamento e campos obrigatórios',
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

    const estimatedFinancialTotal = calculateEstimatedFinancialTotal(data.payments);

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
                        modal.confirm({
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
                <ImportPreviewSidebar
                    preview={preview}
                    meaningfulPaymentMethods={meaningfulPaymentMethods}
                />

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
                                            <DatePicker
                                                id={`payments.${paymentIndex}.first_due_date`}
                                                value={
                                                    payment.first_due_date
                                                        ? dayjs(payment.first_due_date)
                                                        : null
                                                }
                                                format="DD/MM/YYYY"
                                                size="large"
                                                onChange={(date) =>
                                                    updatePayment(
                                                        paymentIndex,
                                                        'first_due_date',
                                                        date ? date.format('YYYY-MM-DD') : '',
                                                    )
                                                }
                                                className="mt-2 w-full"
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

                    {preview.items.map((item, index) => (
                        <ImportPreviewItemCard
                            key={`${item.index}-${item.name}`}
                            item={item}
                            index={index}
                            itemState={data.items[index]}
                            products={products}
                            categories={categories}
                            importUnits={importUnits}
                            errors={errors as Record<string, string | undefined>}
                            onUpdateItem={updateItem}
                        />
                    ))}

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
