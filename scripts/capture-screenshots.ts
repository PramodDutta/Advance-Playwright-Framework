/* eslint-disable no-console */
/**
 * Capture the seven TTACart screens for the README.
 *
 * Usage:
 *   npx ts-node scripts/capture-screenshots.ts            # default base URL
 *   BASE_URL=http://localhost:3000 npx ts-node scripts/capture-screenshots.ts
 *
 * Output:
 *   docs/screenshots/{login,inventory,inventory-item,cart,
 *                     checkout-step-one,checkout-step-two,checkout-complete}.png
 *
 * Each PNG is rendered at 640x800 viewport and saved with fullPage=true so
 * the README can embed a small clean preview.
 */
import { chromium, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://app.thetestingacademy.com';
const OUT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

interface Shot {
    name: string;
    setup: (page: Page) => Promise<void>;
}

async function loginAs(page: Page, username: string): Promise<void> {
    await page.goto(`${BASE_URL}/playwright/ttacart/index.html`);
    await page.locator('[data-test="username"]').fill(username);
    await page.locator('[data-test="password"]').fill('tta_secret');
    await page.locator('[data-test="login-button"]').click();
    // Live TTACart redirects to /inventory (without .html); local builds keep
    // the extension. Accept either so this script works against both.
    await page.waitForURL(/\/inventory(\.html)?(\?|$)/);
}

async function addToCart(page: Page, id: string): Promise<void> {
    await page.locator(`[data-test="add-to-cart-${id}"]`).click();
}

const SHOTS: Shot[] = [
    {
        name: 'login',
        setup: async (page) => {
            await page.goto(`${BASE_URL}/playwright/ttacart/index.html`);
            await page.waitForLoadState('domcontentloaded');
        },
    },
    {
        name: 'inventory',
        setup: async (page) => {
            await loginAs(page, 'standard_user');
            await page.waitForLoadState('domcontentloaded');
        },
    },
    {
        name: 'inventory-item',
        setup: async (page) => {
            await loginAs(page, 'standard_user');
            await page.goto(
                `${BASE_URL}/playwright/ttacart/inventory-item.html?id=tta-practice-backpack`,
            );
            await page.waitForLoadState('domcontentloaded');
        },
    },
    {
        name: 'cart',
        setup: async (page) => {
            await loginAs(page, 'standard_user');
            await addToCart(page, 'tta-practice-backpack');
            await addToCart(page, 'tta-bike-light');
            await page.locator('[data-test="shopping-cart-link"]').click();
            await page.waitForLoadState('domcontentloaded');
        },
    },
    {
        name: 'checkout-step-one',
        setup: async (page) => {
            await loginAs(page, 'standard_user');
            await addToCart(page, 'tta-practice-backpack');
            await page.locator('[data-test="shopping-cart-link"]').click();
            await page.locator('[data-test="checkout"]').click();
            await page.waitForLoadState('domcontentloaded');
        },
    },
    {
        name: 'checkout-step-two',
        setup: async (page) => {
            await loginAs(page, 'standard_user');
            await addToCart(page, 'tta-practice-backpack');
            await addToCart(page, 'tta-bike-light');
            await page.locator('[data-test="shopping-cart-link"]').click();
            await page.locator('[data-test="checkout"]').click();
            await page.locator('[data-test="firstName"]').fill('Pramod');
            await page.locator('[data-test="lastName"]').fill('Dutta');
            await page.locator('[data-test="postalCode"]').fill('110001');
            await page.locator('[data-test="continue"]').click();
            await page.waitForLoadState('domcontentloaded');
        },
    },
    {
        name: 'checkout-complete',
        setup: async (page) => {
            await loginAs(page, 'standard_user');
            await addToCart(page, 'tta-bike-light');
            await page.locator('[data-test="shopping-cart-link"]').click();
            await page.locator('[data-test="checkout"]').click();
            await page.locator('[data-test="firstName"]').fill('Pramod');
            await page.locator('[data-test="lastName"]').fill('Dutta');
            await page.locator('[data-test="postalCode"]').fill('110001');
            await page.locator('[data-test="continue"]').click();
            await page.locator('[data-test="finish"]').click();
            await page.waitForLoadState('domcontentloaded');
        },
    },
];

async function main(): Promise<void> {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    try {
        for (const shot of SHOTS) {
            const context = await browser.newContext({
                viewport: { width: 640, height: 800 },
            });
            const page = await context.newPage();
            try {
                console.log(`[capture] ${shot.name}`);
                await shot.setup(page);
                await page.screenshot({
                    path: path.join(OUT_DIR, `${shot.name}.png`),
                    fullPage: true,
                });
            } catch (err) {
                console.error(`[capture] ${shot.name} failed:`, err);
                throw err;
            } finally {
                await context.close();
            }
        }
    } finally {
        await browser.close();
    }
    console.log(`[capture] done -> ${OUT_DIR}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
