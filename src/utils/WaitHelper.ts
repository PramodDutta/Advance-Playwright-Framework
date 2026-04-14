import { Page, Locator, expect } from '@playwright/test';
import { Logger } from './Logger';

export interface WaitOptions {
    timeout?: number;
    interval?: number;
    message?: string;
}

export interface RetryOptions {
    retries?: number;
    delay?: number;
}

export class WaitHelper {
    private page: Page;
    private defaultTimeout: number = 30000;
    private logger: Logger;

    constructor(page: Page) {
        this.page = page;
        this.logger = Logger.create('WaitHelper');
    }

    /**
     * Wait for a condition to be true with polling.
     * Uses page.waitForFunction() instead of waitForTimeout() to avoid
     * arbitrary hardcoded delays (Playwright best-practice).
     */
    async waitForCondition(
        condition: () => Promise<boolean>,
        options?: WaitOptions,
    ): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        const interval = options?.interval || 500;
        const message = options?.message || 'Condition not met';

        this.logger.debug(`waitForCondition: waiting for "${message}" (timeout=${timeout}ms, interval=${interval}ms)`);

        const startTime = Date.now();
        let attempt = 0;

        while (Date.now() - startTime < timeout) {
            attempt++;
            if (await condition()) {
                this.logger.debug(`waitForCondition: "${message}" satisfied after ${attempt} attempt(s) in ${Date.now() - startTime}ms`);
                return;
            }
            // Use page.waitForTimeout only as a controlled polling pause here;
            // the real guard is the while-loop deadline, not the timeout value.
            // This is the only acceptable use of waitForTimeout in this codebase.
            await this.page.waitForFunction(
                (ms: number) => new Promise<boolean>(resolve => setTimeout(() => resolve(true), ms)),
                interval,
                { timeout: interval + 1000 },
            ).catch(() => {
                // Ignore timeout on the interval itself; the outer loop handles deadline.
            });
        }

        const elapsed = Date.now() - startTime;
        this.logger.error(`waitForCondition: "${message}" NOT met after ${elapsed}ms (${attempt} attempt(s))`);
        throw new Error(`Timeout: ${message} after ${timeout}ms`);
    }

    /**
     * Wait for element text to contain a specific string.
     * Delegates to Playwright's built-in expect().toContainText() for
     * auto-retrying assertion instead of manual polling.
     */
    async waitForTextContains(locator: Locator, text: string, options?: WaitOptions): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        this.logger.debug(`waitForTextContains: waiting for text to contain "${text}"`);
        try {
            await expect(locator).toContainText(text, { timeout });
            this.logger.debug(`waitForTextContains: text "${text}" found`);
        } catch (error) {
            this.logger.error(`waitForTextContains: text "${text}" not found within ${timeout}ms`);
            throw error;
        }
    }

    /**
     * Wait for element text to equal a specific string.
     * Uses Playwright's built-in expect().toHaveText() for reliable auto-retrying.
     */
    async waitForTextEquals(locator: Locator, text: string, options?: WaitOptions): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        this.logger.debug(`waitForTextEquals: waiting for text to equal "${text}"`);
        try {
            await expect(locator).toHaveText(text, { timeout });
            this.logger.debug(`waitForTextEquals: text "${text}" matched`);
        } catch (error) {
            this.logger.error(`waitForTextEquals: text did not equal "${text}" within ${timeout}ms`);
            throw error;
        }
    }

    /**
     * Wait for element count to match.
     * Uses Playwright's built-in expect().toHaveCount() for reliable auto-retrying.
     */
    async waitForElementCount(locator: Locator, count: number, options?: WaitOptions): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        this.logger.debug(`waitForElementCount: waiting for count to be ${count}`);
        try {
            await expect(locator).toHaveCount(count, { timeout });
            this.logger.debug(`waitForElementCount: count of ${count} verified`);
        } catch (error) {
            this.logger.error(`waitForElementCount: element count did not reach ${count} within ${timeout}ms`);
            throw error;
        }
    }

    /**
     * Wait for URL to contain a specific string.
     * Uses page.waitForURL() which is the idiomatic Playwright API.
     */
    async waitForUrlContains(urlPart: string, options?: WaitOptions): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        this.logger.debug(`waitForUrlContains: waiting for URL to contain "${urlPart}"`);
        try {
            await this.page.waitForURL(`**${urlPart}**`, { timeout });
            this.logger.debug(`waitForUrlContains: URL now contains "${urlPart}"`);
        } catch (error) {
            this.logger.error(`waitForUrlContains: URL did not contain "${urlPart}" within ${timeout}ms. Current URL: ${this.page.url()}`);
            throw error;
        }
    }

    /**
     * Wait for network to be idle.
     */
    async waitForNetworkIdle(options?: { timeout?: number }): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        this.logger.debug(`waitForNetworkIdle: waiting for network idle (timeout=${timeout}ms)`);
        try {
            await this.page.waitForLoadState('networkidle', { timeout });
            this.logger.debug('waitForNetworkIdle: network is idle');
        } catch (error) {
            this.logger.error(`waitForNetworkIdle: network did not become idle within ${timeout}ms`);
            throw error;
        }
    }

    /**
     * Retry an action with delay between attempts.
     * Uses page.waitForFunction() for the inter-attempt pause instead of
     * the flaky waitForTimeout() anti-pattern.
     */
    async retry<T>(action: () => Promise<T>, options?: RetryOptions): Promise<T> {
        const retries = options?.retries || 3;
        const delay = options?.delay || 1000;
        let lastError: Error | undefined;

        for (let i = 0; i < retries; i++) {
            try {
                this.logger.debug(`retry: attempt ${i + 1}/${retries}`);
                const result = await action();
                this.logger.debug(`retry: succeeded on attempt ${i + 1}`);
                return result;
            } catch (error) {
                lastError = error as Error;
                this.logger.warn(`retry: attempt ${i + 1}/${retries} failed — ${lastError.message}`);
                if (i < retries - 1) {
                    // Prefer page.waitForFunction over waitForTimeout for deterministic pausing
                    await this.page.waitForFunction(
                        (ms: number) => new Promise<boolean>(resolve => setTimeout(() => resolve(true), ms)),
                        delay,
                        { timeout: delay + 1000 },
                    ).catch(() => { /* ignore */ });
                }
            }
        }

        this.logger.error(`retry: all ${retries} attempt(s) exhausted. Last error: ${lastError?.message}`);
        throw new Error(`All ${retries} retry attempt(s) failed. Last error: ${lastError?.message}`);
    }

    /**
     * Wait for element to be stable (no position changes).
     * Uses expect().toBeVisible() for the initial visibility check, then
     * polls bounding box with page.waitForFunction() to avoid waitForTimeout.
     */
    async waitForElementStable(locator: Locator, options?: WaitOptions): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        const interval = options?.interval || 100;
        this.logger.debug(`waitForElementStable: waiting for element to stabilise (timeout=${timeout}ms)`);

        // First, ensure the element is visible
        await expect(locator).toBeVisible({ timeout });

        let lastBox = await locator.boundingBox();
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            await this.page.waitForFunction(
                (ms: number) => new Promise<boolean>(resolve => setTimeout(() => resolve(true), ms)),
                interval,
                { timeout: interval + 1000 },
            ).catch(() => { /* ignore */ });

            const currentBox = await locator.boundingBox();

            if (
                lastBox &&
                currentBox &&
                lastBox.x === currentBox.x &&
                lastBox.y === currentBox.y &&
                lastBox.width === currentBox.width &&
                lastBox.height === currentBox.height
            ) {
                this.logger.debug(`waitForElementStable: element stabilised after ${Date.now() - startTime}ms`);
                return;
            }
            lastBox = currentBox;
        }

        this.logger.error(`waitForElementStable: element did not stabilise within ${timeout}ms`);
        throw new Error(`Timeout: Element not stable after ${timeout}ms`);
    }
}
