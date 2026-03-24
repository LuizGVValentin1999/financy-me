import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SectionCard from '@/Components/SectionCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface CategoryPageProps {
    categories: Array<{
        id: number;
        name: string;
        kind: string;
        color: string;
        description: string | null;
        products_count: number;
        created_at: string | null;
    }>;
    kinds: Array<{
        value: string;
        label: string;
    }>;
}

export default function CategoriesIndex({ categories, kinds }: CategoryPageProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        kind: kinds[0]?.value ?? 'produto',
        color: '#1F7A8C',
        description: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('categories.store'), {
            preserveScroll: true,
            onSuccess: () => reset('name', 'description'),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                        Categorias
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                        Organize produtos e servicos.
                    </h1>
                </div>
            }
        >
            <Head title="Categorias" />

            <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                <SectionCard
                    title="Nova categoria"
                    description="Crie grupos para classificar produtos, servicos e itens importados depois."
                >
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="name" value="Nome" />
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-[1fr,140px]">
                            <div>
                                <InputLabel htmlFor="kind" value="Tipo" />
                                <select
                                    id="kind"
                                    value={data.kind}
                                    onChange={(event) =>
                                        setData('kind', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                >
                                    {kinds.map((kind) => (
                                        <option
                                            key={kind.value}
                                            value={kind.value}
                                        >
                                            {kind.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <InputLabel htmlFor="color" value="Cor" />
                                <input
                                    id="color"
                                    type="color"
                                    value={data.color}
                                    onChange={(event) =>
                                        setData('color', event.target.value)
                                    }
                                    className="mt-2 block h-[52px] w-full rounded-2xl border border-slate-200 bg-white p-2"
                                />
                                <InputError message={errors.color} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="description"
                                value="Descricao"
                            />
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                rows={4}
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={errors.description}
                                className="mt-2"
                            />
                        </div>

                        <PrimaryButton disabled={processing}>
                            Criar categoria
                        </PrimaryButton>
                    </form>
                </SectionCard>

                <SectionCard
                    title="Categorias cadastradas"
                    description={`${categories.length} categorias prontas para uso.`}
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        {categories.length > 0 ? (
                            categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="rounded-[28px] border border-slate-200 bg-[#f8f4ec] p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="h-4 w-4 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        category.color,
                                                }}
                                            />
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {category.name}
                                                </p>
                                                <p className="text-sm capitalize text-slate-500">
                                                    {category.kind}
                                                </p>
                                            </div>
                                        </div>

                                        <DangerButton
                                            type="button"
                                            className="px-4 py-2 text-xs"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Excluir a categoria "${category.name}"?`,
                                                    )
                                                ) {
                                                    router.delete(
                                                        route(
                                                            'categories.destroy',
                                                            category.id,
                                                        ),
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    );
                                                }
                                            }}
                                        >
                                            Excluir
                                        </DangerButton>
                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-slate-600">
                                        {category.description ||
                                            'Sem descricao por enquanto.'}
                                    </p>

                                    <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                                        <span>
                                            {category.products_count} produtos
                                        </span>
                                        <span>{category.created_at ?? '--'}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-[28px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                Nenhuma categoria criada ainda.
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
