import { test, expect } from '../../fixtures/test-base';

/**
 * Sort tests rely on standard_user. problem_user has a separate negative
 * spec that proves it ignores the dropdown.
 */
test.describe('TTACart - Inventory sort @regression', () => {
    test.beforeEach(async ({ loginPage, inventoryPage }) => {
        await loginPage.open();
        await loginPage.loginAs('standard_user', 'tta_secret');
        await inventoryPage.assertLoaded();
    });

    test('Name (A to Z) returns names in ascending order', async ({ inventoryPage }) => {
        await inventoryPage.sortBy('az');
        const names = await inventoryPage.productNames();
        const sorted = [...names].sort((a, b) => a.localeCompare(b));
        expect(names).toEqual(sorted);
    });

    test('Name (Z to A) returns names in descending order', async ({ inventoryPage }) => {
        await inventoryPage.sortBy('za');
        const names = await inventoryPage.productNames();
        const sorted = [...names].sort((a, b) => b.localeCompare(a));
        expect(names).toEqual(sorted);
    });

    test('Price (low to high) returns prices ascending', async ({ inventoryPage }) => {
        await inventoryPage.sortBy('lohi');
        const prices = await inventoryPage.productPrices();
        const sorted = [...prices].sort((a, b) => a - b);
        expect(prices).toEqual(sorted);
    });

    test('Price (high to low) returns prices descending', async ({ inventoryPage }) => {
        await inventoryPage.sortBy('hilo');
        const prices = await inventoryPage.productPrices();
        const sorted = [...prices].sort((a, b) => b - a);
        expect(prices).toEqual(sorted);
    });
});
