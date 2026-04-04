describe('Purchase flow', () => {
    it('cria produto e registra compra manual', () => {
        const productName = `Produto Compra E2E ${Date.now()}`;
        const productSku = `COMPRA-E2E-${Date.now()}`;
        const purchaseItemNotes = `Observacao item compra E2E ${Date.now()}`;

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
            purchaseItemNotes,
        });

        cy.contains(productName).should('be.visible');
        cy.contains(purchaseItemNotes).should('exist');
        cy.contains('Erro ao criar compra').should('not.exist');
    });

    it('atualiza o nome do produto em compras apos editar no catalogo e revisitar a tela no mobile', () => {
        const suffix = Date.now();
        const productName = `Produto Cache Mobile ${suffix}`;
        const updatedProductName = `Produto Mobile Atualizado ${suffix}`;

        cy.viewport('iphone-x');
        cy.registerAndLogin();

        cy.visit('/products');
        cy.createProductViaUi({
            name: productName,
            sku: `CACHE-MOBILE-${suffix}`,
        });

        cy.visit('/purchases');
        cy.createManualPurchaseViaUi({
            productName,
            quantity: '1',
            unitPrice: '9.99',
        });

        cy.contains(productName, { timeout: 10000 }).should('be.visible');

        cy.visit('/products');
        cy.contains(productName, { timeout: 10000 }).click({ force: true });
        cy.intercept('PATCH', '**/products/*').as('updateProduct');
        cy.get('input#edit_name', { timeout: 10000 })
            .should('be.visible')
            .clear({ force: true })
            .type(updatedProductName, { force: true });
        cy.contains('button', 'Salvar alteracoes').click({ force: true });
        cy.wait('@updateProduct')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);
        cy.assertNoVisibleModal();

        cy.visit('/purchases');
        cy.contains(updatedProductName, { timeout: 10000 }).should('be.visible');
        cy.contains(productName).should('not.exist');

        cy.contains('button', 'Nova compra manual').click({ force: true });
        cy.contains('button', /Avançar para produtos|Produtos/).click({ force: true });
        cy.get('input[id="manual_item_0_product_id"]').click({ force: true });
        cy.get('input[id="manual_item_0_product_id"]')
            .clear({ force: true })
            .type(updatedProductName, { force: true });
        cy.get('body')
            .find('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
            .last()
            .should('contain.text', updatedProductName)
            .and('not.contain.text', productName);
    });
});
