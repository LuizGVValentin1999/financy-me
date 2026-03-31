import type { PurchaseEntryRow } from '@/Pages/Purchases/types';

export type PurchaseGroupBy =
    | 'none'
    | 'product'
    | 'source'
    | 'invoice_reference'
    | 'date';

export type PurchaseGroupRecord = {
    key: string;
    id: string;
    isGroup: true;
    groupLabel: string;
    groupValue: string;
    groupBy: string;
    product_id: null;
    product: string | null;
    unit: string | null;
    account_id: null;
    account: null;
    quantity: number;
    unit_price: number;
    total_amount: number;
    source: string;
    invoice_reference: string | null;
    notes: string | null;
    purchased_at: string | null;
    created_at: string | null;
    children: PurchaseTableRecord[];
};

export type PurchaseTableRecord =
    | (PurchaseEntryRow & {
          key: string;
          isGroup?: false;
      })
    | PurchaseGroupRecord;
