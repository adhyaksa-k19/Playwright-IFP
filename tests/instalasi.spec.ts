import { test } from '@playwright/test';
import { InstalasiPage } from '../pages/InstalasiPage';

test.describe('Transaksi - Instalasi', () => {
    let instalasi: InstalasiPage;

    test.beforeEach(async ({ page }) => {
        instalasi = new InstalasiPage(page);
        await instalasi.goto();
        await instalasi.verifyPageLoaded();
    });

    test('filter ID Transaksi dan reset', async () => {
        const id = await instalasi.firstTransactionId();
        await instalasi.searchByTransactionId(id);
        await instalasi.reset();
    });

    test('filter status progress', async () => {
        await instalasi.selectStatus('SIAP DIINSTAL');
    });

    test('mengubah jumlah baris dan berpindah halaman', async () => {
        await instalasi.changePageSizeTo25();
        await instalasi.goToNextPage();
    });
});
