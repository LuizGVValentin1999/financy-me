import FormEntityModal from '@/Components/FormEntityModal';
import ProductFormFields from '@/Pages/Products/components/ProductFormFields';
import type { ProductsPageProps } from '@/Pages/Products/types';
import { FormEvent } from 'react';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    data: {
        category_id: string;
        name: string;
        brand: string;
        sku: string;
        unit: string;
        type: string;
        minimum_stock: string;
        notes: string;
    };
    errors: Record<string, string | undefined>;
    onFieldChange: (
        field:
            | 'category_id'
            | 'name'
            | 'brand'
            | 'sku'
            | 'unit'
            | 'type'
            | 'minimum_stock'
            | 'notes',
        value: string,
    ) => void;
    title: string;
    description: string;
    saveLabel: string;
    categories: ProductsPageProps['categories'];
    units: ProductsPageProps['units'];
    onDelete?: () => void;
    idPrefix?: string;
}

export default function ProductModal({
    isOpen,
    onClose,
    onSubmit,
    processing,
    data,
    errors,
    onFieldChange,
    title,
    description,
    saveLabel,
    categories,
    units,
    onDelete,
    idPrefix,
}: ProductModalProps) {
    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={processing}
            sectionLabel="Produtos"
            title={title}
            description={description}
            saveLabel={saveLabel}
            onDelete={onDelete}
        >
            <ProductFormFields
                data={data}
                errors={errors}
                categories={categories}
                units={units}
                idPrefix={idPrefix}
                onFieldChange={onFieldChange}
            />
        </FormEntityModal>
    );
}
