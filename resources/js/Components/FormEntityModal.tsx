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
            <div className="p-5 sm:p-6">
                <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{sectionLabel}</p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h2>
                    {description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                    ) : null}
                </div>

                <form noValidate onSubmit={onSubmit} className="mt-6 space-y-5">
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
