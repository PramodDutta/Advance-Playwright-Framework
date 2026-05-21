import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortKey = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * TTACart inventory page - 6 products, sort dropdown, cart badge.
 *
 * NOTE on the cart count: the markup only renders a `[data-test="shopping-cart-badge"]`
 * element when at least 1 item is in the cart. An absent badge means 0,
 * NOT a failure. cartCount() handles both cases.
 */
export class InventoryPage extends BasePage {
    static readonly PATH = '/playwright/ttacart/inventory.html';

    private readonly title: Locator;
    private readonly sortDropdown: Locator;
    private readonly items: Locator;
    private readonly itemNames: Locator;
    private readonly itemPrices: Locator;
    private readonly cartLink: Locator;
    private readonly cartBadge: Locator;

    constructor(page: Page) {
        super(page, 'InventoryPage');
        this.title = page.locator('[data-test="title"]');
        this.sortDropdown = page.locator('[data-test="product-sort-container"]');
        this.items = page.locator('[data-test="inventory-item"]');
        this.itemNames = page.locator('[data-test="inventory-item-name"]');
        this.itemPrices = page.locator('[data-test="inventory-item-price"]');
        this.cartLink = page.locator('[data-test="shopping-cart-link"]');
        this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    }

    async open(): Promise<void> {
        await this.goto(InventoryPage.PATH);
        await this.assertLoaded();
    }

    async assertLoaded(): Promise<void> {
        await expect(this.title).toHaveText('Products');
        await expect(this.items).toHaveCount(6);
    }

    async sortBy(key: SortKey): Promise<void> {
        await this.el.selectByValue(this.sortDropdown, key);
        // Sort handler re-renders synchronously, but give the DOM one tick to
        // settle before callers read names/prices.
        await this.page.waitForTimeout(50);
    }

    async productNames(): Promise<string[]> {
        return this.el.getAllTexts(this.itemNames);
    }

    /**
     * Returns prices as numbers (the DOM shows them as `$29.99` strings).
     */
    async productPrices(): Promise<number[]> {
        const raw = await this.el.getAllTexts(this.itemPrices);
        return raw.map((s) => Number(s.replace(/[^0-9.]/g, '')));
    }

    private addBtn(id: string): Locator {
        return this.page.locator(`[data-test="add-to-cart-${id}"]`);
    }
    private removeBtn(id: string): Locator {
        return this.page.locator(`[data-test="remove-${id}"]`);
    }

    async addToCart(id: string): Promise<void> {
        await this.el.click(this.addBtn(id));
    }

    async removeFromCart(id: string): Promise<void> {
        await this.el.click(this.removeBtn(id));
    }

    async cartCount(): Promise<number> {
        const count = await this.cartBadge.count();
        if (count === 0) return 0;
        const text = await this.cartBadge.textContent();
        return Number((text ?? '0').trim());
    }

    async openCart(): Promise<void> {
        await this.el.click(this.cartLink);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async openItem(id: string): Promise<void> {
        await this.el.click(this.page.locator(`[data-test="item-${id}-title-link"]`));
        await this.page.waitForLoadState('domcontentloaded');
    }
}
