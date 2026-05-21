import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { GuestUser } from '../../utils/DataFactory';

/**
 * Checkout step 1 - guest details form (firstName / lastName / postalCode).
 *
 * problem_user quirk: the first valid submit clears `firstName` and shows
 * an inline error. Specs that exercise problem_user just submit twice; this
 * POM does NOT hide the quirk because the lesson uses it to demonstrate
 * dealing with flaky UIs.
 */
export class CheckoutStepOnePage extends BasePage {
    static readonly PATH = '/playwright/ttacart/checkout-step-one.html';

    private readonly title: Locator;
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly postalCodeInput: Locator;
    private readonly continueButton: Locator;
    private readonly cancelButton: Locator;
    private readonly errorBox: Locator;

    constructor(page: Page) {
        super(page, 'CheckoutStepOnePage');
        this.title = page.locator('[data-test="title"]');
        this.firstNameInput = page.locator('[data-test="firstName"]');
        this.lastNameInput = page.locator('[data-test="lastName"]');
        this.postalCodeInput = page.locator('[data-test="postalCode"]');
        this.continueButton = page.locator('[data-test="continue"]');
        this.cancelButton = page.locator('[data-test="cancel"]');
        this.errorBox = page.locator('[data-test="error"]');
    }

    async assertLoaded(): Promise<void> {
        await expect(this.title).toContainText('Checkout');
        await expect(this.firstNameInput).toBeVisible();
    }

    async fillGuest(g: GuestUser): Promise<void> {
        await this.el.fill(this.firstNameInput, g.firstName);
        await this.el.fill(this.lastNameInput, g.lastName);
        await this.el.fill(this.postalCodeInput, g.postalCode);
    }

    async continue(): Promise<void> {
        await this.el.click(this.continueButton);
        // For valid input the page navigates to step 2; for invalid it stays.
        // Don't blindly assert here - let the spec verify post-state.
    }

    async cancel(): Promise<void> {
        await this.el.click(this.cancelButton);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async expectErrorContains(text: string): Promise<void> {
        await expect(this.errorBox).toBeVisible();
        await expect(this.errorBox).toContainText(text);
    }

    /**
     * Read-only access to the firstName value. Used by tests that check the
     * problem_user "auto-clear on continue" behaviour.
     */
    async firstNameValue(): Promise<string> {
        return this.el.getValue(this.firstNameInput);
    }
}
