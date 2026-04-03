import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import LabeledSelectField from '@/Components/form-fields/LabeledSelectField';
import LabeledTextAreaField from '@/Components/form-fields/LabeledTextAreaField';

type ProductFormData = {
    category_id: string;
    name: string;
    brand: string;
    sku: string;
    unit: string;
    type: string;
    minimum_stock: string;
    notes: string;
};

interface ProductFormFieldsProps {
    data: ProductFormData;
    errors: Record<string, string | undefined>;
    categories: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    units: Array<{
        value: string;
        label: string;
    }>;
    idPrefix?: string;
    onFieldChange: <K extends keyof ProductFormData>(
        field: K,
        value: ProductFormData[K],
    ) => void;
}

export default function ProductFormFields({
    data,
    errors,
    categories,
    units,
    idPrefix = '',
    onFieldChange,
}: ProductFormFieldsProps) {
    const id = (field: keyof ProductFormData) =>
        idPrefix ? `${idPrefix}_${field}` : field;

    return (
        <>
            <LabeledInputField
                id={id('name')}
                label="Nome"
                value={data.name}
                onChange={(value) => onFieldChange('name', value)}
                error={errors.name}
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInputField
                    id={id('brand')}
                    label="Marca"
                    value={data.brand}
                    onChange={(value) => onFieldChange('brand', value)}
                />

                <LabeledInputField
                    id={id('sku')}
                    label="SKU ou código"
                    value={data.sku}
                    onChange={(value) => onFieldChange('sku', value)}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                    <LabeledSelectField
                        id={id('category_id')}
                        label="Categoria"
                        value={data.category_id || undefined}
                        onChange={(value) => onFieldChange('category_id', value)}
                        placeholder="Sem categoria"
                        allowClear
                        options={categories.map((category) => ({
                            value: String(category.id),
                            label: category.name,
                        }))}
                        error={errors.category_id}
                    />
                </div>

                <LabeledSelectField
                    id={id('unit')}
                    label="Unidade"
                    value={data.unit}
                    onChange={(value) => onFieldChange('unit', value)}
                    options={units.map((unit) => ({
                        value: unit.value,
                        label: unit.label,
                    }))}
                    error={errors.unit}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <LabeledSelectField
                    id={id('type')}
                    label="Tipo"
                    value={data.type}
                    onChange={(value) => onFieldChange('type', value)}
                    options={[
                        { value: 'stockable', label: 'Estocável' },
                        { value: 'non_stockable', label: 'Não estocável' },
                    ]}
                    error={errors.type}
                />

                <LabeledInputField
                    id={id('minimum_stock')}
                    label="Estoque minimo"
                    type="number"
                    min="0"
                    step="0.001"
                    value={data.minimum_stock}
                    onChange={(value) => onFieldChange('minimum_stock', value)}
                    error={errors.minimum_stock}
                />
            </div>

            <LabeledTextAreaField
                id={id('notes')}
                label="Observacoes"
                rows={5}
                value={data.notes}
                onChange={(value) => onFieldChange('notes', value)}
                error={errors.notes}
            />
        </>
    );
}