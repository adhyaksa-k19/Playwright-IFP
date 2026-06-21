import { test } from '@playwright/test';
import { PerbaikanPage } from '../pages/PerbaikanPage';

test.describe('Transaksi - Perbaikan', () => {
    let perbaikan: PerbaikanPage;

    test.beforeEach(async ({ page }) => {
        perbaikan = new PerbaikanPage(page);
        await perbaikan.goto();
        await perbaikan.verifyPageLoaded();
    });

    test('filter ID Transaksi dan reset', async () => {
        const id = await perbaikan.firstTransactionId();
        await perbaikan.searchByTransactionId(id);
        await perbaikan.reset();
    });

    test('filter status approval', async () => {
        await perbaikan.selectStatus('DISETUJUI');
    });

    test('pagination disabled ketika semua data muat satu halaman', async () => {
        await perbaikan.verifyPaginationForCurrentDataset();
    });
});
