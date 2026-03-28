import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

type CategoryFormData = {
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
                    <InputLabel htmlFor={id('color')} value="Cor" />
                    <input
                        id={id('color')}
                        type="color"
                        value={data.color}
                        onChange={(event) =>
                            onFieldChange('color', event.target.value)
                        }
                        className="mt-2 block h-12 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white"
                    />
                    <InputError message={errors.color} className="mt-2" />
                </div>
            </div>

            <div>
                <InputLabel htmlFor={id('description')} value="Descrição" />
                <textarea
                    id={id('description')}
                    rows={5}
                    value={data.description}
                    onChange={(event) =>
                        onFieldChange('description', event.target.value)
                    }
                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                />
                <InputError message={errors.description} className="mt-2" />
            </div>
        </>
    );
}
