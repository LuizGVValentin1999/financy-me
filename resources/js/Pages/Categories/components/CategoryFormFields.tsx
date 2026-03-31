import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import LabeledTextAreaField from '@/Components/form-fields/LabeledTextAreaField';

type CategoryFormData = {
    code: string;
    name: string;
    color: string;
    description: string;
};

interface CategoryFormFieldsProps {
    data: CategoryFormData;
    errors: Record<string, string | undefined>;
    idPrefix?: string;
    onFieldChange: <K extends keyof CategoryFormData>(
        field: K,
        value: CategoryFormData[K],
    ) => void;
}

export default function CategoryFormFields({
    data,
    errors,
    idPrefix = '',
    onFieldChange,
}: CategoryFormFieldsProps) {
    const id = (field: keyof CategoryFormData) =>
        idPrefix ? `${idPrefix}_${field}` : field;

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-[1fr,150px]">
                <LabeledInputField
                    id={id('name')}
                    label="Nome"
                    value={data.name}
                    onChange={(value) => onFieldChange('name', value)}
                    error={errors.name}
                />

                <LabeledInputField
                    id={id('code')}
                    label="Código"
                    value={data.code}
                    onChange={(value) => onFieldChange('code', value)}
                    error={errors.code}
                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm"
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInputField
                    id={id('color')}
                    label="Cor"
                    type="color"
                    value={data.color}
                    onChange={(value) => onFieldChange('color', value)}
                    error={errors.color}
                    className="mt-2 block h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white"
                />
            </div>

            <LabeledTextAreaField
                id={id('description')}
                label="Descrição"
                rows={5}
                value={data.description}
                onChange={(value) => onFieldChange('description', value)}
                error={errors.description}
            />
        </>
    );
}