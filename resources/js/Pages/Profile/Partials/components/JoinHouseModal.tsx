import FormEntityModal from '@/Components/FormEntityModal';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
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
            description="Informe o código e a senha da casa para solicitar entrada."
            saveLabel="Entrar"
            maxWidth="xl"
        >
            <div>
                <LabeledInputField
                    id="join_code"
                    label="Código da Casa"
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
                <p className="mt-1 text-xs text-slate-500">Peça o código da casa ao administrador.</p>
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
