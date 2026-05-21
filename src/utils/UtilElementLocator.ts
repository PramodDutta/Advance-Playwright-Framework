import { expect, Locator, Page } from '@playwright/test';
import { Logger } from './Logger';

/**
 * Flex - a selector can be a CSS string or an already-built Locator.
 *
 * The TTACart suite uses `data-test` attributes everywhere, so most call sites
 * pass either:
 *   - `'[data-test="username"]'`  (a CSS string), or
 *   - `page.getByTestId('username')` (a Locator object).
 */
export type Flex = string | Locator;

/**
 * Default action timeout (ms). Centralised so a single tweak affects every
 * click/fill/wait across the suite. Overridable per call via the `timeout`
 * argument.
 */
export const DEFAULT_ACTION_TIMEOUT_MS = 15_000;

/**
 * UtilElementLocator wraps Playwright's Page + Locator API.
 *
 * Why have this?
 *  - One place to add logging, screenshots, or telemetry around every action.
 *  - One place to enforce a default action timeout.
 *  - Page Objects stay free of repetitive `await this.locator(...).click()`
 *    boilerplate.
 *
 * Page Objects should construct one instance per page (see BasePage).
 */
export class UtilElementLocator {
    private readonly page: Page;
    private readonly log: Logger;

    constructor(page: Page, scope: string = 'UtilElementLocator') {
        this.page = page;
        this.log = Logger.create(scope);
    }

    private toLocator(target: Flex): Locator {
        return typeof target === 'string' ? this.page.locator(target) : target;
    }

    // ---------- actions ----------

    async click(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`click -> ${loc}`);
        await loc.click({ timeout });
    }

    async doubleClick(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`doubleClick -> ${loc}`);
        await loc.dblclick({ timeout });
    }

    async rightClick(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`rightClick -> ${loc}`);
        await loc.click({ button: 'right', timeout });
    }

    async hover(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`hover -> ${loc}`);
        await loc.hover({ timeout });
    }

    async fill(target: Flex, value: string, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`fill -> ${loc} = ${value}`);
        await loc.fill(value, { timeout });
    }

    async type(target: Flex, value: string, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        // Note: Playwright deprecated .type() in favour of .pressSequentially().
        // We keep the public method name so the API still reads naturally for
        // students used to the older verb.
        const loc = this.toLocator(target);
        this.log.debug(`type -> ${loc} = ${value}`);
        await loc.pressSequentially(value, { timeout });
    }

    async pressSequentially(
        target: Flex,
        value: string,
        timeout: number = DEFAULT_ACTION_TIMEOUT_MS,
    ): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`pressSequentially -> ${loc} = ${value}`);
        await loc.pressSequentially(value, { timeout });
    }

    async clear(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`clear -> ${loc}`);
        await loc.clear({ timeout });
    }

    // ---------- reads ----------

    async getText(target: Flex): Promise<string> {
        const loc = this.toLocator(target);
        const txt = (await loc.textContent()) ?? '';
        return txt.trim();
    }

    async getInnerText(target: Flex): Promise<string> {
        const loc = this.toLocator(target);
        return (await loc.innerText()).trim();
    }

    async getAllTexts(target: Flex): Promise<string[]> {
        const loc = this.toLocator(target);
        const texts = await loc.allTextContents();
        return texts.map((t) => t.trim());
    }

    async getAttr(target: Flex, name: string): Promise<string | null> {
        const loc = this.toLocator(target);
        return loc.getAttribute(name);
    }

    async getValue(target: Flex): Promise<string> {
        const loc = this.toLocator(target);
        return loc.inputValue();
    }

    async count(target: Flex): Promise<number> {
        const loc = this.toLocator(target);
        return loc.count();
    }

    // ---------- state checks ----------

    async isVisible(target: Flex): Promise<boolean> {
        const loc = this.toLocator(target);
        return loc.isVisible();
    }

    async isEnabled(target: Flex): Promise<boolean> {
        const loc = this.toLocator(target);
        return loc.isEnabled();
    }

    async isChecked(target: Flex): Promise<boolean> {
        const loc = this.toLocator(target);
        return loc.isChecked();
    }

    // ---------- waits ----------

    async waitForVisible(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        await expect(loc).toBeVisible({ timeout });
    }

    async waitForHidden(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        await expect(loc).toBeHidden({ timeout });
    }

    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle').catch(() => {
            // TTACart is static + localStorage so networkidle is fast,
            // but we swallow the rare timeout so the test isn't punished
            // by background analytics calls on the demo origin.
        });
    }

    // ---------- selects ----------

    async selectByText(target: Flex, text: string): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`selectByText -> ${loc} = ${text}`);
        await loc.selectOption({ label: text });
    }

    async selectByValue(target: Flex, value: string): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`selectByValue -> ${loc} = ${value}`);
        await loc.selectOption({ value });
    }

    async selectByIndex(target: Flex, index: number): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`selectByIndex -> ${loc} = ${index}`);
        await loc.selectOption({ index });
    }
}
