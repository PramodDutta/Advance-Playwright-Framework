import { test, expect } from '../../fixtures/test-base';
import { TTA_PRODUCTS } from '../../utils/DataFactory';

/**
 * Full happy-path checkout - the flagship e2e for the suite.
 * Adds two products, walks through both checkout steps, and verifies the
 * subtotal/tax/total math against the canonical product catalogue.
 */
test.describe('TTACart - Checkout end-to-end @e2e', () => {
    test('standard_user can complete an order @smoke', async ({
        loginPage,
        inventoryPage,
        cartPage,
        checkoutStepOnePage,
        checkoutStepTwoPage,
        checkoutCompletePage,
        freshUser,
    }) => {
        const picks = [
            TTA_PRODUCTS.find((p) => p.id === 'tta-practice-backpack')!,
            TTA_PRODUCTS.find((p) => p.id === 'tta-bike-light')!,
        ];
        const expectedSubtotal = picks.reduce((s, p) => s + p.price, 0);
        const expectedTax = Math.round(expectedSubtotal * 0.08 * 100) / 100;
        const expectedTotal = Math.round((expectedSubtotal + expectedTax) * 100) / 100;

        await loginPage.open();
        await loginPage.loginAs('standard_user', 'tta_secret');
        await inventoryPage.assertLoaded();

        for (const p of picks) {
            await inventoryPage.addToCart(p.id);
        }
        expect(await inventoryPage.cartCount()).toBe(picks.length);

        await inventoryPage.openCart();
        await cartPage.assertLoaded();
        expect(await cartPage.rowCount()).toBe(picks.length);

        await cartPage.checkout();
        await checkoutStepOnePage.assertLoaded();
        await checkoutStepOnePage.fillGuest(freshUser);
        await checkoutStepOnePage.continue();

        await checkoutStepTwoPage.assertLoaded();
        expect(await checkoutStepTwoPage.subtotal()).toBeCloseTo(expectedSubtotal, 2);
        expect(await checkoutStepTwoPage.tax()).toBeCloseTo(expectedTax, 2);
        expect(await checkoutStepTwoPage.total()).toBeCloseTo(expectedTotal, 2);

        await checkoutStepTwoPage.finish();
        await checkoutCompletePage.assertLoaded();
        expect(await checkoutCompletePage.headerText()).toBe('Thank you for your order!');

        // Cart should be empty after the order.
        await checkoutCompletePage.backToProducts();
        await inventoryPage.assertLoaded();
        expect(await inventoryPage.cartCount()).toBe(0);
    });
});
