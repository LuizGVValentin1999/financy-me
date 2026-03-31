import FormModalActions from '@/Components/FormModalActions';
import FormEntityModal from '@/Components/FormEntityModal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PurchaseMainFields from '@/Pages/Purchases/components/purchaseForm/PurchaseMainFields';
import QuickProductModal from '@/Pages/Purchases/components/purchaseForm/QuickProductModal';
import type {
    AccountOption,
    CategoryOption,
    ProductOption,
    SourceOption,
} from '@/Pages/Purchases/components/purchaseForm/types';
import axios from 'axios';
import { FormEvent, useState } from 'react';

interface PurchaseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
    products: ProductOption[];
    categories?: CategoryOption[];
    sources: SourceOption[];
    accounts: AccountOption[];
    formData: Record<string, string>;
    setFormData: (key: string, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    errors: Record<string, string>;
    onDelete?: () => void;
    onProductCreated?: (product: ProductOption) => void;
}

export default function PurchaseFormModal({
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
}: PurchaseFormModalProps) {
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

            const createdProduct = response.data.product as ProductOption;

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
            <FormEntityModal
                isOpen={isOpen}
                onClose={onClose}
                onSubmit={onSubmit}
                processing={processing}
                sectionLabel="Compras"
                title={isEditing ? 'Editar registro' : 'Nova compra manual'}
                description={
                    isEditing
                        ? 'Ajuste o produto, a quantidade e os valores. O estoque sera recalculado automaticamente.'
                        : 'Pesquise o produto para agilizar o lancamento ou crie um novo sem sair desta tela.'
                }
                saveLabel="Salvar alteracoes"
                onDelete={onDelete}
                actions={
                    isEditing ? (
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
                            <PrimaryButton disabled={processing}>Registrar compra</PrimaryButton>
                        </div>
                    )
                }
            >
                <PurchaseMainFields
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    products={products}
                    accounts={accounts}
                    sources={sources}
                    onProductSearch={setProductSearch}
                    onOpenQuickProductModal={openQuickProductModal}
                />
            </FormEntityModal>

            <QuickProductModal
                isOpen={isQuickProductModalOpen}
                onClose={() => setIsQuickProductModalOpen(false)}
                onSubmit={submitQuickProduct}
                processing={isQuickProductProcessing}
                errors={quickProductErrors}
                data={quickProductData}
                categories={categories}
                setData={setQuickProductData}
            />
        </>
    );
}
