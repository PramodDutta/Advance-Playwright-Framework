import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Final "Thank you for your order!" screen.
 */
export class CheckoutCompletePage extends BasePage {
    static readonly PATH = '/playwright/ttacart/checkout-complete.html';

    private readonly title: Locator;
    private readonly header: Locator;
    private readonly text: Locator;
    private readonly ponyExpress: Locator;
    private readonly backHomeButton: Locator;

    constructor(page: Page) {
        super(page, 'CheckoutCompletePage');
        this.title = page.locator('[data-test="title"]');
        this.header = page.locator('[data-test="complete-header"]');
        this.text = page.locator('[data-test="complete-text"]');
        this.ponyExpress = page.locator('[data-test="pony-express"]');
        this.backHomeButton = page.locator('[data-test="back-to-products"]');
    }

    async assertLoaded(): Promise<void> {
        await expect(this.title).toContainText('Complete');
        await expect(this.header).toBeVisible();
        await expect(this.ponyExpress).toBeVisible();
    }

    async headerText(): Promise<string> {
        return this.el.getText(this.header);
    }

    async completeText(): Promise<string> {
        return this.el.getText(this.text);
    }

    async backToProducts(): Promise<void> {
        await this.el.click(this.backHomeButton);
        await this.page.waitForLoadState('domcontentloaded');
    }
}
