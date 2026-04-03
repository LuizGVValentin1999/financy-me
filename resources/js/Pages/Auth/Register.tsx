import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        house_action: 'create',
        house_name: '',
        house_code: '',
        house_password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation', 'house_password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Criar conta" />

            <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                    Cadastro
                </p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-900">
                    Criar seu acesso.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                    Comece com a base do sistema e depois seguimos para nota
                    fiscal e relatorios.
                </p>
            </div>

            <form noValidate onSubmit={submit} className="mt-8 space-y-5">
                <div>
                    <InputLabel htmlFor="name" value="Nome" />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-2 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-2 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Senha" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-2 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirmar senha"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-2 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-6 space-y-2">
                    <InputLabel value="Casa" />
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setData('house_action', 'create')}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                                data.house_action === 'create'
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-300 bg-white text-slate-700'
                            }`}
                        >
                            Criar casa
                        </button>
                        <button
                            type="button"
                            onClick={() => setData('house_action', 'join')}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                                data.house_action === 'join'
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-300 bg-white text-slate-700'
                            }`}
                        >
                            Entrar em casa
                        </button>
                    </div>
                    <InputError message={errors.house_action} className="mt-2" />
                </div>

                {data.house_action === 'create' && (
                    <div className="mt-4">
                        <InputLabel htmlFor="house_name" value="Nome da casa" />
                        <TextInput
                            id="house_name"
                            name="house_name"
                            value={data.house_name}
                            className="mt-2 block w-full"
                            onChange={(e) => setData('house_name', e.target.value)}
                            required
                        />
                        <InputError message={errors.house_name} className="mt-2" />
                    </div>
                )}

                <div className="mt-4">
                    <InputLabel htmlFor="house_code" value="Código da casa (sem espaços)" />
                    <TextInput
                        id="house_code"
                        name="house_code"
                        value={data.house_code}
                        className="mt-2 block w-full"
                        onChange={(e) => setData('house_code', e.target.value)}
                        required
                    />
                    <InputError message={errors.house_code} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="house_password" value="Senha da casa" />
                    <TextInput
                        id="house_password"
                        type="password"
                        name="house_password"
                        value={data.house_password}
                        className="mt-2 block w-full"
                        onChange={(e) => setData('house_password', e.target.value)}
                        required
                    />
                    <InputError message={errors.house_password} className="mt-2" />
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={route('login')}
                        className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                    >
                        Já tem conta?
                    </Link>

                    <PrimaryButton className="min-w-[160px]" disabled={processing}>
                        Criar conta
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
