import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

type HouseItem = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    role: string;
    is_active: boolean;
};

type Props = {
    houses: HouseItem[];
};

export default function ListHouses({ houses }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Minhas casas" />

            <div className="mx-auto max-w-5xl">
                <h1 className="text-2xl font-semibold text-slate-900">Minhas casas</h1>

                <div className="mt-6 grid gap-4">
                    {houses.map((house) => (
                        <div key={house.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{house.name}</h2>
                                    <p className="text-sm text-slate-600">Codigo: {house.code}</p>
                                    <p className="text-sm text-slate-600">Papel: {house.role}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => router.patch(route('house.set-active', house.id))}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                                    disabled={house.is_active}
                                >
                                    {house.is_active ? 'Ativa' : 'Tornar ativa'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
