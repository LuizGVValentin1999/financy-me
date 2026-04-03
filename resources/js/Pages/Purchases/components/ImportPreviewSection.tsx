import AccountModal from '@/Pages/Accounts/components/AccountModal';
import CategoryModal from '@/Pages/Categories/components/CategoryModal';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useAntdApp } from '@/hooks/useAntdApp';
import { useDependencyErrorNotification } from '@/hooks/useDependencyErrorNotification';
import { todayDateInputValue } from '@/lib/date';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import type { PurchasesPageProps } from '@/Pages/Purchases/types';
import ProductFormFields from '@/Pages/Products/components/ProductFormFields';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { DatePicker, Grid, Select } from 'antd';
import dayjs from 'dayjs';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import ImportPreviewSidebar from './importPreview/ImportPreviewSidebar';
import {
    calculateEstimatedFinancialTotal,
    getMeaningfulPaymentMethods,
} from './importPreview/calculations';

type Preview = NonNullable<PurchasesPageProps['importPreview']>;
type PreviewItem = Preview['items'][number];
type ProductOption = PurchasesPageProps['products'][number];
type CategoryOption = PurchasesPageProps['categories'][number];
type AccountOption = PurchasesPageProps['accounts'][number];
type ImportUnitOption = PurchasesPageProps['importUnits'][number];

type ItemFormState = {
    include: boolean;
    product_id: string;
    product_name: string;
    brand: string;
    sku: string;
    quantity: string;
    category_id: string;
    unit: string;
    type: string;
    minimum_stock: string;
    notes: string;
};

type PaymentFormState = {
    account_id: string;
    type: 'cash' | 'installment';
    principal_amount: string;
    first_due_date: string;
    installments: string;
    interest_type: 'rate' | 'fixed_installment';
    interest_rate: string;
    installment_amount: string;
};

const productUnitOptions: ImportUnitOption[] = [
    { value: 'un', label: 'Unidade' },
    { value: 'kg', label: 'Quilo' },
    { value: 'g', label: 'Grama' },
    { value: 'l', label: 'Litro' },
    { value: 'ml', label: 'Mililitro' },
    { value: 'cx', label: 'Caixa' },
];

const buildInitialItemState = (item: PreviewItem): ItemFormState => ({
    include: true,
    product_id: item.suggested_product_id ? String(item.suggested_product_id) : '',
    product_name: item.suggested_product_name,
    brand: '',
    sku: item.code ?? '',
    quantity: String(item.quantity),
    category_id: item.suggested_category_id ? String(item.suggested_category_id) : '',
    unit: item.suggested_unit,
    type: item.is_discount ? 'non_stockable' : 'stockable',
    minimum_stock: '0',
    notes: '',
});

const buildInitialPayment = (preview: Preview, firstAccountId: string): PaymentFormState => ({
    account_id: firstAccountId,
    type: 'cash',
    principal_amount: String(preview.amount_paid || 0),
    first_due_date: preview.issued_at ?? todayDateInputValue(),
    installments: '12',
    interest_type: 'rate',
    interest_rate: '1',
    installment_amount: '',
});

const getStepLabel = (preview: Preview, stepIndex: number) => {
    if (stepIndex === 0) {
        return 'Pagamento';
    }

    return preview.items[stepIndex - 1]?.name ?? '';
};

export default function ImportPreviewSection({
    preview,
    products,
    categories,
    importUnits,
    accounts,
}: {
    preview: Preview;
    products: PurchasesPageProps['products'];
    categories: PurchasesPageProps['categories'];
    importUnits: PurchasesPageProps['importUnits'];
    accounts: PurchasesPageProps['accounts'];
}) {
    const { message, modal } = useAntdApp();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;
    const [currentStep, setCurrentStep] = useState(0);
    const [productsCatalog, setProductsCatalog] = useState(products);
    const [categoriesCatalog, setCategoriesCatalog] = useState(categories);
    const [accountsCatalog, setAccountsCatalog] = useState(accounts);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [accountModalData, setAccountModalData] = useState({
        code: '',
        name: '',
        initial_balance: '0',
        initial_balance_date: preview.issued_at ?? todayDateInputValue(),
    });
    const [accountModalErrors, setAccountModalErrors] = useState<Record<string, string | undefined>>({});
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [categoryModalData, setCategoryModalData] = useState({
        code: '',
        name: '',
        color: '#6F8EA8',
        description: '',
    });
    const [categoryModalErrors, setCategoryModalErrors] = useState<Record<string, string | undefined>>({});
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    useEffect(() => {
        setProductsCatalog(products);
        setCategoriesCatalog(categories);
        setAccountsCatalog(accounts);
        setCurrentStep(0);
    }, [accounts, categories, preview.token, products]);

    const meaningfulPaymentMethods = useMemo(
        () => getMeaningfulPaymentMethods(preview.payment_methods),
        [preview.payment_methods],
    );

    const firstAccountId = accountsCatalog[0] ? String(accountsCatalog[0].id) : '';

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        token: preview.token,
        items: preview.items.map(buildInitialItemState),
        payments: [buildInitialPayment(preview, firstAccountId)],
    });

    useEffect(() => {
        setData({
            token: preview.token,
            items: preview.items.map(buildInitialItemState),
            payments: [buildInitialPayment(preview, accounts[0] ? String(accounts[0].id) : '')],
        });
        clearErrors();
    }, [accounts, clearErrors, preview, setData]);

    useDependencyErrorNotification(errors, {
        dependencyPatterns: [/^payments\./, /account_id$/],
        customMessage: 'Revise o pagamento e os campos obrigatorios antes de importar.',
    });

    useEffect(() => {
        const errorKeys = Object.keys(errors);

        const paymentError = errorKeys.find((key) => key === 'payments' || key.startsWith('payments.'));
        if (paymentError) {
            setCurrentStep(0);
            return;
        }

        const itemError = errorKeys.find((key) => key.startsWith('items.'));
        if (!itemError) {
            return;
        }

        const match = itemError.match(/^items\.(\d+)\./);
        if (!match) {
            return;
        }

        setCurrentStep(Number(match[1]) + 1);
    }, [errors]);

    const totalSteps = preview.items.length + 1;
    const controlSize = isMobile ? 'middle' : 'large';
    const inputClassName = 'mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm sm:px-4 sm:py-3';
    const compactButtonClassName = 'h-9 px-3 text-[11px] sm:h-12 sm:px-5 sm:text-sm';

    const currentItemIndex = Math.max(currentStep - 1, 0);
    const currentPreviewItem = preview.items[currentItemIndex] ?? null;
    const currentItemState = data.items[currentItemIndex] ?? null;
    const isPaymentStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    const visibleStepIndexes = Array.from(
        { length: Math.min(3, totalSteps - currentStep) },
        (_, index) => currentStep + index,
    );
    const hasHiddenPreviousSteps = currentStep > 0;
    const hasHiddenNextSteps =
        visibleStepIndexes[visibleStepIndexes.length - 1] < totalSteps - 1;

    const includedItems = preview.items.filter((_, index) => data.items[index]?.include);
    const includedTotal = includedItems.reduce((total, item) => total + item.total_amount, 0);
    const paymentsPrincipalTotal = data.payments.reduce((total, payment) => total + (Number(payment.principal_amount) || 0), 0);
    const estimatedFinancialTotal = calculateEstimatedFinancialTotal(data.payments);

    const updateItem = (index: number, key: keyof ItemFormState, value: boolean | string) => {
        setData(
            'items',
            data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        );
    };

    const updatePayment = (index: number, key: keyof PaymentFormState, value: string) => {
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
            buildInitialPayment(preview, firstAccountId),
        ]);
    };

    const removePayment = (index: number) => {
        if (data.payments.length <= 1) {
            return;
        }

        setData('payments', data.payments.filter((_, paymentIndex) => paymentIndex !== index));
    };

    const clearDraft = () => {
        modal.confirm({
            title: 'Confirmar exclusao',
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
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.import-confirm'), {
            preserveScroll: true,
            onSuccess: () => message.success('Nota fiscal importada com sucesso!'),
            onError: () => message.error('Revise os dados da NFC-e antes de importar.'),
        });
    };

    const handleAdvance = () => {
        if (isLastStep) {
            return;
        }

        setCurrentStep((current) => Math.min(current + 1, totalSteps - 1));
    };

    const handleBack = () => {
        setCurrentStep((current) => Math.max(current - 1, 0));
    };

    const openAccountModal = () => {
        setAccountModalErrors({});
        setAccountModalData({
            code: '',
            name: '',
            initial_balance: '0',
            initial_balance_date: preview.issued_at ?? todayDateInputValue(),
        });
        setIsAccountModalOpen(true);
    };

    const openCategoryModal = () => {
        setCategoryModalErrors({});
        setCategoryModalData({
            code: '',
            name: '',
            color: '#6F8EA8',
            description: '',
        });
        setIsCategoryModalOpen(true);
    };

    const submitAccountModal = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsCreatingAccount(true);
        setAccountModalErrors({});

        try {
            const response = await axios.post(route('accounts.store'), accountModalData, {
                headers: { Accept: 'application/json' },
            });

            const createdAccount = response.data.account as AccountOption;

            setAccountsCatalog((current) => [...current, createdAccount].sort((a, b) => a.name.localeCompare(b.name)));
            setData(
                'payments',
                data.payments.map((payment, index) =>
                    index === 0 ? { ...payment, account_id: String(createdAccount.id) } : payment,
                ),
            );
            setIsAccountModalOpen(false);
            message.success('Conta criada com sucesso!');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const serverErrors = (error.response.data?.errors ?? {}) as Record<string, string | string[]>;
                setAccountModalErrors(
                    Object.entries(serverErrors).reduce<Record<string, string>>((acc, [key, value]) => {
                        acc[key] = Array.isArray(value) ? value[0] : value;
                        return acc;
                    }, {}),
                );
            } else {
                setAccountModalErrors({ code: 'Não foi possível criar a conta agora.' });
            }
        } finally {
            setIsCreatingAccount(false);
        }
    };

    const submitCategoryModal = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsCreatingCategory(true);
        setCategoryModalErrors({});

        try {
            const response = await axios.post(route('categories.store'), categoryModalData, {
                headers: { Accept: 'application/json' },
            });

            const createdCategory = response.data.category as CategoryOption;

            setCategoriesCatalog((current) => [...current, createdCategory].sort((a, b) => a.name.localeCompare(b.name)));

            if (currentItemState) {
                updateItem(currentItemIndex, 'category_id', String(createdCategory.id));
            }

            setIsCategoryModalOpen(false);
            message.success('Categoria criada com sucesso!');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const serverErrors = (error.response.data?.errors ?? {}) as Record<string, string | string[]>;
                setCategoryModalErrors(
                    Object.entries(serverErrors).reduce<Record<string, string>>((acc, [key, value]) => {
                        acc[key] = Array.isArray(value) ? value[0] : value;
                        return acc;
                    }, {}),
                );
            } else {
                setCategoryModalErrors({ code: 'Não foi possível criar a categoria agora.' });
            }
        } finally {
            setIsCreatingCategory(false);
        }
    };

    return (
        <>
            <Modal show={true} onClose={clearDraft} maxWidth="screen">
                <form noValidate onSubmit={submit} className="flex max-h-[95dvh] flex-col overflow-hidden bg-white sm:max-h-[95vh]">
                    <div className="border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                        <div className="flex items-start justify-between gap-2 sm:flex-wrap sm:gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.24em]">Importação de NFC-e</p>
                                <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">Revisar nota fiscal</h2>
                                <p className="mt-1 hidden text-sm leading-5 text-slate-500 sm:mt-2 sm:block sm:leading-6">
                                    Defina o pagamento, revise cada item em sequencia e importe a nota no final.
                                </p>
                            </div>

                            <DangerButton type="button" onClick={clearDraft} className="h-9 px-3 text-[11px] sm:h-12 sm:px-5 sm:text-sm">
                                Limpar rascunho
                            </DangerButton>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 sm:mt-4 sm:gap-2">
                            {hasHiddenPreviousSteps ? (
                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.18em]">
                                    ...
                                </span>
                            ) : null}

                            {visibleStepIndexes.map((stepIndex) => (
                                <span
                                    key={`step-${stepIndex}`}
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.18em] ${currentStep === stepIndex ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {stepIndex + 1}. {getStepLabel(preview, stepIndex)}
                                </span>
                            ))}

                            {hasHiddenNextSteps ? (
                                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.18em]">
                                    ...
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="flex min-h-full w-full flex-col gap-4 p-4 sm:gap-5 sm:p-6">
                            {isPaymentStep ? (
                                <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
                                    <div className="xl:min-h-0 xl:overflow-y-auto">
                                        <ImportPreviewSidebar
                                            preview={preview}
                                            meaningfulPaymentMethods={meaningfulPaymentMethods}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Etapa 1</p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">Definição de pagamento</p>
                                            <p className="mt-1 text-sm text-slate-500">Distribua o valor pago entre as contas da casa.</p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <SecondaryButton type="button" onClick={openAccountModal} className={compactButtonClassName}>
                                                Nova conta
                                            </SecondaryButton>
                                            <SecondaryButton type="button" onClick={addPayment} className={compactButtonClassName}>
                                                Adicionar conta
                                            </SecondaryButton>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {data.payments.map((payment, paymentIndex) => (
                                            <div
                                                key={`payment-${paymentIndex}`}
                                                className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                                            >
                                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                    <div>
                                                        <InputLabel htmlFor={`payments.${paymentIndex}.account_id`} value="Conta" />
                                                        <Select
                                                            id={`payments.${paymentIndex}.account_id`}
                                                            value={payment.account_id || undefined}
                                                            onChange={(value) => updatePayment(paymentIndex, 'account_id', value ?? '')}
                                                            className="mt-2 w-full"
                                                            size={controlSize}
                                                            options={accountsCatalog.map((account) => ({
                                                                value: String(account.id),
                                                                label: `${account.code} - ${account.name}`,
                                                            }))}
                                                        />
                                                        <InputError message={errors[`payments.${paymentIndex}.account_id`]} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor={`payments.${paymentIndex}.type`} value="Tipo" />
                                                        <Select
                                                            id={`payments.${paymentIndex}.type`}
                                                            value={payment.type}
                                                            onChange={(value) => updatePayment(paymentIndex, 'type', value)}
                                                            className="mt-2 w-full"
                                                            size={controlSize}
                                                            options={[
                                                                { value: 'cash', label: 'A vista' },
                                                                { value: 'installment', label: 'Parcelado' },
                                                            ]}
                                                        />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor={`payments.${paymentIndex}.principal_amount`} value="Valor principal" />
                                                        <input
                                                            id={`payments.${paymentIndex}.principal_amount`}
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={payment.principal_amount}
                                                            onChange={(event) => updatePayment(paymentIndex, 'principal_amount', event.target.value)}
                                                            className={inputClassName}
                                                        />
                                                        <InputError message={errors[`payments.${paymentIndex}.principal_amount`]} className="mt-2" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor={`payments.${paymentIndex}.first_due_date`} value="Data" />
                                                        <DatePicker
                                                            id={`payments.${paymentIndex}.first_due_date`}
                                                            value={payment.first_due_date ? dayjs(payment.first_due_date) : null}
                                                            format="DD/MM/YYYY"
                                                            size={controlSize}
                                                            onChange={(date) => updatePayment(paymentIndex, 'first_due_date', date ? date.format('YYYY-MM-DD') : '')}
                                                            className="mt-2 w-full"
                                                        />
                                                        <InputError message={errors[`payments.${paymentIndex}.first_due_date`]} className="mt-2" />
                                                    </div>
                                                </div>

                                                {payment.type === 'installment' ? (
                                                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                                                        <div>
                                                            <InputLabel htmlFor={`payments.${paymentIndex}.installments`} value="Parcelas" />
                                                            <input
                                                                id={`payments.${paymentIndex}.installments`}
                                                                type="number"
                                                                min="2"
                                                                step="1"
                                                                value={payment.installments}
                                                                onChange={(event) => updatePayment(paymentIndex, 'installments', event.target.value)}
                                                                className={inputClassName}
                                                            />
                                                            <InputError message={errors[`payments.${paymentIndex}.installments`]} className="mt-2" />
                                                        </div>

                                                        <div>
                                                            <InputLabel htmlFor={`payments.${paymentIndex}.interest_type`} value="Juros" />
                                                            <Select
                                                                id={`payments.${paymentIndex}.interest_type`}
                                                                value={payment.interest_type}
                                                                onChange={(value) => updatePayment(paymentIndex, 'interest_type', value)}
                                                                className="mt-2 w-full"
                                                                size={controlSize}
                                                                options={[
                                                                    { value: 'rate', label: 'Percentual' },
                                                                    { value: 'fixed_installment', label: 'Valor da parcela' },
                                                                ]}
                                                            />
                                                            <InputError message={errors[`payments.${paymentIndex}.interest_type`]} className="mt-2" />
                                                        </div>

                                                        <div>
                                                            {payment.interest_type === 'fixed_installment' ? (
                                                                <>
                                                                    <InputLabel htmlFor={`payments.${paymentIndex}.installment_amount`} value="Valor da parcela" />
                                                                    <input
                                                                        id={`payments.${paymentIndex}.installment_amount`}
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        value={payment.installment_amount}
                                                                        onChange={(event) => updatePayment(paymentIndex, 'installment_amount', event.target.value)}
                                                                        className={inputClassName}
                                                                    />
                                                                    <InputError message={errors[`payments.${paymentIndex}.installment_amount`]} className="mt-2" />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <InputLabel htmlFor={`payments.${paymentIndex}.interest_rate`} value="Juros (%)" />
                                                                    <input
                                                                        id={`payments.${paymentIndex}.interest_rate`}
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={payment.interest_rate}
                                                                        onChange={(event) => updatePayment(paymentIndex, 'interest_rate', event.target.value)}
                                                                        className={inputClassName}
                                                                    />
                                                                    <InputError message={errors[`payments.${paymentIndex}.interest_rate`]} className="mt-2" />
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : null}

                                                <div className="mt-4 flex justify-end">
                                                    {data.payments.length > 1 ? (
                                                        <SecondaryButton type="button" onClick={() => removePayment(paymentIndex)} className={compactButtonClassName}>
                                                            Remover conta
                                                        </SecondaryButton>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-[24px] border border-slate-200 bg-[#f8f4ec] p-4">
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Valor pago na NFC-e</p>
                                                <p className="mt-2 font-semibold text-slate-900">{formatCurrency(preview.amount_paid)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Distribuido nas contas</p>
                                                <p className="mt-2 font-semibold text-slate-900">{formatCurrency(paymentsPrincipalTotal)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Financeiro estimado</p>
                                                <p className="mt-2 font-semibold text-slate-900">{formatCurrency(estimatedFinancialTotal)}</p>
                                            </div>
                                        </div>
                                        <InputError message={errors.payments} className="mt-3" />
                                    </div>
                                </div>
                                </div>
                            ) : currentPreviewItem && currentItemState ? (
                                <div className="w-full space-y-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Etapa {currentStep + 1} de {totalSteps}</p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">Revisar item da nota</p>
                                            <p className="mt-1 text-sm text-slate-500">Confirme os dados do item antes de avançar para o próximo.</p>
                                        </div>

                                        <div className={`rounded-full px-4 py-2 text-sm font-semibold ${currentPreviewItem.is_discount ? 'bg-[#fff1ec] text-[#be3d2a]' : 'bg-[#eef7f7] text-slate-700'}`}>
                                            {formatCurrency(currentPreviewItem.total_amount)}
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-xl font-semibold text-slate-900">{currentPreviewItem.name}</p>
                                                    {currentPreviewItem.suggested_product_id ? (
                                                        <span className="rounded-full bg-[#eef7f7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                            Sugestao {Math.round(currentPreviewItem.suggestion_score ?? 0)}%
                                                        </span>
                                                    ) : null}
                                                    {currentPreviewItem.is_discount ? (
                                                        <span className="rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#be3d2a]">
                                                            Desconto global
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Nota: {formatQuantity(currentPreviewItem.quantity)} {currentPreviewItem.unit} • {formatCurrency(currentPreviewItem.unit_price)} cada
                                                    {currentPreviewItem.code ? ` • código ${currentPreviewItem.code}` : ''}
                                                </p>
                                                {currentPreviewItem.suggested_product_id ? (
                                                    <p className="mt-2 text-sm text-slate-600">
                                                        Produto mais próximo encontrado:{' '}
                                                        <span className="font-semibold text-slate-900">{currentPreviewItem.suggested_product_name}</span>
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                                            <label htmlFor={`items.${currentItemIndex}.include`} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                                <input
                                                    id={`items.${currentItemIndex}.include`}
                                                    type="checkbox"
                                                    checked={currentItemState.include}
                                                    onChange={(event) => updateItem(currentItemIndex, 'include', event.target.checked)}
                                                />
                                                Incluir este item na importação
                                            </label>

                                            <SecondaryButton type="button" onClick={() => updateItem(currentItemIndex, 'include', !currentItemState.include)}>
                                                {currentItemState.include ? 'Remover da importação' : 'Reincluir na importação'}
                                            </SecondaryButton>
                                        </div>
                                    </div>

                                    {currentItemState.include ? (
                                        <>
                                            <div>
                                                <InputLabel htmlFor={`items.${currentItemIndex}.product_id`} value="Produto existente" />
                                                <Select
                                                    id={`items.${currentItemIndex}.product_id`}
                                                    value={currentItemState.product_id || undefined}
                                                    onChange={(value) => updateItem(currentItemIndex, 'product_id', value ?? '')}
                                                    className="mt-2 w-full"
                                                    size={controlSize}
                                                    showSearch
                                                    allowClear
                                                    optionFilterProp="label"
                                                    placeholder="Selecione para reaproveitar um produto já cadastrado"
                                                    options={productsCatalog.map((product) => ({
                                                        value: String(product.id),
                                                        label: product.name,
                                                    }))}
                                                />
                                                <InputError message={errors[`items.${currentItemIndex}.product_id`]} className="mt-2" />
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <InputLabel htmlFor={`items.${currentItemIndex}.quantity`} value="Quantidade importada" />
                                                    <input
                                                        id={`items.${currentItemIndex}.quantity`}
                                                        type="number"
                                                        min={currentPreviewItem.is_discount ? '0' : '0.001'}
                                                        step="0.001"
                                                        value={currentItemState.quantity}
                                                        onChange={(event) => updateItem(currentItemIndex, 'quantity', event.target.value)}
                                                        className={inputClassName}
                                                    />
                                                    <InputError message={errors[`items.${currentItemIndex}.quantity`]} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor={`items.${currentItemIndex}.unit`} value="Unidade" />
                                                    <Select
                                                        id={`items.${currentItemIndex}.unit`}
                                                        value={currentItemState.unit}
                                                        onChange={(value) => updateItem(currentItemIndex, 'unit', value)}
                                                        className="mt-2 w-full"
                                                        size={controlSize}
                                                        options={productUnitOptions.length > 0 ? productUnitOptions : importUnits}
                                                    />
                                                    <InputError message={errors[`items.${currentItemIndex}.unit`]} className="mt-2" />
                                                </div>
                                            </div>

                                            {!currentPreviewItem.is_discount && !currentItemState.product_id ? (
                                                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Novo produto</p>
                                                            <p className="mt-2 text-lg font-semibold text-slate-900">Cadastre com todos os dados do item</p>
                                                        </div>

                                                        <SecondaryButton type="button" onClick={openCategoryModal} className={compactButtonClassName}>
                                                            Nova categoria
                                                        </SecondaryButton>
                                                    </div>

                                                    <ProductFormFields
                                                        data={{
                                                            category_id: currentItemState.category_id,
                                                            name: currentItemState.product_name,
                                                            brand: currentItemState.brand,
                                                            sku: currentItemState.sku,
                                                            unit: currentItemState.unit,
                                                            type: currentItemState.type,
                                                            minimum_stock: currentItemState.minimum_stock,
                                                            notes: currentItemState.notes,
                                                        }}
                                                        errors={{
                                                            category_id: errors[`items.${currentItemIndex}.category_id`],
                                                            name: errors[`items.${currentItemIndex}.product_name`],
                                                            brand: errors[`items.${currentItemIndex}.brand`],
                                                            sku: errors[`items.${currentItemIndex}.sku`],
                                                            unit: errors[`items.${currentItemIndex}.unit`],
                                                            type: errors[`items.${currentItemIndex}.type`],
                                                            minimum_stock: errors[`items.${currentItemIndex}.minimum_stock`],
                                                            notes: errors[`items.${currentItemIndex}.notes`],
                                                        }}
                                                        categories={categoriesCatalog}
                                                        units={productUnitOptions.length > 0 ? productUnitOptions : importUnits}
                                                        idPrefix={`import_item_${currentItemIndex}`}
                                                        onFieldChange={(field, value) => {
                                                            const mappedField = field === 'name' ? 'product_name' : field;
                                                            updateItem(currentItemIndex, mappedField as keyof ItemFormState, value);
                                                        }}
                                                    />
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                                            Este item será ignorado na importação da nota fiscal.
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="border-t border-slate-200 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="text-sm text-slate-500">
                                {isPaymentStep ? (
                                    <span>{preview.total_items} itens na nota • {formatCurrency(preview.total_amount)}</span>
                                ) : (
                                    <span>
                                        Item {currentStep} de {preview.items.length} • {includedItems.length} itens incluidos • {formatCurrency(includedTotal)}
                                    </span>
                                )}
                            </div>

                            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-3">
                                {!isPaymentStep ? (
                                    <SecondaryButton type="button" onClick={handleBack} className={`w-full sm:w-auto ${compactButtonClassName}`}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <ChevronLeft className="h-3 w-3" />
                                            <span>Voltar</span>
                                        </span>
                                    </SecondaryButton>
                                ) : null}

                                {!isLastStep ? (
                                    <PrimaryButton type="button" onClick={handleAdvance} className={`${isPaymentStep ? 'col-start-2' : ''} w-full sm:w-auto ${compactButtonClassName}`}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <ChevronRight className="h-3 w-3" />
                                            <span>{isMobile ? 'Avançar' : 'Avançar'}</span>
                                        </span>
                                    </PrimaryButton>
                                ) : (
                                    <PrimaryButton disabled={processing} className={`col-span-2 w-full sm:w-auto ${compactButtonClassName}`}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Check className="h-3 w-3" />
                                            <span>{isMobile ? 'Importar nota' : 'Importar nota fiscal'}</span>
                                        </span>
                                    </PrimaryButton>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                onSubmit={submitAccountModal}
                processing={isCreatingAccount}
                data={accountModalData}
                errors={accountModalErrors}
                onFieldChange={(field, value) => setAccountModalData((current) => ({ ...current, [field]: value }))}
                title="Nova conta"
                description="Crie uma conta sem sair da importação da NFC-e."
                saveLabel="Criar conta"
                idPrefix="import_account"
            />

            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSubmit={submitCategoryModal}
                processing={isCreatingCategory}
                data={categoryModalData}
                errors={categoryModalErrors}
                onFieldChange={(field, value) => setCategoryModalData((current) => ({ ...current, [field]: value }))}
                title="Nova categoria"
                description="Crie uma categoria sem sair da revisao da NFC-e."
                saveLabel="Criar categoria"
                idPrefix="import_category"
            />
        </>
    );
}
