import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TTACart login screen.
 *
 *   const login = new LoginPage(page);
 *   await login.open();
 *   await login.loginAs('standard_user', 'tta_secret');
 */
export class LoginPage extends BasePage {
    static readonly PATH = '/playwright/ttacart/index.html';

    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly errorBox: Locator;
    private readonly loginCredentialsHint: Locator;

    constructor(page: Page) {
        super(page, 'LoginPage');
        this.usernameInput = page.locator('[data-test="username"]');
        this.passwordInput = page.locator('[data-test="password"]');
        this.loginButton = page.locator('[data-test="login-button"]');
        this.errorBox = page.locator('[data-test="error"]');
        this.loginCredentialsHint = page.locator('[data-test="login-credentials"]');
    }

    async open(): Promise<void> {
        await this.goto(LoginPage.PATH);
        await expect(this.usernameInput).toBeVisible();
    }

    /**
     * Type credentials and submit the form.
     *
     * Returns when EITHER:
     *  - the URL changes to inventory.html (happy path), OR
     *  - the error box becomes visible (locked-out / wrong creds).
     *
     * Callers can then `expectErrorContains(...)` or assert URL.
     */
    async loginAs(username: string, password: string): Promise<void> {
        this.log.info(`loginAs ${username}`);
        await this.el.fill(this.usernameInput, username);
        await this.el.fill(this.passwordInput, password);
        await this.el.click(this.loginButton);
        // The login handler navigates immediately for ok users, with a 4s delay
        // for performance_glitch_user, and stays put + shows error for others.
        // Wait for whichever resolves first.
        await Promise.race([
            this.page
                .waitForURL(/inventory\.html/, { timeout: 10_000 })
                .catch(() => null),
            this.errorBox.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null),
        ]);
    }

    async expectErrorContains(text: string): Promise<void> {
        await expect(this.errorBox).toBeVisible();
        await expect(this.errorBox).toContainText(text);
    }

    async expectOnLoginPage(): Promise<void> {
        await expect(this.page).toHaveURL(/index\.html/);
        await expect(this.usernameInput).toBeVisible();
    }

    /**
     * Convenience for tests that want to verify the side menu is shut after
     * a fresh login - matches the "dismissedMenuOpen" assertion described in
     * the spec.
     */
    async dismissedMenuOpen(): Promise<void> {
        await expect(this.page.locator('[data-test="side-menu"]')).toHaveCount(0);
    }
}
