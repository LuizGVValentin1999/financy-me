import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Entrar" />

            <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                    Acesso
                </p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-900">
                    Entrar na sua casa digital.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                    Use seu email para acessar o painel de estoque e financas.
                </p>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f8f4ec] px-4 py-3 text-sm text-slate-600">
                    Estoque, compras e financeiro no mesmo lugar.
                </div>
            </div>

            {status && (
                <div className="mb-4 mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form noValidate onSubmit={submit} className="mt-8 space-y-5">
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-2 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
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
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(e) =>
                            setData(
                                'remember',
                                (e.target.checked || false) as false,
                            )
                        }
                        className="text-sm text-slate-600"
                    >
                        Lembrar de mim
                    </Checkbox>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                        >
                            Esqueceu sua senha?
                        </Link>
                    )}

                    <PrimaryButton className="min-w-[140px]" disabled={processing}>
                        Entrar
                    </PrimaryButton>
                </div>

                {route().has('register') && (
                    <div className="pt-2">
                        <Link
                            href={route('register')}
                            className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400"
                        >
                            Criar conta
                        </Link>
                    </div>
                )}
            </form>
        </GuestLayout>
    );
}
