import FormEntityModal from '@/Components/FormEntityModal';
import SecondaryButton from '@/Components/SecondaryButton';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import LabeledSelectField from '@/Components/form-fields/LabeledSelectField';
import { FormEvent } from 'react';

interface FinancialEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    data: {
        account_id: string;
        category_id: string;
        direction: 'inflow' | 'outflow';
        amount: string;
        moved_at: string;
        description: string;
    };
    errors: Record<string, string | undefined>;
    setData: (field: 'account_id' | 'category_id' | 'direction' | 'amount' | 'moved_at' | 'description', value: string) => void;
    title: string;
    sectionLabel: string;
    saveLabel: string;
    accountOptions: Array<{ value: string; label: string }>;
    categoryOptions: Array<{ value: string; label: string }>;
    directionOptions: Array<{ value: string; label: string }>;
    onDelete?: () => void;
    readOnly?: boolean;
    description?: string;
}

export default function FinancialEntryModal({
    isOpen,
    onClose,
    onSubmit,
    processing,
    data,
    errors,
    setData,
    title,
    sectionLabel,
    saveLabel,
    accountOptions,
    categoryOptions,
    directionOptions,
    onDelete,
    readOnly = false,
    description,
}: FinancialEntryModalProps) {
    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={processing}
            sectionLabel={sectionLabel}
            title={title}
            description={description}
            saveLabel={saveLabel}
            onDelete={readOnly ? undefined : onDelete}
            actions={
                readOnly ? (
                    <div className="flex justify-end">
                        <SecondaryButton type="button" onClick={onClose}>
                            Fechar
                        </SecondaryButton>
                    </div>
                ) : undefined
            }
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <LabeledSelectField
                    id="direction"
                    label="Direção"
                    value={data.direction}
                    onChange={(value) => setData('direction', value)}
                    options={directionOptions}
                    error={errors.direction}
                    disabled={readOnly}
                />
                <LabeledInputField
                    id="amount"
                    label="Valor"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={data.amount}
                    onChange={(value) => setData('amount', value)}
                    error={errors.amount}
                    disabled={readOnly}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <LabeledSelectField
                    id="account_id"
                    label="Conta"
                    value={data.account_id}
                    onChange={(value) => setData('account_id', value)}
                    options={accountOptions}
                    error={errors.account_id}
                    disabled={readOnly}
                />
                <LabeledSelectField
                    id="category_id"
                    label="Categoria"
                    value={data.category_id}
                    onChange={(value) => setData('category_id', value)}
                    options={categoryOptions}
                    error={errors.category_id}
                    disabled={readOnly}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInputField
                    id="moved_at"
                    label="Data"
                    type="date"
                    value={data.moved_at}
                    onChange={(value) => setData('moved_at', value)}
                    error={errors.moved_at}
                    disabled={readOnly}
                />
                <LabeledInputField
                    id="description"
                    label="Descrição"
                    value={data.description}
                    onChange={(value) => setData('description', value)}
                    error={errors.description}
                    disabled={readOnly}
                />
            </div>
        </FormEntityModal>
    );
}
