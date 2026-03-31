import FormEntityModal from '@/Components/FormEntityModal';
import AccountFormFields from '@/Pages/Accounts/components/AccountFormFields';
import { FormEvent } from 'react';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    data: {
        code: string;
        name: string;
        initial_balance: string;
        initial_balance_date: string;
    };
    errors: Record<string, string | undefined>;
    onFieldChange: (
        field: 'code' | 'name' | 'initial_balance' | 'initial_balance_date',
        value: string,
    ) => void;
    title: string;
    description: string;
    saveLabel: string;
    onDelete?: () => void;
    idPrefix?: string;
}

export default function AccountModal({
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
    onDelete,
    idPrefix,
}: AccountModalProps) {
    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={processing}
            sectionLabel="Contas"
            title={title}
            description={description}
            saveLabel={saveLabel}
            onDelete={onDelete}
        >
            <AccountFormFields
                data={data}
                errors={errors}
                idPrefix={idPrefix}
                onFieldChange={onFieldChange}
            />
        </FormEntityModal>
    );
}
