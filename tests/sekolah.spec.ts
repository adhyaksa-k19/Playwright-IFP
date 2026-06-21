import { BrowserContext, expect, Page, test } from '@playwright/test';
import { SchoolData, SekolahPage } from '../pages/SekolahPage';

test.describe.serial('Master - Sekolah', () => {
    let context: BrowserContext;
    let page: Page;
    let sekolah: SekolahPage;

    const uniqueNpsn = String(Date.now()).slice(-8);
    const data: SchoolData = {
        npsn: uniqueNpsn,
        name: `SEKOLAH AUTOMATION ${uniqueNpsn}`,
        jenjang: 'SD',
        direktorat: 'SD',
    };

    test.beforeAll(async ({ browser, baseURL }) => {
        context = await browser.newContext({
            baseURL,
            storageState: 'playwright/.auth/user.json',
        });
        page = await context.newPage();
        sekolah = new SekolahPage(page);
    });

    test.afterAll(async () => {
        await sekolah.deleteSchoolIfExists(data.npsn);
        await context.close();
    });

    test('Page layout - halaman daftar sekolah tersedia', async () => {
        await sekolah.goto();
        await sekolah.verifyPageLoaded();
    });

    test('Filter - mencari sekolah berdasarkan NPSN', async () => {
        await sekolah.filterByNpsn('10001804');
        await sekolah.expectSchoolVisible('10001804', 'SDN LUENG SA');
    });

    test('Tambah - sekolah baru berhasil disimpan', async () => {
        await sekolah.openAddSchool();
        await sekolah.addSchool(data);
    });

    test('Filter - sekolah baru tampil berdasarkan NPSN', async () => {
        await sekolah.filterByNpsn(data.npsn);
        await sekolah.expectSchoolVisible(data.npsn, data.name);
    });

    test('Hapus - sekolah baru berhasil dihapus', async () => {
        const deleted = await sekolah.deleteSchoolIfExists(data.npsn);
        expect(deleted).toBe(true);
    });

    test('Hapus - sekolah yang dihapus tidak ditemukan', async () => {
        await sekolah.expectSchoolDeleted(data.npsn);
    });
});
