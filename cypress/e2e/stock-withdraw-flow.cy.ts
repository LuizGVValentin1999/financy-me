describe('Stock withdraw flow', () => {
    it('retira quantidade do estoque de um produto estocavel', () => {
        const productName = `Produto Estoque E2E ${Date.now()}`;
        const productSku = `ESTOQUE-E2E-${Date.now()}`;

        cy.registerAndLogin();

        cy.visit('/products');
        cy.contains('button', 'Novo produto').click();

        cy.intercept('POST', '**/products').as('storeProduct');
        cy.get('input#name').type(productName);
        cy.get('input#sku').type(productSku);
        cy.contains('button', 'Criar produto').click();
        cy.wait('@storeProduct')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.visit('/purchases');
        cy.contains('button', 'Nova compra manual').click();

        cy.get('input#product_id').click({ force: true }).type(productName);
        cy.contains('.ant-select-item-option-content', productName, { timeout: 10000 }).click();

        cy.intercept('POST', '**/purchases').as('storePurchase');
        cy.get('input#quantity').clear().type('5');
        cy.get('input#unit_price').clear().type('10.00');
        cy.contains('button', 'Registrar compra').click();
        cy.wait('@storePurchase')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.visit('/stock');

        cy.contains('tr', productName, { timeout: 10000 }).as('productRow');
        cy.get('@productRow').click();
        cy.contains('Retirar do estoque').should('be.visible');

        cy.intercept('POST', '**/stock/withdraw').as('withdrawStock');
        cy.get('input#quantity').clear().type('2');
        cy.contains('button', 'Confirmar retirada').click();

        cy.wait('@withdrawStock')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.get('input#quantity').should('not.be.visible');
        cy.contains('tr', productName, { timeout: 10000 }).should('contain.text', '3 un');
    });
});
