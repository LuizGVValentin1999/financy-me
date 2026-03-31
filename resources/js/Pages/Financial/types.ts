export interface FinancialPageProps {
    accounts: Array<{
        id: number;
        code: string;
        name: string;
    }>;
    categories: Array<{
        id: number;
        code: string;
        name: string;
        color: string;
    }>;
    entries: Array<{
        id: number;
        account_id: number | null;
        account: { id: number; code: string; name: string } | null;
        category_id: number | null;
        category: { id: number; code: string; name: string; color: string } | null;
        direction: 'inflow' | 'outflow';
        origin: string;
        amount: number;
        moved_at: string | null;
        description: string | null;
        created_at: string | null;
    }>;
}

export type EntryRow = FinancialPageProps['entries'][number];
export type EntryTableRecord = EntryRow & { key: string };
