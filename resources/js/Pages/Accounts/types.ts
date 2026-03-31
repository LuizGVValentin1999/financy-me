export interface AccountsPageProps {
    accounts: Array<{
        id: number;
        code: string;
        name: string;
        initial_balance: number;
        initial_balance_date: string;
        created_at: string;
    }>;
}

export type AccountRow = AccountsPageProps['accounts'][number];
export type AccountTableRecord = AccountRow & { key: string };
