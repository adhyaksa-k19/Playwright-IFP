import { expect, test } from '@playwright/test';
import { CreateAlokasiPage, SchoolAllocation } from '../pages/CreateAlokasiPage';

test.describe('Transaksi - Buat Alokasi', () => {
    let createAlokasi: CreateAlokasiPage;
    let firstSchool: SchoolAllocation;

    test.beforeEach(async ({ page }) => {
        createAlokasi = new CreateAlokasiPage(page);
        firstSchool = await createAlokasi.goto();
        await createAlokasi.verifyPageLoaded();
    });

    test('menampilkan filter dan action utama', async () => {
        await createAlokasi.verifyFilters();
    });

    test('filter NPSN dan reset', async ({ page }) => {
        await createAlokasi.searchByNpsn(firstSchool.npsn);
        await createAlokasi.reset();
        await expect(page.getByRole('textbox', { name: 'NPSN' })).toHaveValue('');
    });

    test('pagination berpindah ke halaman berikutnya', async () => {
        await createAlokasi.goToNextPage();
    });

    test('memilih sekolah membuka dialog Tambah Alokasi', async () => {
        await createAlokasi.selectFirstSchool();
        const dialog = await createAlokasi.openAddDialog();
        await dialog.getByRole('button', { name: 'Batal' }).click();
        await expect(dialog).toBeHidden();
    });

    test('menambah satu alokasi', async () => {
        await createAlokasi.selectFirstSchool();
        await createAlokasi.openAddDialog();
        const result = await createAlokasi.submitAllocation(1);
        expect(result).toMatchObject({
            success: true,
            message: expect.stringContaining('Processing 1 Allocations'),
        });
    });
});
