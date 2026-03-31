type PaymentMethod = {
    method: string;
    amount: number;
};

type PaymentDraft = {
    type: string;
    principal_amount: string;
    installments: string;
    interest_type: string;
    interest_rate: string;
    installment_amount: string;
};

export function getMeaningfulPaymentMethods(paymentMethods: PaymentMethod[]): PaymentMethod[] {
    return paymentMethods.filter((payment) => {
        const normalizedMethod = payment.method
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        if (payment.amount <= 0) {
            return false;
        }

        if (!normalizedMethod) {
            return false;
        }

        return ![
            'forma de pagamento',
            'informacao dos tributos',
            'tributos totais incidentes',
            'lei federal',
            'valor aproximado dos tributos',
        ].some((fragment) => normalizedMethod.includes(fragment));
    });
}

export function calculateEstimatedFinancialTotal(payments: PaymentDraft[]): number {
    return payments.reduce((total, payment) => {
        const principalAmount = Number(payment.principal_amount) || 0;

        if (payment.type === 'cash') {
            return total + principalAmount;
        }

        const installments = Math.max(2, Number(payment.installments) || 2);

        if (payment.interest_type === 'fixed_installment') {
            return total + (Number(payment.installment_amount) || 0) * installments;
        }

        const rate = (Number(payment.interest_rate) || 0) / 100;
        if (rate <= 0) {
            return total + principalAmount;
        }

        const factor = Math.pow(1 + rate, installments);
        const installmentAmount = principalAmount * ((rate * factor) / (factor - 1));

        return total + installmentAmount * installments;
    }, 0);
}
