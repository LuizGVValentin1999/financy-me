import './commands';

afterEach(() => {
    if (Cypress.env('cleanupAfterTest') === true) {
        cy.cleanupCurrentUserAndHouse();
    }
});
