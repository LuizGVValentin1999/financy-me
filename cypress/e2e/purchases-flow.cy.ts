describe('Purchase flow', () => {
    it('cria produto e registra compra manual', () => {
        const productName = `Produto Compra E2E ${Date.now()}`;
        const productSku = `COMPRA-E2E-${Date.now()}`;

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
        cy.get('input#quantity').clear().type('2');
        cy.get('input#unit_price').clear().type('12.50');
        cy.contains('button', 'Registrar compra').click();

        cy.wait('@storePurchase').then(({ request, response }) => {
            expect(request.body.product_id).to.not.equal('');
            expect(request.body.quantity).to.equal('2');
            expect(request.body.unit_price).to.equal('12.50');
            expect(response?.statusCode).to.be.oneOf([200, 302, 303]);
        });

        cy.get('input#quantity').should('not.be.visible');
        cy.contains('Erro ao criar compra').should('not.exist');
    });
});
