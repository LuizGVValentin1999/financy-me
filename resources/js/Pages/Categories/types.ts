export interface CategoriesPageProps {
    categories: Array<{
        id: number;
        code: string;
        name: string;
        color: string;
        description: string | null;
        created_at: string;
    }>;
}

export type CategoryRow = CategoriesPageProps['categories'][number];
export type CategoryTableRecord = CategoryRow & { key: string };
