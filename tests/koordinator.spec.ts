import { BrowserContext, expect, Page, test } from '@playwright/test';
import { CoordinatorData, KoordinatorPage } from '../pages/KoordinatorPage';

test.describe.serial('Master - Koordinator', () => {
    let context: BrowserContext;
    let page: Page;
    let koordinator: KoordinatorPage;
    let createdCode = '';

    const uniqueId = String(Date.now()).slice(-8);
    const data: CoordinatorData = {
        name: `KOORDINATOR AUTOMATION ${uniqueId}`,
        phone: `+62812${uniqueId}`,
        province: 'Prov. Banten',
    };

    test.beforeAll(async ({ browser, baseURL }) => {
        context = await browser.newContext({
            baseURL,
            storageState: 'playwright/.auth/user.json',
        });
        page = await context.newPage();
        koordinator = new KoordinatorPage(page);
    });

    test.afterAll(async () => {
        await koordinator.deleteCoordinatorByNameIfExists(data.name);
        await context.close();
    });

    test('Page layout - filter dan action tersedia', async () => {
        await koordinator.goto();
        await koordinator.verifyPageLoaded();
        await koordinator.verifyFilterSection();
    });

    test('Filter - mencari berdasarkan kode koordinator', async () => {
        await koordinator.filterByCode('KD-2026-00000001');
        await koordinator.expectCoordinatorVisible('KD-2026-00000001');
    });

    test('Filter - mencari berdasarkan nama koordinator', async () => {
        await koordinator.filterByName('SKYWALKER');
        await koordinator.expectCoordinatorVisible('SKYWALKER');
    });

    test('Filter - mencari berdasarkan nomor telepon', async () => {
        await koordinator.filterByPhone('+62122');
        await koordinator.expectCoordinatorVisible('+62122');
    });

    test('Filter - mencari berdasarkan propinsi', async () => {
        await koordinator.filterByProvince('Prov. Banten');
        await koordinator.expectTableHasData();
    });

    test('Filter - kabupaten/kota tanpa hasil menampilkan empty state', async () => {
        await koordinator.filterByRegency('Prov. Banten', 'Kab. Serang');
        await koordinator.expectNoData();
    });

    test('Reset - mengosongkan seluruh filter', async () => {
        await koordinator.filterByName('SKYWALKER');
        await koordinator.resetFilters();
        await koordinator.expectFiltersReset();
    });

    test('Pagination - pindah ke halaman berikutnya dan kembali', async () => {
        await koordinator.resetFilters();
        await koordinator.verifyPagination();
    });

    test('Tambah - koordinator baru berhasil disimpan', async () => {
        await koordinator.openAddCoordinator();
        await koordinator.addCoordinator(data);
    });

    test('Filter - koordinator baru tampil berdasarkan nama', async () => {
        await koordinator.filterByName(data.name);
        await koordinator.expectCoordinatorVisible(data.name);
        createdCode = await koordinator.getVisibleCoordinatorCode();
        expect(createdCode).toMatch(/^KD-\d{4}-\d+$/);
    });

    test('Hapus - koordinator baru berhasil dihapus melalui API aplikasi', async () => {
        await koordinator.deleteCoordinatorByCode(createdCode);
    });

    test('Hapus - koordinator yang dihapus tidak ditemukan', async () => {
        await koordinator.expectCoordinatorDeleted(createdCode);
    });
});
