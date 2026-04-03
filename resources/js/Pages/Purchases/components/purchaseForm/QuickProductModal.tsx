import FormEntityModal from '@/Components/FormEntityModal';
import InputError from '@/Components/InputError';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import LabeledSelectField from '@/Components/form-fields/LabeledSelectField';
import type { CategoryOption } from '@/Pages/Purchases/components/purchaseForm/types';
import { FormEvent } from 'react';

interface QuickProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    errors: Record<string, string>;
    data: {
        name: string;
        category_id: string;
        unit: string;
        type: string;
    };
    categories?: CategoryOption[];
    setData: (updater: (current: { name: string; category_id: string; unit: string; type: string }) => {
        name: string;
        category_id: string;
        unit: string;
        type: string;
    }) => void;
}

export default function QuickProductModal({
    isOpen,
    onClose,
    onSubmit,
    processing,
    errors,
    data,
    categories,
    setData,
}: QuickProductModalProps) {
    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={processing}
            sectionLabel="Produtos"
            title="Cadastro rapido de produto"
            description="Crie o produto sem sair da compra. Ao salvar, ele será selecionado automaticamente."
            saveLabel="Criar produto"
            maxWidth="xl"
        >
            <LabeledInputField
                id="quick_product_name"
                label="Nome"
                value={data.name}
                onChange={(value) =>
                    setData((current) => ({
                        ...current,
                        name: value,
                    }))
                }
                error={errors.name}
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <LabeledSelectField
                    id="quick_product_category"
                    label="Categoria"
                    value={data.category_id || undefined}
                    onChange={(value) =>
                        setData((current) => ({
                            ...current,
                            category_id: value,
                        }))
                    }
                    options={(categories ?? []).map((category) => ({
                        value: String(category.id),
                        label: category.name,
                    }))}
                    placeholder="Sem categoria"
                    allowClear
                    error={errors.category_id}
                />

                <LabeledSelectField
                    id="quick_product_unit"
                    label="Unidade"
                    value={data.unit}
                    onChange={(value) =>
                        setData((current) => ({
                            ...current,
                            unit: value,
                        }))
                    }
                    options={[
                        { value: 'un', label: 'Unidade' },
                        { value: 'kg', label: 'Quilo' },
                        { value: 'g', label: 'Grama' },
                        { value: 'l', label: 'Litro' },
                        { value: 'ml', label: 'Mililitro' },
                        { value: 'cx', label: 'Caixa' },
                    ]}
                    error={errors.unit}
                />
            </div>

            <LabeledSelectField
                id="quick_product_type"
                label="Tipo"
                value={data.type}
                onChange={(value) =>
                    setData((current) => ({
                        ...current,
                        type: value,
                    }))
                }
                options={[
                    { value: 'stockable', label: 'Estocável' },
                    { value: 'non_stockable', label: 'Não estocável' },
                ]}
                error={errors.type}
            />

            <InputError message={errors.general} className="mt-2" />
        </FormEntityModal>
    );
}
