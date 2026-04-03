import { formatCurrency, formatDate } from '@/lib/format';
import type { PurchasesPageProps } from '@/Pages/Purchases/types';

type ImportPreview = NonNullable<PurchasesPageProps['importPreview']>;

type PaymentMethod = ImportPreview['payment_methods'][number];

interface ImportPreviewSidebarProps {
    preview: ImportPreview;
    meaningfulPaymentMethods: PaymentMethod[];
}

export default function ImportPreviewSidebar({
    preview,
    meaningfulPaymentMethods,
}: ImportPreviewSidebarProps) {
    return (
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
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
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Emissao
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                        {preview.issued_at_label ?? formatDate(preview.issued_at)}
                    </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Nota
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                        {preview.invoice_number ?? '--'} / serie {preview.series ?? '--'}
                    </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Valor pago
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                        {formatCurrency(preview.amount_paid)}
                    </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
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
                        Pagamentos identificados no cupom
                    </p>
                    {meaningfulPaymentMethods.length > 0 ? (
                        <div className="mt-3 space-y-2">
                            {meaningfulPaymentMethods.map((payment) => (
                                <div
                                    key={`${payment.method}-${payment.amount}`}
                                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
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
                    ) : (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            O cupom não trouxe formas de pagamento claras. Use a seção "Pagamento da nota" ao lado para registrar corretamente.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
