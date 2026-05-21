import { test as base, expect } from '@playwright/test';
import {
    LoginPage,
    InventoryPage,
    ItemDetailPage,
    CartPage,
    CheckoutStepOnePage,
    CheckoutStepTwoPage,
    CheckoutCompletePage,
} from '../pages/ttacart';
import { generateUser, GuestUser } from '../utils/DataFactory';

/**
 * Typed fixtures for the TTACart suite.
 *
 * Each Page Object gets its own fixture so a spec can declare exactly what
 * it needs:
 *
 *   test('full checkout', async ({ inventoryPage, cartPage, ... }) => { });
 *
 * The `freshUser` fixture returns a different Faker guest per test. Reuse
 * the same fixture inside one test to keep firstName/lastName consistent.
 */
export type TTAFixtures = {
    loginPage: LoginPage;
    inventoryPage: InventoryPage;
    itemDetailPage: ItemDetailPage;
    cartPage: CartPage;
    checkoutStepOnePage: CheckoutStepOnePage;
    checkoutStepTwoPage: CheckoutStepTwoPage;
    checkoutCompletePage: CheckoutCompletePage;
    freshUser: GuestUser;
};

export const test = base.extend<TTAFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    inventoryPage: async ({ page }, use) => {
        await use(new InventoryPage(page));
    },
    itemDetailPage: async ({ page }, use) => {
        await use(new ItemDetailPage(page));
    },
    cartPage: async ({ page }, use) => {
        await use(new CartPage(page));
    },
    checkoutStepOnePage: async ({ page }, use) => {
        await use(new CheckoutStepOnePage(page));
    },
    checkoutStepTwoPage: async ({ page }, use) => {
        await use(new CheckoutStepTwoPage(page));
    },
    checkoutCompletePage: async ({ page }, use) => {
        await use(new CheckoutCompletePage(page));
    },
    freshUser: async ({}, use) => {
        await use(generateUser());
    },
});

export { expect };
