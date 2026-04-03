import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function ChooseHouse() {
    const createForm = useForm({
        name: '',
        code: '',
        house_password: '',
        house_password_confirmation: '',
    });

    const joinForm = useForm({
        code: '',
        password: '',
    });

    function submitCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        createForm.post(route('house.store'));
    }

    function submitJoin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        joinForm.post(route('house.join'));
    }

    return (
        <AuthenticatedLayout>
            <Head title="Escolher casa" />

            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
                <form noValidate onSubmit={submitCreate} className="rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900">Criar casa</h2>

                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="Nome da casa" />
                        <TextInput
                            id="name"
                            value={createForm.data.name}
                            className="mt-2 block w-full"
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            required
                        />
                        <InputError message={createForm.errors.name} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="code" value="Código" />
                        <TextInput
                            id="code"
                            value={createForm.data.code}
                            className="mt-2 block w-full"
                            onChange={(e) => createForm.setData('code', e.target.value)}
                            required
                        />
                        <InputError message={createForm.errors.code} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="house_password" value="Senha da casa" />
                        <TextInput
                            id="house_password"
                            type="password"
                            value={createForm.data.house_password}
                            className="mt-2 block w-full"
                            onChange={(e) => createForm.setData('house_password', e.target.value)}
                            required
                        />
                        <InputError message={createForm.errors.house_password} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="house_password_confirmation" value="Confirmar senha da casa" />
                        <TextInput
                            id="house_password_confirmation"
                            type="password"
                            value={createForm.data.house_password_confirmation}
                            className="mt-2 block w-full"
                            onChange={(e) => createForm.setData('house_password_confirmation', e.target.value)}
                            required
                        />
                    </div>

                    <PrimaryButton className="mt-6" disabled={createForm.processing}>
                        Criar casa
                    </PrimaryButton>
                </form>

                <form noValidate onSubmit={submitJoin} className="rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900">Entrar em casa</h2>

                    <div className="mt-4">
                        <InputLabel htmlFor="join_code" value="Código" />
                        <TextInput
                            id="join_code"
                            value={joinForm.data.code}
                            className="mt-2 block w-full"
                            onChange={(e) => joinForm.setData('code', e.target.value)}
                            required
                        />
                        <InputError message={joinForm.errors.code} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="join_password" value="Senha da casa" />
                        <TextInput
                            id="join_password"
                            type="password"
                            value={joinForm.data.password}
                            className="mt-2 block w-full"
                            onChange={(e) => joinForm.setData('password', e.target.value)}
                            required
                        />
                        <InputError message={joinForm.errors.password} className="mt-2" />
                    </div>

                    <PrimaryButton className="mt-6" disabled={joinForm.processing}>
                        Entrar na casa
                    </PrimaryButton>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
