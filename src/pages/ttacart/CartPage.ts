import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TTACart cart page - lists the items + Checkout / Continue Shopping buttons.
 */
export class CartPage extends BasePage {
    static readonly PATH = '/playwright/ttacart/cart.html';

    private readonly title: Locator;
    private readonly itemRows: Locator;
    private readonly itemNames: Locator;
    private readonly continueShoppingLink: Locator;
    private readonly checkoutButton: Locator;

    constructor(page: Page) {
        super(page, 'CartPage');
        this.title = page.locator('[data-test="title"]');
        this.itemRows = page.locator('[data-test="inventory-item"]');
        this.itemNames = page.locator('[data-test="inventory-item-name"]');
        this.continueShoppingLink = page.locator('[data-test="continue-shopping"]');
        this.checkoutButton = page.locator('[data-test="checkout"]');
    }

    async open(): Promise<void> {
        await this.goto(CartPage.PATH);
        await this.assertLoaded();
    }

    async assertLoaded(): Promise<void> {
        await expect(this.title).toContainText('Your Cart');
    }

    async itemNamesList(): Promise<string[]> {
        return this.el.getAllTexts(this.itemNames);
    }

    async rowCount(): Promise<number> {
        return this.itemRows.count();
    }

    async remove(id: string): Promise<void> {
        await this.el.click(this.page.locator(`[data-test="remove-${id}"]`));
    }

    async continueShopping(): Promise<void> {
        await this.el.click(this.continueShoppingLink);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async checkout(): Promise<void> {
        await this.el.click(this.checkoutButton);
        await this.page.waitForLoadState('domcontentloaded');
    }
}
