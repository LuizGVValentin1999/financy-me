import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

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
                <div>
                    <InputLabel htmlFor={id('name')} value="Nome da Conta" />
                    <input
                        id={id('name')}
                        type="text"
                        value={data.name}
                        onChange={(event) => onFieldChange('name', event.target.value)}
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor={id('code')} value="Código" />
                    <input
                        id={id('code')}
                        type="text"
                        value={data.code}
                        onChange={(event) => onFieldChange('code', event.target.value)}
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm"
                    />
                    <InputError message={errors.code} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel
                        htmlFor={id('initial_balance')}
                        value="Saldo Inicial"
                    />
                    <input
                        id={id('initial_balance')}
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.initial_balance}
                        onChange={(event) =>
                            onFieldChange('initial_balance', event.target.value)
                        }
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                    <InputError message={errors.initial_balance} className="mt-2" />
                </div>

                <div>
                    <InputLabel
                        htmlFor={id('initial_balance_date')}
                        value="Data do Saldo"
                    />
                    <input
                        id={id('initial_balance_date')}
                        type="date"
                        value={data.initial_balance_date}
                        onChange={(event) =>
                            onFieldChange('initial_balance_date', event.target.value)
                        }
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                    <InputError
                        message={errors.initial_balance_date}
                        className="mt-2"
                    />
                </div>
            </div>
        </>
    );
}
