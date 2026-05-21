import { test, expect } from '../../fixtures/test-base';

test.describe('TTACart - Negative paths @regression', () => {
    test('invalid credentials show the no-match error', async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.loginAs('not_a_real_user', 'wrong');
        await loginPage.expectErrorContains(
            'Epic sadface: Username and password do not match any user in this service',
        );
    });

    test('empty username shows the required error', async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.loginAs('', 'tta_secret');
        await loginPage.expectErrorContains('Username is required');
    });

    test('empty firstName on step 1 blocks the user', async ({
        loginPage,
        inventoryPage,
        cartPage,
        checkoutStepOnePage,
    }) => {
        await loginPage.open();
        await loginPage.loginAs('standard_user', 'tta_secret');
        await inventoryPage.assertLoaded();
        await inventoryPage.addToCart('tta-bolt-tshirt');
        await inventoryPage.openCart();
        await cartPage.checkout();
        await checkoutStepOnePage.assertLoaded();
        await checkoutStepOnePage.fillGuest({
            firstName: '',
            lastName: 'Doe',
            postalCode: '12345',
        });
        await checkoutStepOnePage.continue();
        await checkoutStepOnePage.expectErrorContains('First Name is required');
    });

    test('problem_user clears firstName on first continue, then succeeds @regression', async ({
        loginPage,
        inventoryPage,
        cartPage,
        checkoutStepOnePage,
        checkoutStepTwoPage,
        freshUser,
    }) => {
        await loginPage.open();
        await loginPage.loginAs('problem_user', 'tta_secret');
        await inventoryPage.assertLoaded();
        await inventoryPage.addToCart('tta-junior-tester-onesie');
        await inventoryPage.openCart();
        await cartPage.checkout();
        await checkoutStepOnePage.assertLoaded();

        // First attempt - all fields populated. problem_user nukes firstName.
        await checkoutStepOnePage.fillGuest(freshUser);
        await checkoutStepOnePage.continue();
        await checkoutStepOnePage.expectErrorContains('First Name is required');
        expect(await checkoutStepOnePage.firstNameValue()).toBe('');

        // Re-populate firstName and try again - should succeed.
        await checkoutStepOnePage.fillGuest(freshUser);
        await checkoutStepOnePage.continue();
        await checkoutStepTwoPage.assertLoaded();
    });
});
