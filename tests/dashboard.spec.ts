import { test } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard', () => {

    test('Dashboard Full Validation', async ({ page }) => {

        await page.goto(
            'https://ifp-devel.zlpdigital.com/dashboard'
        );

        const dashboard = new DashboardPage(page);

        await dashboard.verifyDashboardLoaded();
        await dashboard.verifySidebarMenu();
        await dashboard.verifySummaryCards();
        await dashboard.verifyStatusCards();
        await dashboard.verifyCharts();
        await dashboard.verifyFilterCoordinator();
    });

});