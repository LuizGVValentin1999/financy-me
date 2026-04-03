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
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-3">
            <SecondaryButton type="button" onClick={onCancel} className="w-full sm:w-auto">
                {cancelLabel}
            </SecondaryButton>
            {onDelete ? (
                <DangerButton type="button" onClick={onDelete} className="col-span-2 w-full sm:w-auto">
                    {deleteLabel}
                </DangerButton>
            ) : null}
            <PrimaryButton disabled={saveDisabled} className="w-full sm:w-auto">
                {saveLabel}
            </PrimaryButton>
        </div>
    );
}
