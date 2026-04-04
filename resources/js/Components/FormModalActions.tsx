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
        <div className="flex w-full items-center gap-2 sm:flex-wrap sm:justify-end sm:gap-3">
            <SecondaryButton
                type="button"
                onClick={onCancel}
                className="min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-5 sm:text-sm"
            >
                {cancelLabel}
            </SecondaryButton>
            {onDelete ? (
                <DangerButton
                    type="button"
                    onClick={onDelete}
                    className="min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-5 sm:text-sm"
                >
                    {deleteLabel}
                </DangerButton>
            ) : null}
            <PrimaryButton
                disabled={saveDisabled}
                className="min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-5 sm:text-sm"
            >
                {saveLabel}
            </PrimaryButton>
        </div>
    );
}
