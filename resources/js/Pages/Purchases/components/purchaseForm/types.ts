export type ProductOption = {
    id: number;
    name: string;
    unit: string;
    current_stock: number;
    category: string | null;
    category_id: number | null;
};

export type CategoryOption = {
    id: number;
    name: string;
};

export type SourceOption = {
    value: string;
    label: string;
};

export type AccountOption = {
    id: number;
    code: string;
    name: string;
};
