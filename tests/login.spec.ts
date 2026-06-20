import { test } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('IFP Login', () => {

    test('Valid Login', async ({ page }) => {

        const loginPage = new LoginPage(page);
        const dashboardPage = new DashboardPage(page);

        await loginPage.goto();

        await loginPage.login(
            process.env.IFP_USERNAME!,
            process.env.IFP_PASSWORD!
        );

        await dashboardPage.verifyDashboardLoaded();
    });

});