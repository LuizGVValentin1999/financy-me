import FormEntityModal from '@/Components/FormEntityModal';
import LabeledInputField from '@/Components/form-fields/LabeledInputField';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { FormEventHandler } from 'react';

interface CreateHouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: FormEventHandler;
    isLoading: boolean;
    data: {
        name: string;
        code: string;
        house_password: string;
        house_password_confirmation: string;
    };
    setData: (data: {
        name: string;
        code: string;
        house_password: string;
        house_password_confirmation: string;
    }) => void;
    errors: Record<string, string>;
}

export default function CreateHouseModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    data,
    setData,
    errors,
}: CreateHouseModalProps) {
    return (
        <FormEntityModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            processing={isLoading}
            sectionLabel="Casas"
            title="Criar Nova Casa"
            description="Defina um nome, um codigo unico e uma senha para a nova casa."
            maxWidth="xl"
            actions={
                <div className="flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton disabled={isLoading}>Criar Casa</PrimaryButton>
                </div>
            }
        >
            <LabeledInputField
                id="name"
                label="Nome da Casa"
                value={data.name}
                onChange={(value) =>
                    setData({
                        ...data,
                        name: value,
                    })
                }
                placeholder="Ex: Casa da Praia"
                error={errors.name}
            />

            <div>
                <LabeledInputField
                    id="code"
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
                <p className="mt-1 text-xs text-slate-500">
                    Codigo unico para entrar nesta casa. Apenas letras, numeros, hifen e underscore.
                </p>
            </div>

            <LabeledInputField
                id="house_password"
                label="Senha da Casa"
                type="password"
                value={data.house_password}
                onChange={(value) =>
                    setData({
                        ...data,
                        house_password: value,
                    })
                }
                placeholder="Minimo 6 caracteres"
                error={errors.house_password}
            />

            <LabeledInputField
                id="house_password_confirmation"
                label="Confirmar Senha"
                type="password"
                value={data.house_password_confirmation}
                onChange={(value) =>
                    setData({
                        ...data,
                        house_password_confirmation: value,
                    })
                }
                placeholder="Confirme a senha"
                error={errors.house_password_confirmation}
            />
        </FormEntityModal>
    );
}
