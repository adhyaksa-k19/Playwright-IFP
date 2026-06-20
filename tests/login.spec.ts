import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

// Override storageState — login tests must run unauthenticated
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('IFP Login', () => {

    let loginPage: LoginPage;
    let dashboardPage: DashboardPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        await loginPage.goto();
        await loginPage.verifyLoginPageLoaded();
    });

    test('Valid Login', async ({ page }) => {
        await loginPage.login(
            process.env.IFP_USERNAME!,
            process.env.IFP_PASSWORD!
        );
        await dashboardPage.verifyDashboardLoaded();
    });

    test('Invalid Login - Wrong Password', async ({ page }) => {
        await loginPage.login(
            process.env.IFP_USERNAME!,
            'wrong_password_123'
        );
        await loginPage.verifyStillOnLoginPage();
        // Update the message below to match what your app actually shows
        await loginPage.verifyErrorMessage('Invalid credentials.');
    });

    test('Invalid Login - Wrong Username', async ({ page }) => {
        await loginPage.login(
            'invalid_user@test.com',
            process.env.IFP_PASSWORD!
        );
        await loginPage.verifyStillOnLoginPage();
        await loginPage.verifyErrorMessage('Invalid credentials.');
    });

    test('Invalid Login - Empty Username', async ({ page }) => {
        await loginPage.login('', process.env.IFP_PASSWORD!);
        await loginPage.verifyStillOnLoginPage();
    });

    test('Invalid Login - Empty Password', async ({ page }) => {
        await loginPage.login(process.env.IFP_USERNAME!, '');
        await loginPage.verifyStillOnLoginPage();
    });

    test('Invalid Login - Both Fields Empty', async ({ page }) => {
        await loginPage.login('', '');
        await loginPage.verifyStillOnLoginPage();
    });

});