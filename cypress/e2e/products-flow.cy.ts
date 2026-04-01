describe('Product flow', () => {
    it('cria um novo produto manualmente', () => {
        const productName = `Produto E2E ${Date.now()}`;
        const productSku = `E2E-${Date.now()}`;

        cy.registerAndLogin();
        cy.visit('/products');

        cy.createProductViaUi({
            name: productName,
            brand: 'Marca E2E',
            sku: productSku,
        });

        cy.contains(productName, { timeout: 10000 }).should('be.visible');
    });
});
