import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Resolve baseURL from TTA_ENV. Supports the four canonical names the spec
 * asks for plus their common aliases so legacy scripts keep working.
 *
 *   TTA_ENV=dev   -> http://localhost:3000               (alias: local)
 *   TTA_ENV=qa    -> https://app.thetestingacademy.com   (default)
 *   TTA_ENV=stg   -> https://stage.thetestingacademy.com (alias: stage, staging)
 *   TTA_ENV=prod  -> https://app.thetestingacademy.com   (alias: production)
 *
 * Each branch also honours an explicit `<ENV>_BASE_URL` override so CI can
 * point at a per-PR preview without editing this file:
 *
 *   QA_BASE_URL=https://pr-123.app.thetestingacademy.com npx playwright test
 *
 * BASE_URL is still honoured (highest priority) for backwards compatibility
 * with the pre-existing non-TTA specs in this repo.
 */
function resolveBaseURL(): string {
    if (process.env.BASE_URL) return process.env.BASE_URL;
    const env = (process.env.TTA_ENV || 'qa').toLowerCase();
    switch (env) {
        case 'dev':
        case 'local':
            return process.env.DEV_BASE_URL || 'http://localhost:3000';
        case 'stg':
        case 'stage':
        case 'staging':
            return process.env.STG_BASE_URL || 'https://stage.thetestingacademy.com';
        case 'prod':
        case 'production':
            return process.env.PROD_BASE_URL || 'https://app.thetestingacademy.com';
        case 'qa':
        default:
            return process.env.QA_BASE_URL || 'https://app.thetestingacademy.com';
    }
}

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './src/tests',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 4 : 6,

    reporter: [
        ['./src/utils/CustomTTAReporter.ts'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['allure-playwright', { outputFolder: 'allure-results' }],
        ['list'],
    ],

    use: {
        baseURL: resolveBaseURL(),
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
    },

    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    ],
});
