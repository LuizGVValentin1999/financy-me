export interface ProductsPageProps {
    categories: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    units: Array<{
        value: string;
        label: string;
    }>;
    products: Array<{
        id: number;
        category_id: number | null;
        name: string;
        brand: string | null;
        sku: string | null;
        unit: string;
        type: 'stockable' | 'non_stockable';
        minimum_stock: number;
        current_stock: number;
        is_active: boolean;
        notes: string | null;
        category: { name: string; color: string } | null;
        total_spent: number;
        last_purchase_at: string | null;
    }>;
}

export type ProductRow = ProductsPageProps['products'][number];
export type ProductTableRecord = ProductRow & { key: string };
