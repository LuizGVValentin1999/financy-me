describe('Purchase flow', () => {
    it('cria produto e registra compra manual', () => {
        const productName = `Produto Compra E2E ${Date.now()}`;
        const productSku = `COMPRA-E2E-${Date.now()}`;

        cy.registerAndLogin();

        cy.visit('/products');
        cy.createProductViaUi({
            name: productName,
            sku: productSku,
        });

        cy.visit('/purchases');
        cy.createManualPurchaseViaUi({
            productName,
            quantity: '2',
            unitPrice: '12.50',
        });

        cy.contains(productName).should('be.visible');
        cy.contains('Erro ao criar compra').should('not.exist');
    });
});
