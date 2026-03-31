import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { Select } from 'antd';

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
            <div>
                <InputLabel htmlFor={id('name')} value="Nome" />
                <input
                    id={id('name')}
                    type="text"
                    value={data.name}
                    onChange={(event) => onFieldChange('name', event.target.value)}
                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                />
                <InputError message={errors.name} className="mt-2" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor={id('brand')} value="Marca" />
                    <input
                        id={id('brand')}
                        type="text"
                        value={data.brand}
                        onChange={(event) =>
                            onFieldChange('brand', event.target.value)
                        }
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                </div>

                <div>
                    <InputLabel htmlFor={id('sku')} value="SKU ou codigo" />
                    <input
                        id={id('sku')}
                        type="text"
                        value={data.sku}
                        onChange={(event) => onFieldChange('sku', event.target.value)}
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                    <InputLabel htmlFor={id('category_id')} value="Categoria" />
                    <Select
                        id={id('category_id')}
                        value={data.category_id || undefined}
                        onChange={(value) =>
                            onFieldChange('category_id', (value ?? '') as string)
                        }
                        className="mt-2 w-full"
                        size="large"
                        allowClear
                        placeholder="Sem categoria"
                        options={categories
                            .map((category) => ({
                                value: String(category.id),
                                label: category.name,
                            }))}
                    />
                    <InputError message={errors.category_id} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor={id('unit')} value="Unidade" />
                    <Select
                        id={id('unit')}
                        value={data.unit}
                        onChange={(value) => onFieldChange('unit', value)}
                        className="mt-2 w-full"
                        size="large"
                        options={units.map((unit) => ({
                            value: unit.value,
                            label: unit.label,
                        }))}
                    />
                    <InputError message={errors.unit} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor={id('type')} value="Tipo" />
                    <Select
                        id={id('type')}
                        value={data.type}
                        onChange={(value) => onFieldChange('type', value)}
                        className="mt-2 w-full"
                        size="large"
                        options={[
                            { value: 'stockable', label: 'Estocável' },
                            { value: 'non_stockable', label: 'Não estocável' },
                        ]}
                    />
                    <InputError message={errors.type} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor={id('minimum_stock')} value="Estoque minimo" />
                    <input
                        id={id('minimum_stock')}
                        type="number"
                        min="0"
                        step="0.001"
                        value={data.minimum_stock}
                        onChange={(event) =>
                            onFieldChange('minimum_stock', event.target.value)
                        }
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                    <InputError message={errors.minimum_stock} className="mt-2" />
                </div>
            </div>

            <div>
                <InputLabel htmlFor={id('notes')} value="Observacoes" />
                <textarea
                    id={id('notes')}
                    rows={5}
                    value={data.notes}
                    onChange={(event) => onFieldChange('notes', event.target.value)}
                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                />
                <InputError message={errors.notes} className="mt-2" />
            </div>
        </>
    );
}
