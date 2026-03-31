type LoginCredentials = {
	email: string;
	password: string;
};

type RegisterUserOptions = Partial<{
	name: string;
	email: string;
	password: string;
	houseName: string;
	houseCode: string;
	housePassword: string;
}>;

const uniqueSuffix = () => `${Date.now()}${Cypress._.random(1000, 9999)}`;

const buildRegisterPayload = (options: RegisterUserOptions = {}) => {
	const suffix = uniqueSuffix();

	return {
		name: options.name ?? `Usuario E2E ${suffix}`,
		email: options.email ?? `e2e.${suffix}@financy.test`,
		password: options.password ?? 'SenhaE2E@123',
		houseName: options.houseName ?? `Casa E2E ${suffix}`,
		houseCode: options.houseCode ?? `casa-e2e-${suffix}`,
		housePassword: options.housePassword ?? 'casa123456',
	};
};

Cypress.Commands.add('loginByUi', ({ email, password }: LoginCredentials) => {
	cy.clearCookies();
	cy.clearLocalStorage();
	cy.visit('/login', { timeout: 120000 });

	cy.get('input#email').clear().type(email);
	cy.get('input#password').clear().type(password);
	cy.contains('button', 'Entrar').click();

	cy.url({ timeout: 20000 }).should('not.include', '/login');
});

Cypress.Commands.add('registerAndLogin', (options: RegisterUserOptions = {}) => {
	const payload = buildRegisterPayload(options);

	cy.clearCookies();
	cy.clearLocalStorage();
	cy.visit('/register', { timeout: 120000 });

	cy.get('input#name').clear().type(payload.name);
	cy.get('input#email').clear().type(payload.email);
	cy.get('input#password').clear().type(payload.password);
	cy.get('input#password_confirmation').clear().type(payload.password);
	cy.get('input#house_name').clear().type(payload.houseName);
	cy.get('input#house_code').clear().type(payload.houseCode);
	cy.get('input#house_password').clear().type(payload.housePassword);

	cy.contains('button', 'Criar conta').click();
	cy.url({ timeout: 20000 }).should('not.include', '/register');

	return cy.wrap(
		{
			email: payload.email,
			password: payload.password,
		},
		{ log: false },
	);
});

declare global {
	namespace Cypress {
		interface Chainable {
			loginByUi(credentials: LoginCredentials): Chainable<void>;
			registerAndLogin(options?: RegisterUserOptions): Chainable<LoginCredentials>;
		}
	}
}

export {};
