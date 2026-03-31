import FormEntityModal from '@/Components/FormEntityModal';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { FormEventHandler } from 'react';

interface JoinHouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: FormEventHandler;
    isLoading: boolean;
    data: {
        code: string;
        password: string;
    };
    setData: (data: { code: string; password: string }) => void;
    errors: Record<string, string>;
}

export default function JoinHouseModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    data,
    setData,
    errors,
}: JoinHouseModalProps) {
    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={isLoading}
            sectionLabel="Casas"
            title="Entrar em Casa"
            description="Informe o codigo e a senha da casa para solicitar entrada."
            maxWidth="xl"
            actions={
                <div className="flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton disabled={isLoading}>Entrar</PrimaryButton>
                </div>
            }
        >
            <div>
                <LabeledInputField
                    id="join_code"
                    label="Codigo da Casa"
                    value={data.code}
                    onChange={(value) =>
                        setData({
                            ...data,
                            code: value,
                        })
                    }
                    placeholder="Ex: praia-2024"
                    error={errors.code}
                />
                <p className="mt-1 text-xs text-slate-500">Peca o codigo da casa ao administrador.</p>
            </div>

            <LabeledInputField
                id="join_password"
                label="Senha da Casa"
                type="password"
                value={data.password}
                onChange={(value) =>
                    setData({
                        ...data,
                        password: value,
                    })
                }
                placeholder="Digite a senha da casa"
                error={errors.password}
            />
        </FormEntityModal>
    );
}
