import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { formatCurrency } from '@/lib/format';
import type { AccountOption, ProductOption, SourceOption } from '@/Pages/Purchases/components/purchaseForm/types';
import { DatePicker, Select } from 'antd';
import dayjs from 'dayjs';

interface PurchaseMainFieldsProps {
    formData: Record<string, string>;
    setFormData: (key: string, value: string) => void;
    errors: Record<string, string>;
    products: ProductOption[];
    accounts: AccountOption[];
    sources: SourceOption[];
    onProductSearch: (value: string) => void;
    onOpenQuickProductModal: () => void;
}

export default function PurchaseMainFields({
    formData,
    setFormData,
    errors,
    products,
    accounts,
    sources,
    onProductSearch,
    onOpenQuickProductModal,
}: PurchaseMainFieldsProps) {
    const totalValue = Number(formData.quantity || 0) * Number(formData.unit_price || 0);

    return (
        <>
            <div>
                <InputLabel htmlFor="product_id" value="Produto" />
                <Select
                    id="product_id"
                    value={formData.product_id || undefined}
                    onSearch={onProductSearch}
                    onChange={(value) => setFormData('product_id', (value ?? '') as string)}
                    className="mt-2 w-full"
                    size="large"
                    showSearch
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    allowClear
                    placeholder="Pesquise por nome do produto"
                    options={products.map((product) => ({
                        value: String(product.id),
                        label: product.name,
                    }))}
                    notFoundContent="Nenhum produto encontrado"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>Não encontrou o produto na busca?</span>
                    <button
                        type="button"
                        onClick={onOpenQuickProductModal}
                        className="font-semibold text-slate-700 underline underline-offset-2"
                    >
                        Cadastrar novo produto agora
                    </button>
                </div>
                <InputError message={errors.product_id} className="mt-2" />
            </div>

            <div>
                <InputLabel htmlFor="account_id" value="Conta " />
                <Select
                    id="account_id"
                    value={formData.account_id || undefined}
                    onChange={(value) => setFormData('account_id', (value ?? '') as string)}
                    className="mt-2 w-full"
                    size="large"
                    allowClear
                    placeholder="Sem conta"
                    options={accounts.map((account) => ({
                        value: String(account.id),
                        label: `${account.code} - ${account.name}`,
                    }))}
                />
                <InputError message={errors.account_id} className="mt-2" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="quantity" value="Quantidade" />
                    <input
                        id="quantity"
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={formData.quantity}
                        onChange={(event) => setFormData('quantity', event.target.value)}
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                    <InputError message={errors.quantity} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="unit_price" value="Preco unitario" />
                    <input
                        id="unit_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(event) => setFormData('unit_price', event.target.value)}
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    />
                    <InputError message={errors.unit_price} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="purchased_at" value="Data da compra" />
                    <DatePicker
                        id="purchased_at"
                        value={formData.purchased_at ? dayjs(formData.purchased_at) : null}
                        format="DD/MM/YYYY"
                        size="large"
                        onChange={(date) =>
                            setFormData('purchased_at', date ? date.format('YYYY-MM-DD') : '')
                        }
                        className="mt-2 w-full"
                    />
                    <InputError message={errors.purchased_at} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="source" value="Origem" />
                    <Select
                        id="source"
                        value={formData.source}
                        onChange={(value) => setFormData('source', value)}
                        className="mt-2 w-full"
                        size="large"
                        options={sources.map((source) => ({
                            value: source.value,
                            label: source.label,
                        }))}
                    />
                    <InputError message={errors.source} className="mt-2" />
                </div>
            </div>

            <div>
                <InputLabel htmlFor="invoice_reference" value="Referencia da nota" />
                <input
                    id="invoice_reference"
                    type="text"
                    value={formData.invoice_reference}
                    onChange={(event) => setFormData('invoice_reference', event.target.value)}
                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                />
                <InputError message={errors.invoice_reference} className="mt-2" />
            </div>

            <div>
                <InputLabel htmlFor="notes" value="Observacoes" />
                <textarea
                    id="notes"
                    rows={5}
                    value={formData.notes}
                    onChange={(event) => setFormData('notes', event.target.value)}
                    className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
                />
                <InputError message={errors.notes} className="mt-2" />
            </div>

            <div className="rounded-[28px] bg-[#f8f4ec] p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    Total previsto
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {formatCurrency(totalValue)}
                </p>
            </div>
        </>
    );
}
