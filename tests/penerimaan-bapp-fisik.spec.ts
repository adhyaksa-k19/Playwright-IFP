import { test } from '@playwright/test';
import { PenerimaanBappFisikPage } from '../pages/PenerimaanBappFisikPage';

test.describe('Transaksi - Penerimaan BAPP Fisik', () => {
    let penerimaan: PenerimaanBappFisikPage;

    test.beforeEach(async ({ page }) => {
        penerimaan = new PenerimaanBappFisikPage(page);
        await penerimaan.goto();
        await penerimaan.verifyPageLoaded();
    });

    test('menampilkan filter, action, dan kolom folder', async () => {
        await penerimaan.verifyFolderControls();
    });

    test('mencari nama folder dan reset', async () => {
        const folder = await penerimaan.firstFolderName();
        await penerimaan.searchFolder(folder);
        await penerimaan.resetFolderSearch();
    });

    test('tab Audit Trail menampilkan filter audit', async () => {
        await penerimaan.verifyAuditTrail();
    });

    test('dialog Buat Folder Baru dapat dibuka dan dibatalkan', async () => {
        await penerimaan.verifyCreateFolderDialog();
    });

    test('kontrol pagination folder berfungsi sesuai jumlah data', async () => {
        await penerimaan.verifyPagination();
    });
});
