import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Checkout step 2 - the overview page with subtotal / tax / total.
 *
 * The markup renders each total as a full sentence inside one node, e.g.
 *   `<div data-test="subtotal-label">Item total: $29.99</div>`
 * so we parse the trailing dollar amount with a small regex helper.
 */
export class CheckoutStepTwoPage extends BasePage {
    static readonly PATH = '/playwright/ttacart/checkout-step-two.html';

    private readonly title: Locator;
    private readonly subtotalLabel: Locator;
    private readonly taxLabel: Locator;
    private readonly totalLabel: Locator;
    private readonly finishButton: Locator;
    private readonly cancelLink: Locator;

    constructor(page: Page) {
        super(page, 'CheckoutStepTwoPage');
        this.title = page.locator('[data-test="title"]');
        this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
        this.taxLabel = page.locator('[data-test="tax-label"]');
        this.totalLabel = page.locator('[data-test="total-label"]');
        this.finishButton = page.locator('[data-test="finish"]');
        this.cancelLink = page.locator('[data-test="cancel"]');
    }

    async assertLoaded(): Promise<void> {
        await expect(this.title).toContainText('Overview');
        await expect(this.subtotalLabel).toBeVisible();
    }

    private async parseMoney(loc: Locator): Promise<number> {
        const raw = (await loc.textContent()) ?? '';
        const match = raw.match(/\$([0-9]+\.[0-9]{2})/);
        if (!match) throw new Error(`Could not parse money from "${raw}"`);
        return Number(match[1]);
    }

    async subtotal(): Promise<number> {
        return this.parseMoney(this.subtotalLabel);
    }

    async tax(): Promise<number> {
        return this.parseMoney(this.taxLabel);
    }

    async total(): Promise<number> {
        return this.parseMoney(this.totalLabel);
    }

    async finish(): Promise<void> {
        await this.el.click(this.finishButton);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async cancel(): Promise<void> {
        await this.el.click(this.cancelLink);
        await this.page.waitForLoadState('domcontentloaded');
    }
}
