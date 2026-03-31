export interface PurchasesPageProps {
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
    accounts: Array<{
        id: number;
        code: string;
        name: string;
    }>;
    importUnits: Array<{
        value: string;
        label: string;
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
            is_discount: boolean;
            suggested_product_id: number | null;
            suggested_product_name: string;
            suggested_category_id: number | null;
            suggestion_score: number | null;
            suggested_unit: string;
        }>;
    } | null;
    entries: Array<{
        id: number;
        product_id: number | null;
        product: string | null;
        unit: string | null;
        account_id: number | null;
        account: { id: number; code: string; name: string } | null;
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

export type PurchaseEntryRow = PurchasesPageProps['entries'][number];
