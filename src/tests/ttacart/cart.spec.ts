import { test, expect } from '../../fixtures/test-base';

test.describe('TTACart - Cart @smoke', () => {
    test.beforeEach(async ({ loginPage, inventoryPage }) => {
        await loginPage.open();
        await loginPage.loginAs('standard_user', 'tta_secret');
        await inventoryPage.assertLoaded();
    });

    test('add two items, badge shows 2, remove one, badge shows 1 @e2e', async ({
        inventoryPage,
        cartPage,
    }) => {
        await inventoryPage.addToCart('tta-practice-backpack');
        await inventoryPage.addToCart('tta-bike-light');
        expect(await inventoryPage.cartCount()).toBe(2);

        await inventoryPage.removeFromCart('tta-bike-light');
        expect(await inventoryPage.cartCount()).toBe(1);

        await inventoryPage.openCart();
        await cartPage.assertLoaded();
        expect(await cartPage.rowCount()).toBe(1);
        const names = await cartPage.itemNamesList();
        expect(names).toEqual(['TTA Practice Backpack']);
    });

    test('badge is absent when the cart is empty', async ({ inventoryPage }) => {
        expect(await inventoryPage.cartCount()).toBe(0);
    });

    test('continue shopping returns to inventory', async ({ inventoryPage, cartPage }) => {
        await inventoryPage.addToCart('tta-fleece-jacket');
        await inventoryPage.openCart();
        await cartPage.assertLoaded();
        await cartPage.continueShopping();
        await inventoryPage.assertLoaded();
    });
});
