import dayjs from 'dayjs';

export function todayDateInputValue() {
    return dayjs().format('YYYY-MM-DD');
}

export function parseDatePreservingLocalDay(value: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    const normalizedValue = value.includes('T')
        ? value
        : value.includes(' ')
          ? value.replace(' ', 'T')
          : `${value}T00:00:00`;

    return new Date(normalizedValue);
}
