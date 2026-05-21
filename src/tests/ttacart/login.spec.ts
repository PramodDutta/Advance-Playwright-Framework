import { test, expect } from '../../fixtures/test-base';
import { readJSON } from '../../utils/FileReader';

interface UserRow {
    username: string;
    password: string;
    kind: 'ok' | 'blocked' | 'broken-ui' | 'slow' | 'flaky' | 'visual';
}

const users = readJSON<UserRow[]>('src/testdata/ttacart/users.json');

test.describe('TTACart - Login @smoke', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.open();
    });

    test('standard_user lands on inventory @e2e', async ({ loginPage, inventoryPage, page }) => {
        const u = users.find((x) => x.username === 'standard_user')!;
        await loginPage.loginAs(u.username, u.password);
        await expect(page).toHaveURL(/inventory\.html/);
        await inventoryPage.assertLoaded();
    });

    test('locked_out_user shows lockout error', async ({ loginPage }) => {
        const u = users.find((x) => x.username === 'locked_out_user')!;
        await loginPage.loginAs(u.username, u.password);
        await loginPage.expectErrorContains(
            'Epic sadface: Sorry, this user has been locked out.',
        );
    });

    test('problem_user can still log in @regression', async ({
        loginPage,
        inventoryPage,
        page,
    }) => {
        const u = users.find((x) => x.username === 'problem_user')!;
        await loginPage.loginAs(u.username, u.password);
        await expect(page).toHaveURL(/inventory\.html/);
        await inventoryPage.assertLoaded();
        // problem_user adds a `problem-user` class to <body>; assert the trait
        // is wired through so downstream broken-ui tests stay meaningful.
        await expect(page.locator('body')).toHaveClass(/problem-user/);
    });

    test('performance_glitch_user logs in after delay @regression', async ({
        loginPage,
        inventoryPage,
        page,
    }) => {
        test.setTimeout(30_000); // 4s artificial delay + buffer.
        const u = users.find((x) => x.username === 'performance_glitch_user')!;
        const start = Date.now();
        await loginPage.loginAs(u.username, u.password);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(3_900);
        await expect(page).toHaveURL(/inventory\.html/);
        await inventoryPage.assertLoaded();
    });

    test('error_user logs in successfully', async ({ loginPage, inventoryPage, page }) => {
        const u = users.find((x) => x.username === 'error_user')!;
        await loginPage.loginAs(u.username, u.password);
        await expect(page).toHaveURL(/inventory\.html/);
        await inventoryPage.assertLoaded();
        await expect(page.locator('body')).toHaveClass(/error-user/);
    });

    test('visual_user has the visual drift class on <body>', async ({
        loginPage,
        inventoryPage,
        page,
    }) => {
        const u = users.find((x) => x.username === 'visual_user')!;
        await loginPage.loginAs(u.username, u.password);
        await expect(page).toHaveURL(/inventory\.html/);
        await inventoryPage.assertLoaded();
        await expect(page.locator('body')).toHaveClass(/visual-user/);
    });
});
