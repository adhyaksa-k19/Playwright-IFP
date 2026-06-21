import { test } from '@playwright/test';
import { AdminBroadcastPage } from '../pages/AdminBroadcastPage';

test.describe('Administrasi - Broadcast Pengumuman', () => {
    test.describe.configure({ timeout: 120_000 });

    test('layout halaman tersedia', async ({ page }) => {
        const admin = new AdminBroadcastPage(page);
        await admin.goto();
        await admin.verifyPageLoaded();
    });

    test('validasi form tanpa mengirim pengumuman', async ({ page }) => {
        const admin = new AdminBroadcastPage(page);
        await admin.goto();
        await admin.verifyFormValidationWithoutSending();
    });

    test('pagination berpindah halaman', async ({ page }) => {
        const admin = new AdminBroadcastPage(page);
        await admin.goto();
        await admin.verifyPagination();
    });
});
