import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function NotFound() {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                        Erro 404
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                        Página não encontrada
                    </h1>
                </div>
            }
        >
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-base text-slate-600">
                    Não encontramos a página que você tentou acessar.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <PrimaryButton type="button" onClick={() => router.visit(route('dashboard'))}>
                        Ir para Dashboard
                    </PrimaryButton>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
