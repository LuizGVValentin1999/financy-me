describe('NFC-e import flow', () => {
    it('valida URL HTTP/HTTPS antes de importar', () => {
        cy.registerAndLogin();
        cy.visit('/purchases');

        cy.contains('button', 'Importar NFC-e').click();
        cy.get('input#receipt_url').should('be.visible').type('nota-sem-http');

        cy.intercept('POST', '**/purchases/import-link').as('importLink');
        cy.contains('button', 'Buscar nota').click();

        cy.wait('@importLink')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303, 422]);

        cy.contains('Informe um link HTTP ou HTTPS valido da NFC-e.').should('be.visible');
    });
});
