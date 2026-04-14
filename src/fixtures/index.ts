import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { LoginModule } from '../modules/LoginModule';
import { ProductModule } from '../modules/ProductModule';
import { CheckoutModule } from '../modules/CheckoutModule';
import { config } from '../config';
import { Logger } from '../utils/Logger';

const logger = Logger.create('Fixtures');

export type TestFixtures = {
    // Page Objects
    loginPage: LoginPage;
    homePage: HomePage;
    productPage: ProductPage;
    checkoutPage: CheckoutPage;

    // Modules
    loginModule: LoginModule;
    productModule: ProductModule;
    checkoutModule: CheckoutModule;

    // Pre-authenticated page
    authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
    /**
     * Login Page fixture
     */
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    /**
     * Home Page fixture
     */
    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },

    /**
     * Product Page fixture
     */
    productPage: async ({ page }, use) => {
        await use(new ProductPage(page));
    },

    /**
     * Checkout Page fixture
     */
    checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page));
    },

    /**
     * Login Module fixture
     */
    loginModule: async ({ page }, use) => {
        await use(new LoginModule(page));
    },

    /**
     * Product Module fixture
     */
    productModule: async ({ page }, use) => {
        await use(new ProductModule(page));
    },

    /**
     * Checkout Module fixture
     */
    checkoutModule: async ({ page }, use) => {
        await use(new CheckoutModule(page));
    },

    /**
     * Pre-authenticated page fixture.
     *
     * Wraps the login flow in a try/catch so that:
     * 1. The browser context is ALWAYS closed (no resource leak) even when login fails.
     * 2. A descriptive error is thrown that clearly explains the failure mode,
     *    making CI diagnostics easier.
     */
    authenticatedPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            logger.info('authenticatedPage: starting login flow');

            const loginPage = new LoginPage(page);
            await loginPage.navigate();
            await loginPage.enterUsername(config.testUser.username);
            await loginPage.enterPassword(config.testUser.password);
            await loginPage.clickLogin();

            // Wait for the post-login URL; surface a clear error if it never arrives
            await page.waitForURL('**/home', {
                timeout: config.timeouts?.login ?? 30_000,
            }).catch((err: Error) => {
                throw new Error(
                    `authenticatedPage: login redirect to /home did not occur within timeout. ` +
                    `Current URL: "${page.url()}". Original error: ${err.message}`,
                );
            });

            logger.info(`authenticatedPage: login successful, current URL: ${page.url()}`);

            // Hand the authenticated page to the test
            await use(page);

            logger.info('authenticatedPage: test completed, closing context');
        } catch (error) {
            // Log full error detail before re-throwing so it appears in the reporter
            logger.error(
                `authenticatedPage: fixture setup failed — ${(error as Error).message}`,
            );
            throw error;
        } finally {
            // ALWAYS clean up the context regardless of pass/fail to prevent resource leaks
            await context.close().catch((closeErr: Error) => {
                logger.warn(`authenticatedPage: error while closing context — ${closeErr.message}`);
            });
        }
    },
});

export { expect } from '@playwright/test';
// Re-export auth fixtures
export { authTest, authenticatedTest } from './auth.fixture';
