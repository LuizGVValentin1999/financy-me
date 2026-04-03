import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

export default function DeleteUserForm({
    className = '',
}: {
    className?: string;
}) {
    const [confirmationMode, setConfirmationMode] = useState<'account' | 'account_and_house' | null>(
        null,
    );
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = (mode: 'account' | 'account_and_house') => {
        setConfirmationMode(mode);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        const targetRoute =
            confirmationMode === 'account_and_house'
                ? route('profile.destroy-with-house')
                : route('profile.destroy');

        destroy(targetRoute, {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onBefore: () => true,
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmationMode(null);

        clearErrors();
        reset();
    };

    const isDeletingHouse = confirmationMode === 'account_and_house';

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Excluir conta
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Exclua apenas sua conta ou, se esta casa for somente sua e
                    voce for administrador, exclua a conta junto com a casa
                    ativa para limpar os rastros do ambiente.
                </p>
            </header>

            <div className="flex flex-wrap gap-3">
                <DangerButton onClick={() => confirmUserDeletion('account')}>
                    Excluir conta
                </DangerButton>
                <DangerButton onClick={() => confirmUserDeletion('account_and_house')}>
                    Excluir conta e casa ativa
                </DangerButton>
            </div>

            <Modal show={confirmationMode !== null} onClose={closeModal}>
                <form noValidate onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        {isDeletingHouse
                            ? 'Tem certeza que deseja excluir sua conta e a casa ativa?'
                            : 'Tem certeza que deseja excluir sua conta?'}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        {isDeletingHouse
                            ? 'Essa acao remove sua conta e todos os dados da casa ativa. Ela so funciona quando voce e o unico usuario vinculado a essa casa. Informe sua senha para confirmar.'
                            : 'Essa acao remove sua conta permanentemente. Informe sua senha para confirmar.'}
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Senha"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="Senha"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>
                            Cancelar
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            {isDeletingHouse
                                ? 'Excluir conta e casa ativa'
                                : 'Excluir conta'}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
