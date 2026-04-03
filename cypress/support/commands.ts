type LoginCredentials = {
	email: string;
	password: string;
};

type AntdSelectOption = string | RegExp;

type RegisterUserOptions = Partial<{
	name: string;
	email: string;
	password: string;
	houseName: string;
	houseCode: string;
	housePassword: string;
}>;

type CreateProductOptions = {
	name: string;
	brand?: string;
	sku?: string;
	category?: AntdSelectOption;
	type?: AntdSelectOption;
};

type CreateAccountOptions = {
	name: string;
	code: string;
	initialBalance?: string;
	initialBalanceDate?: string;
};

type CreateManualPurchaseOptions = {
	productName: string;
	accountLabel?: string;
	quantity: string;
	unitPrice: string;
};

type WithdrawStockOptions = {
	productName: string;
	quantity: string;
	expectedStockText?: string;
};

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

	Cypress.env('__cleanup_credentials', {
		email: payload.email,
		password: payload.password,
	});

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

	cy.contains('button', 'Criar conta').should('not.be.disabled').click({ force: true });
	cy.url({ timeout: 20000 }).should('not.include', '/register');

	return cy.wrap(
		{
			email: payload.email,
			password: payload.password,
		},
		{ log: false },
	);
});

Cypress.Commands.add('cleanupCurrentUserAndHouse', () => {
	const credentials = Cypress.env('__cleanup_credentials') as
		| LoginCredentials
		| undefined;

	if (!credentials?.email || !credentials?.password) {
		return cy.wrap(null, { log: false });
	}

	cy.clearCookies();
	cy.clearLocalStorage();
	cy.visit('/login', { timeout: 120000, failOnStatusCode: false });
	cy.get('body').then(($body) => {
		if ($body.find('input#email').length > 0) {
			cy.get('input#email').clear().type(credentials.email);
			cy.get('input#password').clear().type(credentials.password);
			cy.contains('button', 'Entrar').click();
		}
	});

	cy.visit('/profile', { timeout: 120000, failOnStatusCode: false });
	cy.get('body').then(($body) => {
		if (
			$body.text().includes('Excluir conta e casa ativa') &&
			$body.find('input#password').length === 0
		) {
			cy.contains('button', 'Excluir conta e casa ativa').click({ force: true });
			cy.get('input#password', { timeout: 10000 }).clear().type(credentials.password, {
				force: true,
			});
			cy.intercept('DELETE', '**/profile/with-house').as('deleteProfileWithHouse');
			cy.contains('button', 'Excluir conta e casa ativa').last().click({ force: true });
			cy.wait('@deleteProfileWithHouse')
				.its('response.statusCode')
				.should('be.oneOf', [200, 302, 303]);
		}
	});

	cy.url({ timeout: 20000 }).then(() => {
		Cypress.env('__cleanup_credentials', null);
	});
});

Cypress.Commands.add(
	'selectAntdOption',
	(id: string, option: AntdSelectOption, searchable = false) => {
		cy.get(`input[id="${id}"]`).click({ force: true });

		cy.get('body')
			.find('.ant-select-dropdown:not(.ant-select-dropdown-hidden)', {
				timeout: 10000,
			})
			.should('have.length.at.least', 1);

		if (searchable && typeof option === 'string') {
			cy.get(`input[id="${id}"]`)
				.clear({ force: true })
				.type(option, { force: true });
		}

		cy.get('body')
			.find('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
			.last()
			.contains('.ant-select-item-option-content', option, {
				timeout: 10000,
			})
			.click({ force: true });
	},
);

Cypress.Commands.add('assertNoVisibleModal', () => {
	cy.get('body', { timeout: 15000 }).should(($body) => {
		expect($body.find('.ant-modal-wrap:visible').length).to.equal(0);
	});
});

Cypress.Commands.add('createProductViaUi', (options: CreateProductOptions) => {
	cy.contains('button', 'Novo produto').click();
	cy.intercept('POST', '**/products').as('storeProduct');
	cy.get('input#name', { timeout: 10000 }).should('exist').type(options.name, {
		force: true,
	});

	if (options.brand) {
		cy.get('input#brand').type(options.brand, { force: true });
	}

	if (options.sku) {
		cy.get('input#sku').type(options.sku, { force: true });
	}

	if (options.category) {
		cy.selectAntdOption('category_id', options.category);
	}

	if (options.type) {
		cy.selectAntdOption('type', options.type);
	}

	cy.contains('button', 'Criar produto').click();
	cy.wait('@storeProduct')
		.its('response.statusCode')
		.should('be.oneOf', [200, 302, 303]);
	cy.assertNoVisibleModal();
});

Cypress.Commands.add('createAccountViaUi', (options: CreateAccountOptions) => {
	cy.contains('button', 'Nova conta').click();
	cy.intercept('POST', '**/accounts').as('storeAccount');
	cy.get('input#name', { timeout: 10000 }).clear().type(options.name, {
		force: true,
	});
	cy.get('input#code').clear().type(options.code, { force: true });
	cy.get('input#initial_balance').clear().type(options.initialBalance ?? '0', {
		force: true,
	});

	if (options.initialBalanceDate) {
		cy.get('input#initial_balance_date')
			.clear({ force: true })
			.type(options.initialBalanceDate, { force: true })
			.type('{enter}', { force: true });
	}

	cy.contains('button', 'Criar conta').click();
	cy.wait('@storeAccount')
		.its('response.statusCode')
		.should('be.oneOf', [200, 302, 303]);
	cy.assertNoVisibleModal();
});

Cypress.Commands.add(
	'createManualPurchaseViaUi',
	({ productName, accountLabel, quantity, unitPrice }: CreateManualPurchaseOptions) => {
		const generatedAccountName = `Conta Compra E2E ${Date.now()}`;
		const generatedAccountCode = `CP-${Date.now()}`;

		cy.contains('button', 'Nova compra manual').click();
		cy.contains('button', 'Avancar para produtos').click();
		cy.selectAntdOption('manual_item_0_product_id', productName, true);
		cy.get('input#manual_item_0_quantity').clear().type(quantity);
		cy.get('input#manual_item_0_unit_price').clear().type(unitPrice);
		cy.contains('button', 'Ir para pagamento').click();

		if (accountLabel) {
			cy.selectAntdOption('manual_payments_0_account_id', accountLabel);
		} else {
			cy.contains('button', 'Nova conta').click();
			cy.intercept('POST', '**/accounts').as('storeManualPurchaseAccount');
			cy.get('input#manual_purchase_account_name').type(generatedAccountName);
			cy.get('input#manual_purchase_account_code').type(generatedAccountCode);
			cy.contains('button', 'Criar conta').click();
			cy.wait('@storeManualPurchaseAccount')
				.its('response.statusCode')
				.should('eq', 201);
		}

		cy.intercept('POST', '**/purchases').as('storePurchase');
		cy.contains('button', 'Registrar compra').click();
		cy.wait('@storePurchase')
			.its('response.statusCode')
			.should('be.oneOf', [200, 302, 303]);
		cy.assertNoVisibleModal();
	},
);

Cypress.Commands.add(
	'withdrawStockViaUi',
	({ productName, quantity, expectedStockText }: WithdrawStockOptions) => {
		cy.contains('tr', productName, { timeout: 10000 }).as('stockRow');
		cy.get('@stockRow').click();
		cy.intercept('POST', '**/stock/withdraw').as('withdrawStock');
		cy.get('input#quantity').clear().type(quantity);
		cy.contains('button', 'Confirmar retirada').click();
		cy.wait('@withdrawStock')
			.its('response.statusCode')
			.should('be.oneOf', [200, 302, 303]);
		cy.assertNoVisibleModal();

		if (expectedStockText) {
			cy.contains('tr', productName, { timeout: 10000 }).should(
				'contain.text',
				expectedStockText,
			);
		}
	},
);

declare global {
	namespace Cypress {
		interface Chainable {
			loginByUi(credentials: LoginCredentials): Chainable<void>;
			registerAndLogin(options?: RegisterUserOptions): Chainable<LoginCredentials>;
			cleanupCurrentUserAndHouse(): Chainable<void>;
			selectAntdOption(
				id: string,
				option: AntdSelectOption,
				searchable?: boolean,
			): Chainable<void>;
			assertNoVisibleModal(): Chainable<void>;
			createProductViaUi(options: CreateProductOptions): Chainable<void>;
			createAccountViaUi(options: CreateAccountOptions): Chainable<void>;
			createManualPurchaseViaUi(
				options: CreateManualPurchaseOptions,
			): Chainable<void>;
			withdrawStockViaUi(options: WithdrawStockOptions): Chainable<void>;
		}
	}
}

export {};
