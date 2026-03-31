import LabeledInputField from '@/Components/form-fields/LabeledInputField';

type AccountFormData = {
    code: string;
    name: string;
    initial_balance: string;
    initial_balance_date: string;
};

interface AccountFormFieldsProps {
    data: AccountFormData;
    errors: Record<string, string | undefined>;
    idPrefix?: string;
    onFieldChange: <K extends keyof AccountFormData>(
        field: K,
        value: AccountFormData[K],
    ) => void;
}

export default function AccountFormFields({
    data,
    errors,
    idPrefix = '',
    onFieldChange,
}: AccountFormFieldsProps) {
    const id = (field: keyof AccountFormData) =>
        idPrefix ? `${idPrefix}_${field}` : field;

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-[1fr,150px]">
                <LabeledInputField
                    id={id('name')}
                    label="Nome da Conta"
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
                    id={id('initial_balance')}
                    label="Saldo Inicial"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.initial_balance}
                    onChange={(value) => onFieldChange('initial_balance', value)}
                    error={errors.initial_balance}
                />

                <LabeledInputField
                    id={id('initial_balance_date')}
                    label="Data do Saldo"
                    type="date"
                    value={data.initial_balance_date}
                    onChange={(value) => onFieldChange('initial_balance_date', value)}
                    error={errors.initial_balance_date}
                />
            </div>
        </>
    );
}