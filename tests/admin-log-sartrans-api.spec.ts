import { test } from '@playwright/test';
import { AdminLogSartransApiPage } from '../pages/AdminLogSartransApiPage';

test.describe('Administrasi - Log Sartrans API', () => {
    test.describe.configure({ timeout: 120_000 });

    test('layout halaman tersedia', async ({ page }) => {
        const admin = new AdminLogSartransApiPage(page);
        await admin.goto();
        await admin.verifyPageLoaded();
    });

    test('filter tanpa hasil dan reset', async ({ page }) => {
        const admin = new AdminLogSartransApiPage(page);
        await admin.goto();
        await admin.filterWithoutResultAndReset();
    });

    test('pagination satu halaman dalam kondisi disabled', async ({ page }) => {
        const admin = new AdminLogSartransApiPage(page);
        await admin.goto();
        await admin.verifySinglePagePagination();
    });
});
