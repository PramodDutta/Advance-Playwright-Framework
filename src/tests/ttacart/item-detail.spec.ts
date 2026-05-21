import { test, expect } from '../../fixtures/test-base';
import { TTA_PRODUCTS } from '../../utils/DataFactory';

/**
 * Item detail page coverage.
 *
 * The detail page is reachable two ways:
 *   1. Clicking a product title on /inventory.html
 *   2. Direct deep-link via ?id=<product-id>
 *
 * Both paths must work and the same product must show the same name/price as
 * the inventory row. Adding from the detail page must update the cart badge
 * on subsequent inventory pages.
 */
test.describe('TTACart - Item detail @regression', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.loginAs('standard_user', 'tta_secret');
    });

    test('deep-link to a product opens the detail page @smoke', async ({
        itemDetailPage,
    }) => {
        const product = TTA_PRODUCTS.find((p) => p.id === 'tta-fleece-jacket')!;
        await itemDetailPage.openById(product.id);
        expect(await itemDetailPage.name()).toContain('Fleece Jacket');
        expect(await itemDetailPage.price()).toContain('49.99');
    });

    test('clicking a product title from inventory opens its detail @e2e', async ({
        inventoryPage,
        itemDetailPage,
    }) => {
        await inventoryPage.assertLoaded();
        await inventoryPage.openItem('tta-bike-light');
        await itemDetailPage.assertLoaded('tta-bike-light');
        expect(await itemDetailPage.name()).toContain('Bike Light');
    });

    test('add from detail page bumps the cart badge on inventory', async ({
        inventoryPage,
        itemDetailPage,
    }) => {
        await itemDetailPage.openById('tta-bolt-tshirt');
        await itemDetailPage.addToCart();
        await itemDetailPage.back();
        await inventoryPage.assertLoaded();
        expect(await inventoryPage.cartCount()).toBe(1);
    });

    test('remove from detail page clears the cart badge', async ({
        inventoryPage,
        itemDetailPage,
    }) => {
        await itemDetailPage.openById('tta-junior-tester-onesie');
        await itemDetailPage.addToCart();
        await itemDetailPage.removeFromCart();
        await itemDetailPage.back();
        await inventoryPage.assertLoaded();
        expect(await inventoryPage.cartCount()).toBe(0);
    });
});
