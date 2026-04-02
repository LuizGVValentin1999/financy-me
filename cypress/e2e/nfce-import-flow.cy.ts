describe('NFC-e import flow', () => {
    it('oferece a opcao de escanear QR Code na modal de importacao', () => {
        cy.registerAndLogin();
        cy.visit('/purchases');

        cy.contains('button', 'Importar NFC-e').click({ force: true });
        cy.get('input#receipt_url', { timeout: 10000 }).should('exist');
        cy.contains('button', 'Escanear QR Code').click({ force: true });

        cy.contains('Ler imagem do QR Code').should('exist');
        cy.get('input#receipt_url').should('exist');
    });

    it('valida URL HTTP/HTTPS antes de importar', () => {
        cy.registerAndLogin();
        cy.visit('/purchases');

        cy.contains('button', 'Importar NFC-e').click({ force: true });
        cy.get('input#receipt_url', { timeout: 10000 }).should('exist').type('nota-sem-http', {
            force: true,
        });

        cy.intercept('POST', '**/purchases/import-link').as('importLink');
        cy.contains('button', 'Buscar nota').click({ force: true });

        cy.wait('@importLink')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303, 422]);

        cy.contains('Informe um link HTTP ou HTTPS valido da NFC-e.').should('be.visible');
    });
});
