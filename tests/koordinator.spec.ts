import { BrowserContext, expect, Page, test } from '@playwright/test';
import {
    CoordinatorData,
    CoordinatorRowData,
    KoordinatorPage,
} from '../pages/KoordinatorPage';

test.describe.serial('Master - Koordinator', () => {
    let context: BrowserContext;
    let page: Page;
    let koordinator: KoordinatorPage;
    let filterData: CoordinatorRowData;
    let createdCode = '';

    const uniqueId = String(Date.now()).slice(-8);
    const data: CoordinatorData = {
        name: `KOORDINATOR AUTOMATION ${uniqueId}`,
        phone: `+62812${uniqueId}`,
        province: '',
    };

    test.beforeAll(async ({ browser, baseURL }) => {
        context = await browser.newContext({
            baseURL,
            storageState: 'playwright/.auth/user.json',
        });
        page = await context.newPage();
        koordinator = new KoordinatorPage(page);
        await koordinator.goto();
        await koordinator.verifyPageLoaded();
        filterData = await koordinator.getCoordinatorDataOnRow(4);
        data.province = filterData.province;
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
        await koordinator.filterByCode(filterData.code);
        await koordinator.expectCoordinatorVisible(filterData.code);
    });

    test('Filter - mencari berdasarkan nama koordinator', async () => {
        await koordinator.filterByName(filterData.name);
        await koordinator.expectCoordinatorVisible(filterData.name);
    });

    test('Filter - mencari berdasarkan nomor telepon', async () => {
        test.skip(!filterData.phone, 'Nomor telepon pada baris ke-5 kosong.');
        await koordinator.filterByPhone(filterData.phone);
        await koordinator.expectCoordinatorVisible(filterData.phone);
    });

    test('Filter - mencari berdasarkan propinsi', async () => {
        test.skip(!filterData.province, 'Propinsi pada baris ke-5 kosong.');
        await koordinator.filterByProvince(filterData.province);
        await koordinator.expectCoordinatorVisible(filterData.name);
    });

    test('Filter - mencari berdasarkan kabupaten/kota dinamis', async () => {
        test.skip(!filterData.province, 'Propinsi pada baris ke-5 kosong.');
        const regency = await koordinator.filterByFirstAvailableRegency(filterData.province);
        expect(regency).toBeTruthy();
    });

    test('Reset - mengosongkan seluruh filter', async () => {
        await koordinator.filterByName(filterData.name);
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
