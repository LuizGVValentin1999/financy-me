import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useAntdApp } from '@/hooks/useAntdApp';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ImportNfceModal from '@/Pages/Purchases/components/ImportNfceModal';
import ImportPreviewSection from '@/Pages/Purchases/components/ImportPreviewSection';
import PurchaseFormModal from '@/Pages/Purchases/components/PurchaseFormModal';
import PurchaseHistoryTable from '@/Pages/Purchases/components/PurchaseHistoryTable';
import type { PurchasesPageProps } from '@/Pages/Purchases/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

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
    const { message } = useAntdApp();

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

    const handleProductCreated = (product: PurchasesPageProps['products'][number]) => {
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
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Compras</p>
                        <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
                            Registre entradas no estoque.
                        </h1>
                    </div>

                    <div className="grid gap-3 sm:flex sm:flex-wrap">
                        <SecondaryButton
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="w-full justify-center sm:w-auto"
                        >
                            Importar NFC-e
                        </SecondaryButton>
                        <PrimaryButton
                            type="button"
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="w-full justify-center sm:w-auto"
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

            <ImportNfceModal
                isOpen={isImportModalOpen}
                onClose={closeImportModal}
                receiptUrl={importForm.data.receipt_url}
                receiptUrlError={importForm.errors.receipt_url}
                processing={importForm.processing}
                onReceiptUrlChange={(value) => importForm.setData('receipt_url', value)}
                onQrCodeDetected={(value) => importForm.setData('receipt_url', value)}
                onSubmit={submitImport}
            />

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
