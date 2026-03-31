import FormEntityModal from '@/Components/FormEntityModal';
import CategoryFormFields from '@/Pages/Categories/components/CategoryFormFields';
import { FormEvent } from 'react';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    data: {
        code: string;
        name: string;
        color: string;
        description: string;
    };
    errors: Record<string, string | undefined>;
    onFieldChange: (
        field: 'code' | 'name' | 'color' | 'description',
        value: string,
    ) => void;
    title: string;
    description: string;
    saveLabel: string;
    onDelete?: () => void;
    idPrefix?: string;
}

export default function CategoryModal({
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
}: CategoryModalProps) {
    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={processing}
            sectionLabel="Categorias"
            title={title}
            description={description}
            saveLabel={saveLabel}
            onDelete={onDelete}
        >
            <CategoryFormFields
                data={data}
                errors={errors}
                idPrefix={idPrefix}
                onFieldChange={onFieldChange}
            />
        </FormEntityModal>
    );
}
