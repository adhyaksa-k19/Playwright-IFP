import { test } from '@playwright/test';
import { AdminBroadcastPage, BroadcastTarget } from '../pages/AdminBroadcastPage';
import { AdminInboxTeknisiPage } from '../pages/AdminInboxTeknisiPage';

test.describe.serial('Administrasi - Broadcast Pengumuman', () => {
    test.describe.configure({ timeout: 300_000 });

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

    const scenarios: Array<{ target: BroadcastTarget; label: string }> = [
        { target: 'propinsi', label: 'PROPINSI' },
        { target: 'koordinator', label: 'KOORDINATOR' },
        { target: 'teknisi', label: 'TEKNISI' },
    ];

    test('kirim pengumuman target NASIONAL dan validasi log', async ({ page }) => {
        test.fixme(true, 'Backend broadcast nasional tidak selesai >10 menit dan tidak membuat data inbox.');
        const suffix = `${Date.now()}-NASIONAL`;
        const title = `AUTO BROADCAST ${suffix}`;
        const message = `Pesan automation target NASIONAL ${suffix}`;
        const broadcast = new AdminBroadcastPage(page);
        await broadcast.goto();
        await broadcast.sendAnnouncement('nasional', title, message);

        const inbox = new AdminInboxTeknisiPage(page);
        await inbox.goto();
        await inbox.expectAnnouncementVisible(title, message);
    });

    for (const scenario of scenarios) {
        test(`kirim pengumuman target ${scenario.label} dan validasi log`, async ({ page }) => {
            const suffix = `${Date.now()}-${scenario.label}`;
            const title = `AUTO BROADCAST ${suffix}`;
            const message = `Pesan automation target ${scenario.label} ${suffix}`;
            const broadcast = new AdminBroadcastPage(page);
            await broadcast.goto();
            await broadcast.sendAnnouncement(scenario.target, title, message);

            const inbox = new AdminInboxTeknisiPage(page);
            await inbox.goto();
            await inbox.expectAnnouncementVisible(title, message);
        });
    }
});
