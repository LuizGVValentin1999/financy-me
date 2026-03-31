describe('Auth smoke', () => {
    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
    });

    it('responde a pagina de login', () => {
        cy.request('/login').then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.include('Auth\\/Login');
        });
    });

    it('navega entre login e cadastro', () => {
        cy.visit('/register');
        cy.contains('Criar seu acesso.').should('be.visible');
        cy.get('input#name').should('be.visible');
        cy.get('input#house_code').should('be.visible');

        cy.contains('Ja tem conta?').click();
        cy.url().should('include', '/login');
    });

    it('autentica com comandos customizados', () => {
        cy.registerAndLogin().then((credentials) => {
            cy.visit('/profile');
            cy.contains('Gerenciar Casas').should('be.visible');

            cy.loginByUi(credentials);

            cy.visit('/dashboard');
            cy.contains('Visao geral da casa.').should('be.visible');
        });
    });
});
