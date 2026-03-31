describe('Financial flow', () => {
    it('cria, edita e exclui um lancamento manual', () => {
        const baseName = `Lancamento E2E ${Date.now()}`;
        const updatedName = `${baseName} atualizado`;

        const withinModal = (title: string, callback: () => void) => {
            cy.contains('h2', title).should('be.visible').closest('div.p-5').within(callback);
        };

        cy.registerAndLogin();
        cy.visit('/financial');

        cy.contains('button', 'Novo lançamento').click();

        cy.intercept('POST', '**/financial').as('storeFinancial');
        withinModal('Novo lançamento', () => {
            cy.get('input#amount').clear().type('89.90');
            cy.get('input#description').clear().type(baseName);
            cy.contains('button', 'Criar lançamento').click();
        });

        cy.wait('@storeFinancial')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.contains('tr', baseName, { timeout: 10000 }).should('be.visible').click();
        cy.contains('Editar lançamento').should('be.visible');

        cy.intercept('PATCH', '**/financial/*').as('updateFinancial');
        withinModal('Editar lançamento', () => {
            cy.get('input#description').clear().type(updatedName);
            cy.contains('button', 'Salvar alterações').click();
        });

        cy.wait('@updateFinancial')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.contains('tr', updatedName, { timeout: 10000 }).should('be.visible').click();
        cy.intercept('DELETE', '**/financial/*').as('deleteFinancial');
        withinModal('Editar lançamento', () => {
            cy.contains('button', 'Excluir').click();
        });
        cy.contains('.ant-modal-confirm-btns button', 'Sim').click();

        cy.wait('@deleteFinancial')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.contains('tr', updatedName, { timeout: 10000 }).should('not.exist');
    });
});
