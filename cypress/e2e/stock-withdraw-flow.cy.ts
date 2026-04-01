describe('Stock withdraw flow', () => {
    it('retira quantidade do estoque de um produto estocavel', () => {
        const productName = `Produto Estoque E2E ${Date.now()}`;
        const productSku = `ESTOQUE-E2E-${Date.now()}`;

        cy.registerAndLogin();

        cy.visit('/products');
        cy.createProductViaUi({
            name: productName,
            sku: productSku,
        });

        cy.visit('/purchases');
        cy.createManualPurchaseViaUi({
            productName,
            quantity: '5',
            unitPrice: '10.00',
        });

        cy.visit('/stock');
        cy.withdrawStockViaUi({
            productName,
            quantity: '2',
            expectedStockText: '3 un',
        });
    });
});
