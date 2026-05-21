import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TTACart product detail page - one product, one add/remove button.
 *
 * The detail page uses `data-test="add-to-cart"` / `data-test="remove"` (no
 * trailing `-<id>`) since there is only one product on screen.
 */
export class ItemDetailPage extends BasePage {
    static readonly PATH = '/playwright/ttacart/inventory-item.html';

    private readonly itemName: Locator;
    private readonly itemPrice: Locator;
    private readonly addButton: Locator;
    private readonly removeButton: Locator;
    private readonly backButton: Locator;

    constructor(page: Page) {
        super(page, 'ItemDetailPage');
        this.itemName = page.locator('[data-test="inventory-item-name"]');
        this.itemPrice = page.locator('[data-test="inventory-item-price"]');
        this.addButton = page.locator('[data-test="add-to-cart"]');
        this.removeButton = page.locator('[data-test="remove"]');
        this.backButton = page.locator('[data-test="back-to-products"]');
    }

    async openById(id: string): Promise<void> {
        await this.goto(`${ItemDetailPage.PATH}?id=${id}`);
        await this.assertLoaded(id);
    }

    async assertLoaded(id: string): Promise<void> {
        await expect(this.page).toHaveURL(new RegExp(`inventory-item\\.html\\?id=${id}`));
        await expect(this.itemName).toBeVisible();
    }

    async name(): Promise<string> {
        return this.el.getText(this.itemName);
    }

    async price(): Promise<string> {
        return this.el.getText(this.itemPrice);
    }

    async addToCart(): Promise<void> {
        await this.el.click(this.addButton);
    }

    async removeFromCart(): Promise<void> {
        await this.el.click(this.removeButton);
    }

    async back(): Promise<void> {
        await this.el.click(this.backButton);
        await this.page.waitForLoadState('domcontentloaded');
    }
}
