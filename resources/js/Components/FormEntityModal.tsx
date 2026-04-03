import FormModalActions from '@/Components/FormModalActions';
import Modal from '@/Components/Modal';
import { FormEvent, ReactNode } from 'react';

interface FormEntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    processing: boolean;
    sectionLabel: string;
    title: string;
    description?: string;
    saveLabel?: string;
    onDelete?: () => void;
    idPrefix?: string;
    children: ReactNode;
    actions?: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export default function FormEntityModal({
    isOpen,
    onClose,
    onSubmit,
    processing,
    sectionLabel,
    title,
    description,
    saveLabel = 'Salvar',
    onDelete,
    children,
    actions,
    maxWidth = '2xl',
}: FormEntityModalProps) {
    return (
        <Modal show={isOpen} onClose={onClose} maxWidth={maxWidth}>
            <div className="p-4 sm:p-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 sm:text-sm sm:tracking-[0.25em]">{sectionLabel}</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">{title}</h2>
                    {description ? (
                        <p className="mt-1 hidden text-sm leading-6 text-slate-500 sm:mt-2 sm:block">{description}</p>
                    ) : null}
                </div>

                <form noValidate onSubmit={onSubmit} className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
                    {children}

                    {actions ?? (
                        <FormModalActions
                            onCancel={onClose}
                            onDelete={onDelete}
                            saveLabel={saveLabel}
                            saveDisabled={processing}
                        />
                    )}
                </form>
            </div>
        </Modal>
    );
}
