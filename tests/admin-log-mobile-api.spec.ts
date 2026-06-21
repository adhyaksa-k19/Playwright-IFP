import { test } from '@playwright/test';
import { AdminLogMobileApiPage } from '../pages/AdminLogMobileApiPage';

test.describe('Administrasi - Log Mobile API', () => {
    test.describe.configure({ timeout: 120_000 });

    test('layout halaman tersedia', async ({ page }) => {
        const admin = new AdminLogMobileApiPage(page);
        await admin.goto();
        await admin.verifyPageLoaded();
    });

    test('filter tanpa hasil dan reset', async ({ page }) => {
        const admin = new AdminLogMobileApiPage(page);
        await admin.goto();
        await admin.filterWithoutResultAndReset();
    });

    test('pagination berpindah halaman', async ({ page }) => {
        const admin = new AdminLogMobileApiPage(page);
        await admin.goto();
        await admin.verifyPagination();
    });
});
