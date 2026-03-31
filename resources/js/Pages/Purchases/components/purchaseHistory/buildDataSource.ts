import { formatDate } from '@/lib/format';
import type { PurchaseEntryRow } from '@/Pages/Purchases/types';
import type { PurchaseGroupBy, PurchaseTableRecord } from './types';

export function buildPurchaseHistoryDataSource(
    entries: PurchaseEntryRow[],
    groupBy: PurchaseGroupBy,
): PurchaseTableRecord[] {
    if (groupBy === 'none') {
        return entries.map((entry) => ({
            ...entry,
            key: String(entry.id),
        }));
    }

    return Object.entries(
        entries.reduce<Record<string, PurchaseEntryRow[]>>((groups, entry) => {
            const key =
                groupBy === 'product'
                    ? entry.product ?? 'Produto removido'
                    : groupBy === 'source'
                      ? entry.source === 'invoice'
                          ? 'Nota fiscal'
                          : 'Manual'
                      : groupBy === 'invoice_reference'
                        ? entry.invoice_reference || 'Sem referencia'
                        : formatDate(entry.purchased_at);

            groups[key] ??= [];
            groups[key].push(entry);

            return groups;
        }, {}),
    ).map(([label, groupEntries]) => ({
        key: `group-${groupBy}-${label}`,
        id: `group-${groupBy}-${label}`,
        isGroup: true,
        groupLabel: label,
        groupValue: label,
        groupBy,
        product_id: null,
        product: groupBy === 'product' ? label : null,
        unit: null,
        account_id: null,
        account: null,
        quantity: groupEntries.reduce((total, entry) => total + entry.quantity, 0),
        unit_price: 0,
        total_amount: groupEntries.reduce((total, entry) => total + entry.total_amount, 0),
        source:
            groupBy === 'source' && label === 'Nota fiscal'
                ? 'invoice'
                : groupBy === 'source' && label === 'Manual'
                  ? 'manual'
                  : '',
        invoice_reference: groupBy === 'invoice_reference' ? label : null,
        notes: `${groupEntries.length} registros`,
        purchased_at: groupBy === 'date' ? groupEntries[0]?.purchased_at ?? null : null,
        created_at: null,
        children: groupEntries.map((entry) => ({
            ...entry,
            key: String(entry.id),
        })),
    }));
}
