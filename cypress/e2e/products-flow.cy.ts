describe('Product flow', () => {
    it('cria um novo produto manualmente', () => {
        const productName = `Produto E2E ${Date.now()}`;
        const productSku = `E2E-${Date.now()}`;

        cy.registerAndLogin();
        cy.visit('/products');

        cy.contains('button', 'Novo produto').click();

        cy.intercept('POST', '**/products').as('storeProduct');

        cy.get('input#name').should('be.visible').type(productName);
        cy.get('input#brand').type('Marca E2E');
        cy.get('input#sku').type(productSku);

        cy.contains('button', 'Criar produto').click();
        cy.wait('@storeProduct')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.contains(productName, { timeout: 10000 }).should('be.visible');
    });
});
