import { test } from '@playwright/test';
import { AdminInboxTeknisiPage } from '../pages/AdminInboxTeknisiPage';

test.describe('Administrasi - Log Notifikasi Teknisi', () => {
    test.describe.configure({ timeout: 120_000 });

    test('layout halaman tersedia', async ({ page }) => {
        const admin = new AdminInboxTeknisiPage(page);
        await admin.goto();
        await admin.verifyPageLoaded();
    });

    test('filter tanpa hasil dan reset', async ({ page }) => {
        const admin = new AdminInboxTeknisiPage(page);
        await admin.goto();
        await admin.filterWithoutResultAndReset();
    });

    test('pagination berpindah halaman', async ({ page }) => {
        const admin = new AdminInboxTeknisiPage(page);
        await admin.goto();
        await admin.verifyPagination();
    });
});
