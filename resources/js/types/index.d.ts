export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    active_house_id?: number | null;
    currentHouse?: {
        id: number;
        name: string;
        code: string;
        description?: string;
    } | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    cache: {
        houseDataVersion?: string | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
};
