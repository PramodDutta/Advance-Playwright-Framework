import { test, expect } from '../../fixtures/test-base';
import { readCSV } from '../../utils/FileReader';

interface ProductRow {
    id: string;
    name: string;
    price: string;
}

const rows = readCSV<ProductRow>('src/testdata/ttacart/products.csv');

test.describe('TTACart - Data-driven add-to-cart @regression', () => {
    test.beforeEach(async ({ loginPage, inventoryPage }) => {
        await loginPage.open();
        await loginPage.loginAs('standard_user', 'tta_secret');
        await inventoryPage.assertLoaded();
    });

    for (const row of rows) {
        test(`add ${row.name} to cart and verify badge becomes 1`, async ({
            inventoryPage,
            cartPage,
        }) => {
            await inventoryPage.addToCart(row.id);
            expect(await inventoryPage.cartCount()).toBe(1);

            await inventoryPage.openCart();
            await cartPage.assertLoaded();
            expect(await cartPage.rowCount()).toBe(1);

            const names = await cartPage.itemNamesList();
            // The CSV stores `Test.allTheThings T-Shirt (Red)` (no parens around
            // `allTheThings()`) but the UI uses `Test.allTheThings() T-Shirt (Red)`.
            // Compare on a normalised key.
            const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
            const uiNames = names.map(norm);
            const expected = norm(row.name).replace(
                'Test.allTheThings T-Shirt',
                'Test.allTheThings() T-Shirt',
            );
            expect(uiNames).toContain(expected);
        });
    }
});
