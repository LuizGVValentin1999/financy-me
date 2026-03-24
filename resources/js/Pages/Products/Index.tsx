import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SectionCard from '@/Components/SectionCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface ProductsPageProps {
    categories: Array<{
        id: number;
        name: string;
        color: string;
        kind: string;
    }>;
    units: Array<{
        value: string;
        label: string;
    }>;
    products: Array<{
        id: number;
        name: string;
        brand: string | null;
        sku: string | null;
        unit: string;
        minimum_stock: number;
        current_stock: number;
        is_active: boolean;
        notes: string | null;
        category: { name: string; color: string } | null;
        total_spent: number;
        last_purchase_at: string | null;
    }>;
}

export default function ProductsIndex({
    categories,
    units,
    products,
}: ProductsPageProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        category_id: '',
        name: '',
        brand: '',
        sku: '',
        unit: units[0]?.value ?? 'un',
        minimum_stock: '0',
        notes: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('products.store'), {
            preserveScroll: true,
            onSuccess: () =>
                reset('category_id', 'name', 'brand', 'sku', 'minimum_stock', 'notes'),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                        Produtos
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                        Cadastre o que entra no estoque.
                    </h1>
                </div>
            }
        >
            <Head title="Produtos" />

            <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                <SectionCard
                    title="Novo produto"
                    description="Estoque inicial fica em zero e passa a crescer conforme voce registra compras."
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="brand" value="Marca" />
                                <input
                                    id="brand"
                                    type="text"
                                    value={data.brand}
                                    onChange={(event) =>
                                        setData('brand', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="sku" value="SKU ou codigo" />
                                <input
                                    id="sku"
                                    type="text"
                                    value={data.sku}
                                    onChange={(event) =>
                                        setData('sku', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <InputLabel
                                    htmlFor="category_id"
                                    value="Categoria"
                                />
                                <select
                                    id="category_id"
                                    value={data.category_id}
                                    onChange={(event) =>
                                        setData(
                                            'category_id',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                >
                                    <option value="">Sem categoria</option>
                                    {categories
                                        .filter(
                                            (category) =>
                                                category.kind === 'produto',
                                        )
                                        .map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                                <InputError
                                    message={errors.category_id}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="unit" value="Unidade" />
                                <select
                                    id="unit"
                                    value={data.unit}
                                    onChange={(event) =>
                                        setData('unit', event.target.value)
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                >
                                    {units.map((unit) => (
                                        <option
                                            key={unit.value}
                                            value={unit.value}
                                        >
                                            {unit.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="minimum_stock"
                                value="Estoque minimo"
                            />
                            <input
                                id="minimum_stock"
                                type="number"
                                min="0"
                                step="0.001"
                                value={data.minimum_stock}
                                onChange={(event) =>
                                    setData(
                                        'minimum_stock',
                                        event.target.value,
                                    )
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={errors.minimum_stock}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Observacoes" />
                            <textarea
                                id="notes"
                                rows={4}
                                value={data.notes}
                                onChange={(event) =>
                                    setData('notes', event.target.value)
                                }
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <PrimaryButton disabled={processing}>
                            Criar produto
                        </PrimaryButton>
                    </form>
                </SectionCard>

                <SectionCard
                    title="Produtos cadastrados"
                    description={`${products.length} itens no catalogo atual.`}
                >
                    <div className="grid gap-4">
                        {products.length > 0 ? (
                            products.map((product) => (
                                <div
                                    key={product.id}
                                    className="rounded-[28px] border border-slate-200 bg-white p-5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-xl font-semibold text-slate-900">
                                                    {product.name}
                                                </p>
                                                {product.category && (
                                                    <span
                                                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-slate-900"
                                                        style={{
                                                            backgroundColor: `${product.category.color}22`,
                                                        }}
                                                    >
                                                        {product.category.name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {product.brand || 'Sem marca'}{' '}
                                                {product.sku
                                                    ? `• ${product.sku}`
                                                    : ''}
                                            </p>
                                        </div>

                                        <DangerButton
                                            type="button"
                                            className="px-4 py-2 text-xs"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Excluir o produto "${product.name}"?`,
                                                    )
                                                ) {
                                                    router.delete(
                                                        route(
                                                            'products.destroy',
                                                            product.id,
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

                                    <div className="mt-5 grid gap-4 sm:grid-cols-4">
                                        <div className="rounded-3xl bg-[#f8f4ec] p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                                Estoque
                                            </p>
                                            <p
                                                className={`mt-2 text-lg font-semibold ${
                                                    product.current_stock <=
                                                    product.minimum_stock
                                                        ? 'text-[#be3d2a]'
                                                        : 'text-slate-900'
                                                }`}
                                            >
                                                {formatQuantity(
                                                    product.current_stock,
                                                )}{' '}
                                                {product.unit}
                                            </p>
                                        </div>
                                        <div className="rounded-3xl bg-[#eef7f7] p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                                Minimo
                                            </p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                                {formatQuantity(
                                                    product.minimum_stock,
                                                )}{' '}
                                                {product.unit}
                                            </p>
                                        </div>
                                        <div className="rounded-3xl bg-[#fff1ec] p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                                Total gasto
                                            </p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                                {formatCurrency(
                                                    product.total_spent,
                                                )}
                                            </p>
                                        </div>
                                        <div className="rounded-3xl bg-[#f3efe6] p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                                Ultima compra
                                            </p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                                {formatDate(
                                                    product.last_purchase_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-slate-600">
                                        {product.notes || 'Sem observacoes.'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-[28px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                Nenhum produto cadastrado ainda.
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>
        </AuthenticatedLayout>
    );
}
