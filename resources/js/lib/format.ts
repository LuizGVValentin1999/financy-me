const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

const quantityFormatter = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 3,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
});

export function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0);
}

export function formatQuantity(value: number) {
    return quantityFormatter.format(value || 0);
}

export function formatDate(value?: string | null) {
    if (!value) {
        return '--';
    }

    const normalizedValue = value.includes('T')
        ? value
        : value.includes(' ')
          ? value.replace(' ', 'T')
          : `${value}T00:00:00`;

    const parsedDate = new Date(normalizedValue);

    if (Number.isNaN(parsedDate.getTime())) {
        return '--';
    }

    return dateFormatter.format(parsedDate);
}
