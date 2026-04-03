describe('Full app journey', () => {
    const nfceUrl =
        'https://www.fazenda.pr.gov.br/nfce/qrcode?p=41260376189406004628651260003094931004085409|2|1|1|32D7052D8E169C149194A35193D5187134762527';

    const assertStatCard = (label: string, expectedText: string) => {
        cy.contains('p', label)
            .parent()
            .should('contain.text', expectedText);
    };

    it('cobre cadastro, operacao, filtros e exclusao de conta do usuario', () => {
        const suffix = Date.now();
        const password = 'SenhaE2E@123';
        const credentials = {
            name: `Usuario Jornada ${suffix}`,
            email: `jornada.${suffix}@financy.test`,
            password,
            houseName: `Casa Jornada ${suffix}`,
            houseCode: `casa-jornada-${suffix}`,
            housePassword: 'casa123456',
        };
        const marketCategory = `Mercado E2E ${suffix}`;
        const servicesCategory = `Servicos E2E ${suffix}`;
        const accountAName = `Conta A ${suffix}`;
        const accountBName = `Conta B ${suffix}`;
        const accountACode = `CTA-A-${suffix}`;
        const accountBCode = `CTA-B-${suffix}`;
        const serviceName = `Servico de limpeza ${suffix}`;
        const quickServiceName = `Servico avulso ${suffix}`;

        cy.registerAndLogin(credentials);

        cy.contains('button', 'Sair').click({ force: true });
        cy.url({ timeout: 20000 }).should('include', '/login');

        cy.loginByUi({
            email: credentials.email,
            password,
        });
        cy.url({ timeout: 20000 }).should('include', '/dashboard');

        cy.visit('/categories');

        cy.contains('button', 'Nova categoria').click();
        cy.intercept('POST', '**/categories').as('storeCategory');
        cy.get('input#name').type(marketCategory);
        cy.get('input#code').type(`CAT-M-${suffix}`);
        cy.contains('button', 'Criar categoria').click();
        cy.wait('@storeCategory')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);
        cy.contains('tr', marketCategory, { timeout: 10000 }).should('be.visible');
        cy.assertNoVisibleModal();
        cy.contains('button', 'Nova categoria').click({ force: true });
        cy.intercept('POST', '**/categories').as('storeSecondCategory');
        cy.get('input#name').type(servicesCategory);
        cy.get('input#code').type(`CAT-S-${suffix}`);
        cy.contains('button', 'Criar categoria').click();
        cy.wait('@storeSecondCategory')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);
        cy.contains('tr', servicesCategory, { timeout: 10000 }).should(
            'be.visible',
        );
        cy.assertNoVisibleModal();

        cy.visit('/accounts');

        cy.contains('button', 'Nova conta').click();
        cy.intercept('POST', '**/accounts').as('storeAccount');
        cy.get('input#name').type(accountAName);
        cy.get('input#code').type(accountACode);
        cy.get('input#initial_balance').clear().type('1000');
        cy.contains('button', 'Criar conta').click();
        cy.wait('@storeAccount')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);
        cy.contains('tr', accountAName, { timeout: 10000 }).should('be.visible');
        cy.assertNoVisibleModal();
        cy.contains('button', 'Nova conta').click({ force: true });
        cy.intercept('POST', '**/accounts').as('storeSecondAccount');
        cy.get('input#name').type(accountBName);
        cy.get('input#code').type(accountBCode);
        cy.get('input#initial_balance').clear().type('500');
        cy.contains('button', 'Criar conta').click();
        cy.wait('@storeSecondAccount')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);
        cy.contains('tr', accountBName, { timeout: 10000 }).should('be.visible');
        cy.assertNoVisibleModal();

        cy.visit('/purchases');

        cy.contains('button', 'Importar NFC-e').click();
        cy.intercept('POST', '**/purchases/import-link').as('importNfce');
        cy.get('input#receipt_url').type(nfceUrl);
        cy.contains('button', 'Buscar nota').click();
        cy.wait('@importNfce')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.contains('Revisar NFC-e importada', { timeout: 10000 }).should(
            'be.visible',
        );
        cy.contains('Pagamento da nota').should('be.visible');
        cy.contains('Confirmar NFC-e').should('be.visible');
        cy.assertNoVisibleModal();
        cy.selectAntdOption('payments.0.account_id', `${accountACode} - ${accountAName}`);
        cy.selectAntdOption('items.0.category_id', marketCategory);
        cy.selectAntdOption('items.1.category_id', marketCategory);

        cy.intercept('POST', '**/purchases/import-confirm').as('confirmImport');
        cy.contains('button', 'Confirmar NFC-e').click();
        cy.wait('@confirmImport')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);
        cy.assertNoVisibleModal();

        cy.visit('/products');
        cy.createProductViaUi({
            name: serviceName,
            brand: 'Equipe E2E',
            sku: `SERV-${suffix}`,
            category: servicesCategory,
            type: /N[aã]o estoc[aá]vel/,
        });

        cy.contains('tr', 'ARROZ TIPO 1', { timeout: 10000 }).should(
            'contain.text',
            marketCategory,
        );
        cy.contains('tr', 'FEIJAO PRETO').should('contain.text', marketCategory);
        cy.contains('tr', serviceName).should('contain.text', servicesCategory);

        cy.visit('/purchases');
        cy.createManualPurchaseViaUi({
            productName: serviceName,
            accountLabel: `${accountBCode} - ${accountBName}`,
            quantity: '1',
            unitPrice: '30.00',
        });

        cy.visit('/purchases');

        cy.contains('button', 'Nova compra manual').click();
        cy.get('input#product_id').clear({ force: true }).type(quickServiceName, {
            force: true,
        });
        cy.contains('button', 'Cadastrar novo produto agora').click();
        cy.intercept('POST', '**/products/quick').as('quickStoreService');
        cy.get('input#quick_product_name').should('have.value', quickServiceName);
        cy.selectAntdOption('quick_product_category', servicesCategory);
        cy.selectAntdOption('quick_product_type', /N[aã]o estoc[aá]vel/);
        cy.contains('button', 'Criar produto').click();
        cy.wait('@quickStoreService')
            .its('response.statusCode')
            .should('eq', 201);
        cy.get('.ant-modal-wrap:visible', { timeout: 10000 }).should(
            'have.length',
            1,
        );
        cy.get('.ant-modal-wrap:visible')
            .last()
            .within(() => {
                cy.get('input#account_id', { timeout: 10000 }).should('exist');
            });
        cy.selectAntdOption('account_id', `${accountBCode} - ${accountBName}`);
        cy.intercept('POST', '**/purchases').as('storeQuickServicePurchase');
        cy.get('.ant-modal-wrap:visible')
            .last()
            .within(() => {
                cy.get('input#quantity').clear({ force: true }).type('1', {
                    force: true,
                });
                cy.get('input#unit_price').clear({ force: true }).type('18.00', {
                    force: true,
                });
            });
        cy.contains('button', 'Registrar compra').click();
        cy.wait('@storeQuickServicePurchase')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);
        cy.assertNoVisibleModal();

        cy.visit('/stock');

        cy.contains('tr', 'ARROZ TIPO 1', { timeout: 10000 }).should(
            'contain.text',
            marketCategory,
        );
        cy.contains('tr', 'FEIJAO PRETO').should('contain.text', marketCategory);
        cy.contains(serviceName).should('not.exist');
        cy.contains(quickServiceName).should('not.exist');

        cy.withdrawStockViaUi({
            productName: 'FEIJAO PRETO',
            quantity: '1',
            expectedStockText: '1 un',
        });

        cy.visit('/dashboard');

        assertStatCard('Gasto no periodo', '67,99');
        assertStatCard('Saldo das contas', '1.432,01');
        assertStatCard('Movimentacoes no periodo', '4');
        cy.contains('Periodo:').should('be.visible');
        cy.contains('ARROZ TIPO 1').should('be.visible');
        cy.contains('FEIJAO PRETO').should('be.visible');
        cy.contains(serviceName).should('be.visible');
        cy.contains(quickServiceName).should('be.visible');

        cy.contains('button', 'Filtros').click();
        cy.selectAntdOption('filter-categories', servicesCategory);
        cy.selectAntdOption('filter-accounts', `${accountBCode} - ${accountBName}`);
        cy.selectAntdOption('filter-products', `${quickServiceName} (servico)`, true);
        cy.contains('button', 'Aplicar filtros').click();
        cy.assertNoVisibleModal();

        cy.contains(`Categoria: ${servicesCategory}`, {
            timeout: 10000,
        }).should('be.visible');
        cy.contains(`Cartao/Conta: ${accountBCode} - ${accountBName}`).should(
            'be.visible',
        );
        cy.contains(`Item: ${quickServiceName} (servico)`).should('be.visible');
        assertStatCard('Gasto no periodo', '18,00');
        assertStatCard('Saldo das contas', '1.432,01');
        assertStatCard('Movimentacoes no periodo', '1');
        cy.contains(quickServiceName).should('be.visible');
        cy.contains('ARROZ TIPO 1').should('not.exist');
        cy.contains('FEIJAO PRETO').should('not.exist');
        cy.contains(serviceName).should('not.exist');

        cy.visit('/profile');
        cy.contains('button', 'Excluir conta e casa ativa').click();
        cy.get('.app-responsive-modal input#password').type(password);
        cy.intercept('DELETE', '**/profile/with-house').as('deleteProfile');
        cy.get('.app-responsive-modal')
            .contains('button', 'Excluir conta e casa ativa')
            .click();
        cy.wait('@deleteProfile')
            .its('response.statusCode')
            .should('be.oneOf', [200, 302, 303]);

        cy.visit('/login');
        cy.get('input#email').type(credentials.email);
        cy.get('input#password').type(password);
        cy.contains('button', 'Entrar').click();
        cy.url({ timeout: 20000 }).should('include', '/login');
    });
});
