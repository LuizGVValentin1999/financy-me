import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface FormModalActionsProps {
    onCancel: () => void;
    onDelete?: () => void;
    saveLabel: string;
    saveDisabled?: boolean;
    cancelLabel?: string;
    deleteLabel?: string;
}

export default function FormModalActions({
    onCancel,
    onDelete,
    saveLabel,
    saveDisabled = false,
    cancelLabel = 'Cancelar',
    deleteLabel = 'Excluir',
}: FormModalActionsProps) {
    return (
        <div className="flex flex-wrap justify-end gap-3">
            <SecondaryButton type="button" onClick={onCancel}>
                {cancelLabel}
            </SecondaryButton>
            {onDelete ? (
                <DangerButton type="button" onClick={onDelete}>
                    {deleteLabel}
                </DangerButton>
            ) : null}
            <PrimaryButton disabled={saveDisabled}>{saveLabel}</PrimaryButton>
        </div>
    );
}
