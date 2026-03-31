import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatCurrency, formatQuantity } from '@/lib/format';
import type { PurchasesPageProps } from '@/Pages/Purchases/types';
import { Select } from 'antd';

type ImportPreview = NonNullable<PurchasesPageProps['importPreview']>;
type ImportItem = ImportPreview['items'][number];
type Product = PurchasesPageProps['products'][number];
type Category = PurchasesPageProps['categories'][number];
type ImportUnit = PurchasesPageProps['importUnits'][number];

type ItemFormState = {
    include: boolean;
    product_id: string;
    product_name: string;
    quantity: string;
    category_id: string;
    unit: string;
    type: string;
};

interface ImportPreviewItemCardProps {
    item: ImportItem;
    index: number;
    itemState: ItemFormState;
    products: Product[];
    categories: Category[];
    importUnits: ImportUnit[];
    errors: Record<string, string | undefined>;
    onUpdateItem: (
        index: number,
        key:
            | 'include'
            | 'product_id'
            | 'product_name'
            | 'quantity'
            | 'category_id'
            | 'unit'
            | 'type',
        value: boolean | string,
    ) => void;
}

export default function ImportPreviewItemCard({
    item,
    index,
    itemState,
    products,
    categories,
    importUnits,
    errors,
    onUpdateItem,
}: ImportPreviewItemCardProps) {
    const isIncluded = itemState.include;
    const hasExistingProduct = Boolean(itemState.product_id);

    return (
        <div
            className={`rounded-[28px] border p-5 shadow-sm transition ${
                isIncluded
                    ? 'border-slate-200 bg-white'
                    : 'border-dashed border-slate-200 bg-slate-50/90 opacity-80'
            }`}
        >
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-semibold text-slate-900">
                            {item.name}
                        </p>
                        {item.suggested_product_id && (
                            <span className="rounded-full bg-[#eef7f7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                Sugestao {Math.round(item.suggestion_score ?? 0)}%
                            </span>
                        )}
                        {item.is_discount && (
                            <span className="rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#be3d2a]">
                                Desconto global
                            </span>
                        )}
                        {!isIncluded && (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                Excluido do lancamento
                            </span>
                        )}
                        {isIncluded && hasExistingProduct && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                Produto existente
                            </span>
                        )}
                        {isIncluded && !hasExistingProduct && !item.is_discount && (
                            <span className="rounded-full bg-[#eef7f7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                Novo produto
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Nota: {formatQuantity(item.quantity)} {item.unit}{' '}
                        • {formatCurrency(item.unit_price)} cada
                        {item.code ? ` • codigo ${item.code}` : ''}
                    </p>
                    {item.suggested_product_id && (
                        <p className="mt-2 text-sm text-slate-600">
                            Produto mais proximo encontrado:{' '}
                            <span className="font-semibold text-slate-900">
                                {item.suggested_product_name}
                            </span>
                        </p>
                    )}
                </div>

                <div
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        item.is_discount
                            ? 'bg-[#fff1ec] text-[#be3d2a]'
                            : 'bg-[#eef7f7] text-slate-700'
                    }`}
                >
                    {formatCurrency(item.total_amount)}
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                <label
                    htmlFor={`items.${index}.include`}
                    className="flex items-center gap-3 text-sm font-medium text-slate-700"
                >
                    <Checkbox
                        id={`items.${index}.include`}
                        checked={isIncluded}
                        onChange={(event) =>
                            onUpdateItem(index, 'include', event.target.checked)
                        }
                    />
                    Incluir este item no lancamento
                </label>

                <SecondaryButton
                    type="button"
                    className="px-4 py-2 text-xs"
                    onClick={() => onUpdateItem(index, 'include', !isIncluded)}
                >
                    {isIncluded ? 'Remover do lancamento' : 'Reincluir no lancamento'}
                </SecondaryButton>
            </div>

            {isIncluded && (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="md:col-span-2">
                        <InputLabel
                            htmlFor={`items.${index}.product_id`}
                            value="Produto existente"
                        />
                        <Select
                            id={`items.${index}.product_id`}
                            value={itemState.product_id || undefined}
                            onChange={(value) =>
                                onUpdateItem(index, 'product_id', value ?? '')
                            }
                            className="mt-2 w-full"
                            size="large"
                            showSearch
                            allowClear
                            optionFilterProp="label"
                            placeholder="Selecione para reaproveitar"
                            options={products.map((product) => ({
                                value: String(product.id),
                                label: product.name,
                            }))}
                        />
                    </div>

                    {!itemState.product_id && (
                        <>
                            <div>
                                <InputLabel
                                    htmlFor={`items.${index}.product_name`}
                                    value="Nome do novo produto"
                                />
                                <input
                                    id={`items.${index}.product_name`}
                                    type="text"
                                    value={itemState.product_name}
                                    onChange={(event) =>
                                        onUpdateItem(
                                            index,
                                            'product_name',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                />
                                <InputError
                                    message={errors[`items.${index}.product_name`]}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor={`items.${index}.category_id`}
                                    value="Categoria"
                                />
                                <Select
                                    id={`items.${index}.category_id`}
                                    value={itemState.category_id || undefined}
                                    onChange={(value) =>
                                        onUpdateItem(index, 'category_id', value ?? '')
                                    }
                                    className="mt-2 w-full"
                                    size="large"
                                    allowClear
                                    options={categories.map((category) => ({
                                        value: String(category.id),
                                        label: category.name,
                                    }))}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <InputLabel
                            htmlFor={`items.${index}.quantity`}
                            value="Quantidade"
                        />
                        <input
                            id={`items.${index}.quantity`}
                            type="number"
                            min={item.is_discount ? '0' : '0.001'}
                            step="0.001"
                            value={itemState.quantity}
                            onChange={(event) =>
                                onUpdateItem(index, 'quantity', event.target.value)
                            }
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        />
                        <InputError
                            message={errors[`items.${index}.quantity`]}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor={`items.${index}.unit`}
                            value="Unidade"
                        />
                        <Select
                            id={`items.${index}.unit`}
                            value={itemState.unit}
                            onChange={(value) => onUpdateItem(index, 'unit', value)}
                            className="mt-2 w-full"
                            size="large"
                            options={importUnits}
                        />
                        <InputError
                            message={errors[`items.${index}.unit`]}
                            className="mt-2"
                        />
                    </div>

                    {!item.is_discount && (
                        <div>
                            <InputLabel
                                htmlFor={`items.${index}.type`}
                                value="Tipo"
                            />
                            <Select
                                id={`items.${index}.type`}
                                value={itemState.type}
                                onChange={(value) =>
                                    onUpdateItem(index, 'type', value)
                                }
                                className="mt-2 w-full"
                                size="large"
                                options={[
                                    {
                                        value: 'stockable',
                                        label: 'Estocavel',
                                    },
                                    {
                                        value: 'non_stockable',
                                        label: 'Nao estocavel',
                                    },
                                ]}
                            />
                            <InputError
                                message={errors[`items.${index}.type`]}
                                className="mt-2"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
