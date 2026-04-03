import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useAntdApp } from '@/hooks/useAntdApp';
import { useDependencyErrorNotification } from '@/hooks/useDependencyErrorNotification';
import { todayDateInputValue } from '@/lib/date';
import { formatCurrency } from '@/lib/format';
import AccountModal from '@/Pages/Accounts/components/AccountModal';
import CategoryModal from '@/Pages/Categories/components/CategoryModal';
import type { PurchasesPageProps } from '@/Pages/Purchases/types';
import ProductFormFields from '@/Pages/Products/components/ProductFormFields';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { DatePicker, Grid, Select } from 'antd';
import dayjs from 'dayjs';
import { Check, ChevronLeft, ChevronRight, Plus, Wallet, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type ProductOption = PurchasesPageProps['products'][number];
type CategoryOption = PurchasesPageProps['categories'][number];
type AccountOption = PurchasesPageProps['accounts'][number];

type InvoiceState = {
    has_invoice: boolean;
    issued_at: string;
    store_name: string;
    cnpj: string;
    invoice_number: string;
    series: string;
    access_key: string;
};

type ItemState = {
    product_id: string;
    product_name: string;
    brand: string;
    sku: string;
    quantity: string;
    unit_price: string;
    category_id: string;
    unit: string;
    type: string;
    minimum_stock: string;
    notes: string;
};

type PaymentState = {
    account_id: string;
    type: 'cash' | 'installment';
    principal_amount: string;
    first_due_date: string;
    installments: string;
    interest_type: 'rate' | 'fixed_installment';
    interest_rate: string;
    installment_amount: string;
};

const productUnitOptions = [
    { value: 'un', label: 'Unidade' },
    { value: 'kg', label: 'Quilo' },
    { value: 'g', label: 'Grama' },
    { value: 'l', label: 'Litro' },
    { value: 'ml', label: 'Mililitro' },
    { value: 'cx', label: 'Caixa' },
];

const buildEmptyItem = (): ItemState => ({
    product_id: '',
    product_name: '',
    brand: '',
    sku: '',
    quantity: '1',
    unit_price: '0',
    category_id: '',
    unit: 'un',
    type: 'stockable',
    minimum_stock: '0',
    notes: '',
});

const buildEmptyPayment = (firstAccountId: string, issuedAt: string, principalAmount = '0'): PaymentState => ({
    account_id: firstAccountId,
    type: 'cash',
    principal_amount: principalAmount,
    first_due_date: issuedAt,
    installments: '12',
    interest_type: 'rate',
    interest_rate: '1',
    installment_amount: '',
});

const calculateEstimatedFinancialTotal = (payments: PaymentState[]) =>
    payments.reduce((total, payment) => {
        const principal = Number(payment.principal_amount) || 0;

        if (payment.type !== 'installment') {
            return total + principal;
        }

        const installments = Math.max(2, Number(payment.installments) || 2);

        if (payment.interest_type === 'fixed_installment') {
            return total + ((Number(payment.installment_amount) || 0) * installments);
        }

        const rate = (Number(payment.interest_rate) || 0) / 100;

        if (rate <= 0) {
            return total + principal;
        }

        const factor = Math.pow(1 + rate, installments);
        const installmentAmount = principal * ((rate * factor) / (factor - 1));

        return total + installmentAmount * installments;
    }, 0);

const getStepLabel = (stepIndex: number, items: ItemState[], totalSteps: number) => {
    if (stepIndex === 0) {
        return 'Nota fiscal';
    }

    if (stepIndex === totalSteps - 1) {
        return 'Pagamento';
    }

    const item = items[stepIndex - 1];
    const name = item?.product_name?.trim();

    return name !== '' ? name : `Produto ${stepIndex}`;
};

export default function ManualPurchaseWizardModal({
    isOpen,
    onClose,
    products,
    categories,
    accounts,
}: {
    isOpen: boolean;
    onClose: () => void;
    products: PurchasesPageProps['products'];
    categories: PurchasesPageProps['categories'];
    accounts: PurchasesPageProps['accounts'];
}) {
    const { message } = useAntdApp();
    const [productsCatalog, setProductsCatalog] = useState(products);
    const [categoriesCatalog, setCategoriesCatalog] = useState(categories);
    const [accountsCatalog, setAccountsCatalog] = useState(accounts);
    const [currentStep, setCurrentStep] = useState(0);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [accountModalData, setAccountModalData] = useState({
        code: '',
        name: '',
        initial_balance: '0',
        initial_balance_date: todayDateInputValue(),
    });
    const [categoryModalData, setCategoryModalData] = useState({
        code: '',
        name: '',
        color: '#6F8EA8',
        description: '',
    });
    const [accountModalErrors, setAccountModalErrors] = useState<Record<string, string | undefined>>({});
    const [categoryModalErrors, setCategoryModalErrors] = useState<Record<string, string | undefined>>({});
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;

    const firstAccountId = accountsCatalog[0] ? String(accountsCatalog[0].id) : '';
    const today = todayDateInputValue();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        invoice: {
            has_invoice: false,
            issued_at: today,
            store_name: '',
            cnpj: '',
            invoice_number: '',
            series: '',
            access_key: '',
        } as InvoiceState,
        items: [buildEmptyItem()] as ItemState[],
        payments: [buildEmptyPayment(firstAccountId, today)] as PaymentState[],
    });

    useEffect(() => {
        setProductsCatalog(products);
    }, [products]);

    useEffect(() => {
        setCategoriesCatalog(categories);
    }, [categories]);

    useEffect(() => {
        setAccountsCatalog(accounts);
    }, [accounts]);

    const resetWizard = () => {
        const issuedAt = todayDateInputValue();

        reset();
        setData({
            invoice: {
                has_invoice: false,
                issued_at: issuedAt,
                store_name: '',
                cnpj: '',
                invoice_number: '',
                series: '',
                access_key: '',
            },
            items: [buildEmptyItem()],
            payments: [buildEmptyPayment(accounts[0] ? String(accounts[0].id) : '', issuedAt)],
        });
        clearErrors();
        setCurrentStep(0);
    };

    useEffect(() => {
        if (!isOpen) {
            resetWizard();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        setAccountModalData((current) => ({
            ...current,
            initial_balance_date: data.invoice.issued_at,
        }));
    }, [data.invoice.issued_at]);

    const itemsTotal = useMemo(
        () => data.items.reduce((total, item) => total + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0),
        [data.items],
    );
    const paymentsPrincipalTotal = useMemo(
        () => data.payments.reduce((total, payment) => total + (Number(payment.principal_amount) || 0), 0),
        [data.payments],
    );
    const estimatedFinancialTotal = useMemo(
        () => calculateEstimatedFinancialTotal(data.payments),
        [data.payments],
    );

    useEffect(() => {
        if (data.payments.length !== 1) {
            return;
        }

        setData('payments', [
            {
                ...data.payments[0],
                principal_amount: itemsTotal > 0 ? itemsTotal.toFixed(2) : '0',
            },
        ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsTotal]);

    useDependencyErrorNotification(errors, {
        dependencyPatterns: [/^payments\./, /^invoice\./, /^items\./],
        customMessage: 'Revise os dados obrigatorios antes de registrar a compra.',
    });

    useEffect(() => {
        const errorKeys = Object.keys(errors);

        if (errorKeys.some((key) => key.startsWith('invoice.'))) {
            setCurrentStep(0);
            return;
        }

        const itemError = errorKeys.find((key) => key.startsWith('items.'));
        if (itemError) {
            const match = itemError.match(/^items\.(\d+)\./);
            if (match) {
                setCurrentStep(Number(match[1]) + 1);
                return;
            }
        }

        if (errorKeys.some((key) => key === 'payments' || key.startsWith('payments.'))) {
            setCurrentStep(data.items.length + 1);
        }
    }, [data.items.length, errors]);

    const totalSteps = data.items.length + 2;
    const controlSize = isMobile ? 'middle' : 'large';
    const inputClassName = 'mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm sm:px-4 sm:py-3';
    const compactButtonClassName = 'h-9 px-3 text-[11px] sm:h-12 sm:px-5 sm:text-sm';

    const isInvoiceStep = currentStep === 0;
    const isPaymentStep = currentStep === totalSteps - 1;
    const currentItemIndex = Math.max(0, currentStep - 1);
    const currentItem = data.items[currentItemIndex] ?? null;
    const visibleStepIndexes = Array.from({ length: Math.min(3, totalSteps - currentStep) }, (_, index) => currentStep + index);
    const hasHiddenPreviousSteps = currentStep > 0;
    const hasHiddenNextSteps = visibleStepIndexes[visibleStepIndexes.length - 1] < totalSteps - 1;

    const updateInvoice = (key: keyof InvoiceState, value: boolean | string) => {
        setData('invoice', { ...data.invoice, [key]: value });
    };

    const updateItem = (index: number, key: keyof ItemState, value: string) => {
        const nextItems = data.items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, [key]: value } : item,
        );

        if (key === 'product_id') {
            const selectedProduct = productsCatalog.find((product) => String(product.id) === value);

            if (selectedProduct) {
                nextItems[index] = {
                    ...nextItems[index],
                    product_id: value,
                    product_name: selectedProduct.name,
                    category_id: selectedProduct.category_id ? String(selectedProduct.category_id) : '',
                    unit: selectedProduct.unit,
                    type: selectedProduct.current_stock >= 0 ? nextItems[index].type : 'stockable',
                };
            } else {
                nextItems[index] = {
                    ...nextItems[index],
                    product_id: '',
                    product_name: '',
                    category_id: '',
                    brand: '',
                    sku: '',
                    unit: 'un',
                    type: 'stockable',
                    minimum_stock: '0',
                    notes: '',
                };
            }
        }

        setData('items', nextItems);
    };

    const addItem = () => {
        const nextItems = [...data.items, buildEmptyItem()];
        setData('items', nextItems);
        setCurrentStep(nextItems.length);
    };

    const updatePayment = (index: number, key: keyof PaymentState, value: string) => {
        setData(
            'payments',
            data.payments.map((payment, paymentIndex) =>
                paymentIndex === index ? { ...payment, [key]: value } : payment,
            ),
        );
    };

    const addPayment = () => {
        setData('payments', [...data.payments, buildEmptyPayment(firstAccountId, data.invoice.issued_at)]);
    };

    const removePayment = (index: number) => {
        if (data.payments.length <= 1) {
            return;
        }

        setData('payments', data.payments.filter((_, paymentIndex) => paymentIndex !== index));
    };

    const openAccountModal = () => {
        setAccountModalErrors({});
        setAccountModalData({
            code: '',
            name: '',
            initial_balance: '0',
            initial_balance_date: data.invoice.issued_at,
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

            if (currentItem) {
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

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.store'), {
            preserveScroll: true,
            onSuccess: () => {
                message.success('Compra manual registrada com sucesso!');
                onClose();
                resetWizard();
            },
            onError: () => message.error('Revise os dados da compra manual antes de salvar.'),
        });
    };

    const renderInvoiceStep = () => (
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resumo da compra</p>
                <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Data</p>
                        <p className="mt-2 font-semibold text-slate-900">{dayjs(data.invoice.issued_at).format('DD/MM/YYYY')}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Itens</p>
                        <p className="mt-2 font-semibold text-slate-900">{data.items.length}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Valor previsto</p>
                        <p className="mt-2 font-semibold text-slate-900">{formatCurrency(itemsTotal)}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pagamentos</p>
                        <p className="mt-2 font-semibold text-slate-900">{data.payments.length}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Etapa 1</p>
                    <p className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">Dados da compra</p>
                    <p className="mt-1 text-sm text-slate-500">Defina a data da compra e informe os dados da nota fiscal, se houver.</p>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="manual_invoice_issued_at" value="Data da compra" />
                            <DatePicker
                                id="manual_invoice_issued_at"
                                value={data.invoice.issued_at ? dayjs(data.invoice.issued_at) : null}
                                format="DD/MM/YYYY"
                                size={controlSize}
                                onChange={(date) => updateInvoice('issued_at', date ? date.format('YYYY-MM-DD') : '')}
                                className="mt-2 w-full"
                            />
                            <InputError message={errors['invoice.issued_at']} className="mt-2" />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 sm:px-4 sm:py-3">
                                <input
                                    type="checkbox"
                                    checked={data.invoice.has_invoice}
                                    onChange={(event) => updateInvoice('has_invoice', event.target.checked)}
                                />
                                Esta compra tem nota fiscal
                            </label>
                        </div>
                    </div>

                    {data.invoice.has_invoice ? (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="manual_invoice_store_name" value="Estabelecimento" />
                                <input
                                    id="manual_invoice_store_name"
                                    type="text"
                                    value={data.invoice.store_name}
                                    onChange={(event) => updateInvoice('store_name', event.target.value)}
                                    className={inputClassName}
                                />
                                <InputError message={errors['invoice.store_name']} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="manual_invoice_cnpj" value="CNPJ" />
                                <input
                                    id="manual_invoice_cnpj"
                                    type="text"
                                    value={data.invoice.cnpj}
                                    onChange={(event) => updateInvoice('cnpj', event.target.value)}
                                    className={inputClassName}
                                />
                                <InputError message={errors['invoice.cnpj']} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="manual_invoice_number" value="Número da nota" />
                                <input
                                    id="manual_invoice_number"
                                    type="text"
                                    value={data.invoice.invoice_number}
                                    onChange={(event) => updateInvoice('invoice_number', event.target.value)}
                                    className={inputClassName}
                                />
                                <InputError message={errors['invoice.invoice_number']} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="manual_invoice_series" value="Serie" />
                                <input
                                    id="manual_invoice_series"
                                    type="text"
                                    value={data.invoice.series}
                                    onChange={(event) => updateInvoice('series', event.target.value)}
                                    className={inputClassName}
                                />
                                <InputError message={errors['invoice.series']} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="manual_invoice_access_key" value="Chave de acesso" />
                                <input
                                    id="manual_invoice_access_key"
                                    type="text"
                                    value={data.invoice.access_key}
                                    onChange={(event) => updateInvoice('access_key', event.target.value)}
                                    className={inputClassName}
                                />
                                <InputError message={errors['invoice.access_key']} className="mt-2" />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );

    const renderItemStep = () => {
        if (!currentItem) {
            return null;
        }

        const itemTotal = (Number(currentItem.quantity) || 0) * (Number(currentItem.unit_price) || 0);

        return (
            <div className="w-full space-y-4 sm:space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Etapa {currentStep + 1} de {totalSteps}</p>
                        <p className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">Produto da compra</p>
                        <p className="mt-1 text-sm text-slate-500">Adicione um produto por vez e defina os dados necessarios antes de seguir.</p>
                    </div>

                    <div className="rounded-full bg-[#eef7f7] px-3 py-1.5 text-xs font-semibold text-slate-700 sm:px-4 sm:py-2 sm:text-sm">
                        {formatCurrency(itemTotal)}
                    </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div>
                        <InputLabel htmlFor={`manual_item_${currentItemIndex}_product_id`} value="Produto existente" />
                        <Select
                            id={`manual_item_${currentItemIndex}_product_id`}
                            value={currentItem.product_id || undefined}
                            onChange={(value) => updateItem(currentItemIndex, 'product_id', (value ?? '') as string)}
                            className="mt-2 w-full"
                            size={controlSize}
                            showSearch
                            allowClear
                            optionFilterProp="label"
                            placeholder="Pesquise por nome do produto"
                            options={productsCatalog.map((product) => ({
                                value: String(product.id),
                                label: product.name,
                            }))}
                        />
                        <InputError message={errors[`items.${currentItemIndex}.product_id`]} className="mt-2" />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor={`manual_item_${currentItemIndex}_quantity`} value="Quantidade" />
                            <input
                                id={`manual_item_${currentItemIndex}_quantity`}
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={currentItem.quantity}
                                onChange={(event) => updateItem(currentItemIndex, 'quantity', event.target.value)}
                                className={inputClassName}
                            />
                            <InputError message={errors[`items.${currentItemIndex}.quantity`]} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor={`manual_item_${currentItemIndex}_unit_price`} value="Preco unitario" />
                            <input
                                id={`manual_item_${currentItemIndex}_unit_price`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={currentItem.unit_price}
                                onChange={(event) => updateItem(currentItemIndex, 'unit_price', event.target.value)}
                                className={inputClassName}
                            />
                            <InputError message={errors[`items.${currentItemIndex}.unit_price`]} className="mt-2" />
                        </div>
                    </div>
                </div>

                {!currentItem.product_id ? (
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Novo produto</p>
                                <p className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">Cadastre o produto durante o lançamento</p>
                            </div>

                            <SecondaryButton type="button" onClick={openCategoryModal} className={compactButtonClassName}>
                                Nova categoria
                            </SecondaryButton>
                        </div>

                        <ProductFormFields
                            data={{
                                category_id: currentItem.category_id,
                                name: currentItem.product_name,
                                brand: currentItem.brand,
                                sku: currentItem.sku,
                                unit: currentItem.unit,
                                type: currentItem.type,
                                minimum_stock: currentItem.minimum_stock,
                                notes: currentItem.notes,
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
                            units={productUnitOptions}
                            idPrefix={`manual_item_${currentItemIndex}`}
                            onFieldChange={(field, value) => {
                                const mappedField = field === 'name' ? 'product_name' : field;
                                updateItem(currentItemIndex, mappedField as keyof ItemState, value);
                            }}
                        />
                    </div>
                ) : null}
            </div>
        );
    };

    const renderPaymentStep = () => (
        <div className="w-full space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Etapa final</p>
                    <p className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">Pagamento da compra</p>
                    <p className="mt-1 text-sm text-slate-500">Escolha ou crie contas, distribua o valor e defina parcelamentos.</p>
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
                    <div key={`manual-payment-${paymentIndex}`} className="rounded-[24px] border border-slate-200 bg-slate-50 p-3 sm:p-4">
                        <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr,1fr,1fr]">
                            <div>
                                <InputLabel htmlFor={`manual_payments_${paymentIndex}_account_id`} value="Conta" />
                                <Select
                                    id={`manual_payments_${paymentIndex}_account_id`}
                                    value={payment.account_id || undefined}
                                    onChange={(value) => updatePayment(paymentIndex, 'account_id', (value ?? '') as string)}
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
                                <InputLabel htmlFor={`manual_payments_${paymentIndex}_type`} value="Tipo" />
                                <Select
                                    id={`manual_payments_${paymentIndex}_type`}
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
                                <InputLabel htmlFor={`manual_payments_${paymentIndex}_principal_amount`} value="Valor principal" />
                                <input
                                    id={`manual_payments_${paymentIndex}_principal_amount`}
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
                                <InputLabel htmlFor={`manual_payments_${paymentIndex}_first_due_date`} value="Data" />
                                <DatePicker
                                    id={`manual_payments_${paymentIndex}_first_due_date`}
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
                                    <InputLabel htmlFor={`manual_payments_${paymentIndex}_installments`} value="Parcelas" />
                                    <input
                                        id={`manual_payments_${paymentIndex}_installments`}
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
                                    <InputLabel htmlFor={`manual_payments_${paymentIndex}_interest_type`} value="Juros" />
                                    <Select
                                        id={`manual_payments_${paymentIndex}_interest_type`}
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
                                            <InputLabel htmlFor={`manual_payments_${paymentIndex}_installment_amount`} value="Valor da parcela" />
                                            <input
                                                id={`manual_payments_${paymentIndex}_installment_amount`}
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
                                            <InputLabel htmlFor={`manual_payments_${paymentIndex}_interest_rate`} value="Juros (%)" />
                                            <input
                                                id={`manual_payments_${paymentIndex}_interest_rate`}
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
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Valor da compra</p>
                        <p className="mt-2 font-semibold text-slate-900">{formatCurrency(itemsTotal)}</p>
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
    );

    return (
        <>
            <Modal show={isOpen} onClose={onClose} maxWidth="screen">
                <form noValidate onSubmit={handleSubmit} className="flex max-h-[95dvh] flex-col overflow-hidden bg-white sm:max-h-[95vh]">
                    <div className="border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                        <div className="flex items-start justify-between gap-2 sm:flex-wrap sm:gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.24em]">Compra manual</p>
                                <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">Lançamento em etapas</h2>
                                <p className="mt-1 hidden text-sm leading-5 text-slate-500 sm:mt-2 sm:block sm:leading-6">
                                    Defina a compra, adicione os produtos um por um e finalize no pagamento.
                                </p>
                            </div>

                            <DangerButton type="button" onClick={resetWizard} className={compactButtonClassName}>
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
                                <button
                                    key={`manual-step-${stepIndex}`}
                                    type="button"
                                    onClick={() => setCurrentStep(stepIndex)}
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] sm:px-3 sm:text-xs sm:tracking-[0.18em] ${currentStep === stepIndex ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {stepIndex + 1}. {getStepLabel(stepIndex, data.items, totalSteps)}
                                </button>
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
                            {isInvoiceStep ? renderInvoiceStep() : isPaymentStep ? renderPaymentStep() : renderItemStep()}
                        </div>
                    </div>

                    <div className="border-t border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="text-sm text-slate-500">
                                {isPaymentStep ? (
                                    <span>{data.items.length} produtos • {formatCurrency(itemsTotal)}</span>
                                ) : isInvoiceStep ? (
                                    <span>Comece definindo a data e a nota fiscal, se houver.</span>
                                ) : (
                                    <span>Produto {currentItemIndex + 1} de {data.items.length} • Total parcial {formatCurrency(itemsTotal)}</span>
                                )}
                            </div>

                            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-3">
                                {isInvoiceStep ? (
                                    <>
                                        <SecondaryButton type="button" onClick={onClose} className={`w-full sm:w-auto ${compactButtonClassName}`}>
                                            <span className="inline-flex items-center gap-1.5">
                                                <X className="h-3 w-3" />
                                                <span>Cancelar</span>
                                            </span>
                                        </SecondaryButton>
                                        <PrimaryButton type="button" onClick={() => setCurrentStep(1)} className={`w-full sm:w-auto ${compactButtonClassName}`}>
                                            <span className="inline-flex items-center gap-1.5">
                                                <ChevronRight className="h-3 w-3" />
                                                <span>{isMobile ? 'Produtos' : 'Avançar para produtos'}</span>
                                            </span>
                                        </PrimaryButton>
                                    </>
                                ) : isPaymentStep ? (
                                    <>
                                        <SecondaryButton type="button" onClick={() => setCurrentStep(Math.max(data.items.length, 1))} className={`w-full sm:w-auto ${compactButtonClassName}`}>
                                            <span className="inline-flex items-center gap-1.5">
                                                <ChevronLeft className="h-3 w-3" />
                                                <span>Voltar</span>
                                            </span>
                                        </SecondaryButton>
                                        <PrimaryButton disabled={processing} className={`w-full sm:w-auto ${compactButtonClassName}`}>
                                            <span className="inline-flex items-center gap-1.5">
                                                <Check className="h-3 w-3" />
                                                <span>{isMobile ? 'Registrar' : 'Registrar compra'}</span>
                                            </span>
                                        </PrimaryButton>
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-2 flex w-full items-center gap-2 sm:w-auto sm:flex-wrap sm:justify-end sm:gap-3">
                                            <SecondaryButton
                                                type="button"
                                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                                className={`w-9 min-w-9 !px-0 sm:w-auto sm:min-w-0 sm:!px-5 ${compactButtonClassName}`}
                                            >
                                                <span className="inline-flex items-center gap-1.5">
                                                    <ChevronLeft className="h-3 w-3" />
                                                    <span className="hidden sm:inline">Voltar</span>
                                                </span>
                                            </SecondaryButton>

                                            <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
                                                {currentItemIndex < data.items.length - 1 ? (
                                                    <SecondaryButton type="button" onClick={() => setCurrentStep(currentStep + 1)} className={`col-span-2 w-full sm:col-auto sm:w-auto ${compactButtonClassName}`}>
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <ChevronRight className="h-3 w-3" />
                                                            <span>{isMobile ? 'Próximo' : 'Próximo produto'}</span>
                                                        </span>
                                                    </SecondaryButton>
                                                ) : null}

                                                <SecondaryButton type="button" onClick={addItem} className={`w-full sm:w-auto ${compactButtonClassName}`}>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Plus className="h-3 w-3" />
                                                        <span>{isMobile ? 'Adicionar' : 'Adicionar mais um produto'}</span>
                                                    </span>
                                                </SecondaryButton>

                                                <PrimaryButton type="button" onClick={() => setCurrentStep(totalSteps - 1)} className={`w-full sm:w-auto ${compactButtonClassName}`}>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Wallet className="h-3 w-3" />
                                                        <span>{isMobile ? 'Pagamento' : 'Ir para pagamento'}</span>
                                                    </span>
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </>
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
                description="Crie uma conta sem sair do lançamento manual."
                saveLabel="Criar conta"
                idPrefix="manual_purchase_account"
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
                description="Crie uma categoria sem sair do produto."
                saveLabel="Criar categoria"
                idPrefix="manual_purchase_category"
            />
        </>
    );
}
