import { test } from '@playwright/test';
import { ProsesInstalasiPage } from '../pages/ProsesInstalasiPage';

test.describe('Monitoring - Proses Instalasi', () => {
    let prosesInstalasi: ProsesInstalasiPage;

    test.beforeEach(async ({ page }) => {
        prosesInstalasi = new ProsesInstalasiPage(page);
        await prosesInstalasi.goto();
        await prosesInstalasi.verifyPageLoaded();
    });

    test('Page layout - filter dan action tersedia', async () => {
        await prosesInstalasi.verifyFilterSection();
        await prosesInstalasi.verifyActionButtons();
    });

    test('Summary - seluruh status instalasi tersedia', async () => {
        await prosesInstalasi.verifySummary();
    });

    test('Table - kolom dan data instalasi tersedia', async () => {
        await prosesInstalasi.verifyTableColumns();
        await prosesInstalasi.verifyTableHasData();
    });

    test('Filter - mencari berdasarkan NPSN dari baris pertama', async () => {
        const npsn = await prosesInstalasi.getFirstRowNpsn();
        await prosesInstalasi.searchByNpsn(npsn);
    });

    test('Filter - Reset memuat ulang data setelah hasil pencarian kosong', async () => {
        await prosesInstalasi.searchNpsnWithoutResults('NPSN_TIDAK_ADA_999999');
        await prosesInstalasi.resetFilters();
    });

    test('Pagination - kontrol navigasi grup tersedia', async () => {
        await prosesInstalasi.verifyPagination();
    });
});
