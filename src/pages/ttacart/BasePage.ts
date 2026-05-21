import { Page } from '@playwright/test';
import { UtilElementLocator } from '../../utils/UtilElementLocator';
import { Logger } from '../../utils/Logger';

/**
 * BasePage - shared scaffolding for every TTACart Page Object.
 *
 * The TTACart suite is intentionally thin. We only inherit:
 *  - `page`     -> Playwright Page handle
 *  - `el`       -> UtilElementLocator wrapper for actions
 *  - `log`      -> a per-page Logger (scope = the subclass name)
 *  - `goto(p)`  -> small navigation helper that respects baseURL
 *
 * Subclasses still declare their own `private readonly` Locator fields; the
 * base class deliberately does NOT pre-build any locators.
 */
export abstract class BasePage {
    protected readonly page: Page;
    protected readonly el: UtilElementLocator;
    protected readonly log: Logger;

    protected constructor(page: Page, scope: string) {
        this.page = page;
        this.el = new UtilElementLocator(page, scope);
        this.log = Logger.create(scope);
    }

    /**
     * Navigate to a path relative to the project baseURL.
     * Always awaits DOMContentLoaded so subclass methods can read the
     * rendered DOM immediately.
     */
    protected async goto(relativePath: string): Promise<void> {
        this.log.info(`goto ${relativePath}`);
        await this.page.goto(relativePath);
        await this.page.waitForLoadState('domcontentloaded');
    }
}
