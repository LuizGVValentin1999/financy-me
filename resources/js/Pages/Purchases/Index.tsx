import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SectionCard from '@/Components/SectionCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface PurchasesPageProps {
    products: Array<{
        id: number;
        name: string;
        unit: string;
        current_stock: number;
        category: string | null;
        category_id: number | null;
    }>;
    categories: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    sources: Array<{
        value: string;
        label: string;
    }>;
    importPreview: {
        token: string;
        receipt_url: string | null;
        store_name: string | null;
        cnpj: string | null;
        address: string | null;
        invoice_number: string | null;
        series: string | null;
        issued_at: string | null;
        issued_at_label: string | null;
        access_key: string | null;
        total_items: number;
        total_amount: number;
        discount_amount: number;
        amount_paid: number;
        payment_methods: Array<{
            method: string;
            amount: number;
        }>;
        items: Array<{
            index: number;
            name: string;
            code: string | null;
            quantity: number;
            unit: string;
            unit_price: number;
            total_amount: number;
            suggested_product_id: number | null;
            suggested_product_name: string;
            suggested_category_id: number | null;
        }>;
    } | null;
    entries: Array<{
        id: number;
        product: string | null;
        unit: string | null;
        quantity: number;
        unit_price: number;
        total_amount: number;
        source: string;
        invoice_reference: string | null;
        notes: string | null;
        purchased_at: string | null;
        created_at: string | null;
    }>;
}

function ImportPreviewSection({
    preview,
    products,
    categories,
}: {
    preview: NonNullable<PurchasesPageProps['importPreview']>;
    products: PurchasesPageProps['products'];
    categories: PurchasesPageProps['categories'];
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        token: preview.token,
        items: preview.items.map((item) => ({
            product_id: item.suggested_product_id
                ? String(item.suggested_product_id)
                : '',
            product_name: item.suggested_product_name,
            category_id: item.suggested_category_id
                ? String(item.suggested_category_id)
                : '',
        })),
    });

    const updateItem = (
        index: number,
        key: 'product_id' | 'product_name' | 'category_id',
        value: string,
    ) => {
        setData(
            'items',
            data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item,
            ),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.import-confirm'), {
            preserveScroll: true,
        });
    };

    return (
        <SectionCard
            title="Revisar NFC-e importada"
            description="Classifique cada item. Você pode reaproveitar um produto existente ou criar um novo pelo nome."
            actions={
                <DangerButton
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() =>
                        router.delete(route('purchases.import-clear'), {
                            preserveScroll: true,
                        })
                    }
                >
                    Limpar rascunho
                </DangerButton>
            }
        >
            <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
                <div className="space-y-4 rounded-[28px] bg-[#f8f4ec] p-5">
                    <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                            Estabelecimento
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">
                            {preview.store_name}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            {preview.cnpj}
                            {preview.address ? ` • ${preview.address}` : ''}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Emissao
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {preview.issued_at_label ??
                                    formatDate(preview.issued_at)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Nota
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {preview.invoice_number ?? '--'} / serie{' '}
                                {preview.series ?? '--'}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Valor pago
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {formatCurrency(preview.amount_paid)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Desconto
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                                {formatCurrency(preview.discount_amount)}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Chave de acesso
                        </p>
                        <p className="mt-2 break-all text-sm text-slate-600">
                            {preview.access_key ?? '--'}
                        </p>
                    </div>

                    {preview.payment_methods.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Pagamentos
                            </p>
                            <div className="mt-3 space-y-2">
                                {preview.payment_methods.map((payment) => (
                                    <div
                                        key={`${payment.method}-${payment.amount}`}
                                        className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm"
                                    >
                                        <span className="text-slate-600">
                                            {payment.method}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(payment.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {preview.items.map((item, index) => (
                        <div
                            key={`${item.index}-${item.name}`}
                            className="rounded-[28px] border border-slate-200 bg-white p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xl font-semibold text-slate-900">
                                        {item.name}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {formatQuantity(item.quantity)} {item.unit}{' '}
                                        • {formatCurrency(item.unit_price)} cada
                                        {item.code ? ` • codigo ${item.code}` : ''}
                                    </p>
                                </div>

                                <div className="rounded-full bg-[#eef7f7] px-4 py-2 text-sm font-semibold text-slate-700">
                                    {formatCurrency(item.total_amount)}
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,1fr]">
                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.product_id`}
                                        value="Produto existente"
                                    />
                                    <select
                                        id={`items.${index}.product_id`}
                                        value={data.items[index].product_id}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'product_id',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    >
                                        <option value="">Criar pelo nome abaixo</option>
                                        {products.map((product) => (
                                            <option
                                                key={product.id}
                                                value={product.id}
                                            >
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={
                                            errors[
                                                `items.${index}.product_id`
                                            ]
                                        }
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor={`items.${index}.category_id`}
                                        value="Categoria"
                                    />
                                    <select
                                        id={`items.${index}.category_id`}
                                        value={data.items[index].category_id}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                'category_id',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    >
                                        <option value="">Sem categoria</option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={
                                            errors[
                                                `items.${index}.category_id`
                                            ]
                                        }
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <InputLabel
                                    htmlFor={`items.${index}.product_name`}
                                    value="Nome do produto para criar"
                                />
                                <input
                                    id={`items.${index}.product_name`}
                                    type="text"
                                    value={data.items[index].product_name}
                                    onChange={(event) =>
                                        updateItem(
                                            index,
                                            'product_name',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError
                                    message={
                                        errors[`items.${index}.product_name`]
                                    }
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    ))}

                    <input type="hidden" name="token" value={data.token} />
                    <InputError message={errors.token} className="mt-2" />

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] bg-[#f3efe6] px-5 py-5">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                                Total da importacao
                            </p>
                            <p className="mt-2 text-3xl font-semibold text-slate-900">
                                {formatCurrency(preview.total_amount)}
                            </p>
                        </div>

                        <PrimaryButton disabled={processing}>
                            Confirmar NFC-e
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </SectionCard>
    );
}

export default function PurchasesIndex({
    products,
    categories,
    sources,
    importPreview,
    entries,
}: PurchasesPageProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: products[0] ? String(products[0].id) : '',
        quantity: '1',
        unit_price: '0',
        purchased_at: new Date().toISOString().slice(0, 10),
        source: sources[0]?.value ?? 'manual',
        invoice_reference: '',
        notes: '',
    });

    const importForm = useForm({
        receipt_url: importPreview?.receipt_url ?? '',
    });

    const totalPreview =
        Number(data.quantity || 0) * Number(data.unit_price || 0);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('purchases.store'), {
            preserveScroll: true,
            onSuccess: () => reset('quantity', 'unit_price', 'invoice_reference', 'notes'),
        });
    };

    const submitImport = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        importForm.post(route('purchases.import-link'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                        Compras
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                        Registre entradas no estoque.
                    </h1>
                </div>
            }
        >
            <Head title="Compras" />

            <div className="space-y-6">
                <SectionCard
                    title="Importar compra por link da NFC-e"
                    description="Cole o link publico da SEFAZ do Parana. O sistema busca os itens da nota, monta um rascunho e voce classifica cada produto antes de confirmar."
                >
                    <form onSubmit={submitImport} className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="receipt_url"
                                value="Link da NFC-e"
                            />
                            <input
                                id="receipt_url"
                                type="url"
                                value={importForm.data.receipt_url}
                                onChange={(event) =>
                                    importForm.setData(
                                        'receipt_url',
                                        event.target.value,
                                    )
                                }
                                placeholder="https://www.fazenda.pr.gov.br/nfce/qrcode?p=..."
                                className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <InputError
                                message={importForm.errors.receipt_url}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#f8f4ec] px-4 py-4 text-sm text-slate-600">
                            <span>
                                Suporte inicial para consulta publica da NFC-e
                                do Parana.
                            </span>
                            <PrimaryButton disabled={importForm.processing}>
                                Buscar nota
                            </PrimaryButton>
                        </div>
                    </form>
                </SectionCard>

                {importPreview && (
                    <ImportPreviewSection
                        preview={importPreview}
                        products={products}
                        categories={categories}
                    />
                )}

                <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                    <SectionCard
                        title="Nova compra manual"
                        description="Cada registro aumenta o estoque do produto automaticamente."
                    >
                        {products.length > 0 ? (
                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <InputLabel
                                        htmlFor="product_id"
                                        value="Produto"
                                    />
                                    <select
                                        id="product_id"
                                        value={data.product_id}
                                        onChange={(event) =>
                                            setData(
                                                'product_id',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    >
                                        {products.map((product) => (
                                            <option
                                                key={product.id}
                                                value={product.id}
                                            >
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.product_id}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel
                                            htmlFor="quantity"
                                            value="Quantidade"
                                        />
                                        <input
                                            id="quantity"
                                            type="number"
                                            min="0.001"
                                            step="0.001"
                                            value={data.quantity}
                                            onChange={(event) =>
                                                setData(
                                                    'quantity',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                        />
                                        <InputError
                                            message={errors.quantity}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="unit_price"
                                            value="Preco unitario"
                                        />
                                        <input
                                            id="unit_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.unit_price}
                                            onChange={(event) =>
                                                setData(
                                                    'unit_price',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                        />
                                        <InputError
                                            message={errors.unit_price}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel
                                            htmlFor="purchased_at"
                                            value="Data da compra"
                                        />
                                        <input
                                            id="purchased_at"
                                            type="date"
                                            value={data.purchased_at}
                                            onChange={(event) =>
                                                setData(
                                                    'purchased_at',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="source"
                                            value="Origem"
                                        />
                                        <select
                                            id="source"
                                            value={data.source}
                                            onChange={(event) =>
                                                setData(
                                                    'source',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                        >
                                            {sources.map((source) => (
                                                <option
                                                    key={source.value}
                                                    value={source.value}
                                                >
                                                    {source.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="invoice_reference"
                                        value="Referencia da nota"
                                    />
                                    <input
                                        id="invoice_reference"
                                        type="text"
                                        value={data.invoice_reference}
                                        onChange={(event) =>
                                            setData(
                                                'invoice_reference',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="notes"
                                        value="Observacoes"
                                    />
                                    <textarea
                                        id="notes"
                                        rows={4}
                                        value={data.notes}
                                        onChange={(event) =>
                                            setData(
                                                'notes',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    />
                                </div>

                                <div className="rounded-[28px] bg-[#f8f4ec] p-5">
                                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                                        Total previsto
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold text-slate-900">
                                        {formatCurrency(totalPreview)}
                                    </p>
                                </div>

                                <PrimaryButton disabled={processing}>
                                    Registrar compra
                                </PrimaryButton>
                            </form>
                        ) : (
                            <div className="rounded-[28px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                Cadastre um produto antes de registrar compras.
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Historico recente"
                        description={`${entries.length} registros mais recentes.`}
                    >
                        <div className="grid gap-4">
                            {entries.length > 0 ? (
                                entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="rounded-[28px] border border-slate-200 bg-white p-5"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xl font-semibold text-slate-900">
                                                    {entry.product ??
                                                        'Produto removido'}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {formatDate(
                                                        entry.purchased_at,
                                                    )}{' '}
                                                    •{' '}
                                                    {entry.source ===
                                                    'nota_fiscal'
                                                        ? 'Nota fiscal'
                                                        : 'Manual'}
                                                    {entry.invoice_reference
                                                        ? ` • ${entry.invoice_reference}`
                                                        : ''}
                                                </p>
                                            </div>

                                            <DangerButton
                                                type="button"
                                                className="px-4 py-2 text-xs"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            'Excluir este registro de compra?',
                                                        )
                                                    ) {
                                                        router.delete(
                                                            route(
                                                                'purchases.destroy',
                                                                entry.id,
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

                                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                            <div className="rounded-3xl bg-[#f8f4ec] p-4">
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                                    Quantidade
                                                </p>
                                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                                    {formatQuantity(
                                                        entry.quantity,
                                                    )}{' '}
                                                    {entry.unit ?? 'un'}
                                                </p>
                                            </div>
                                            <div className="rounded-3xl bg-[#eef7f7] p-4">
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                                    Preco unitario
                                                </p>
                                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                                    {formatCurrency(
                                                        entry.unit_price,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="rounded-3xl bg-[#fff1ec] p-4">
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                                    Total
                                                </p>
                                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                                    {formatCurrency(
                                                        entry.total_amount,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm leading-6 text-slate-600">
                                            {entry.notes || 'Sem observacoes.'}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[28px] bg-[#f8f4ec] p-5 text-sm text-slate-600">
                                    Nenhuma compra registrada ainda.
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
