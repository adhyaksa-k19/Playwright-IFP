import { test, expect } from '@playwright/test';
import { AlokasiPage } from '../pages/AlokasiPage';

test.describe('Monitoring - Alokasi', () => {

    let alokasi: AlokasiPage;

    test.beforeEach(async ({ page }) => {
        alokasi = new AlokasiPage(page);
        await alokasi.goto();
        await alokasi.verifyPageLoaded();
    });

    // ─── Layout & UI ─────────────────────────────────────────────

    test('Page Layout - Filter section is visible', async () => {
        await alokasi.verifyFilterSection();
    });

    test('Page Layout - Dropdowns are visible', async () => {
        await alokasi.verifyDropdowns();
    });

    test('Page Layout - Checkboxes SN Terisi and SN Kosong visible', async () => {
        await alokasi.verifyCheckboxes();
    });

    test('Page Layout - Action buttons are visible', async () => {
        await alokasi.verifyActionButtons();
    });

    test('Table - Column headers are correct', async () => {
        await alokasi.verifyTableColumns();
    });

    test('Table - Has at least one row of data', async () => {
        await alokasi.verifyTableHasRows();
    });

    // ─── Filter Behaviour ─────────────────────────────────────────

    test('Filter - Search by ID Transaksi', async () => {

        const id = await alokasi.getIdTransaksiOnRow(0);

        await alokasi.fillIdTransaksi(id);
        await alokasi.clickCariAlokasi();

        await alokasi.verifyTableHasRows();

        const filteredId = await alokasi.getIdTransaksiOnRow(0);
        expect(filteredId).toContain(id);
    });

    test('Filter - Reset clears filters and reloads table', async () => {
        const id = await alokasi.getIdTransaksiOnRow(0);

        await alokasi.fillIdTransaksi(id);
        await alokasi.clickCariAlokasi();
        await alokasi.clickReset();

        await alokasi.verifyInputIsEmpty('ID Transaksi');
        await alokasi.verifyTableHasRows();
    });

    test('Filter - Search by Status Progress: SIAP DIINSTAL', async () => {
        await alokasi.selectStatusProgress('SIAP DIINSTAL');
        await alokasi.clickCariAlokasi();
        await alokasi.verifyTableHasRows();
    });

    test('Filter - Search by Pembayaran: PAID', async () => {
        await alokasi.selectPembayaran('PAID');
        await alokasi.clickCariAlokasi();
        await alokasi.verifyPaymentFilterResult('PAID');
    });

    test('Filter - Search with no matching results', async () => {
        await alokasi.fillIdTransaksi('ID_TIDAK_ADA_9999999');
        await alokasi.clickCariAlokasi();
        await alokasi.verifyTableIsEmpty();
    }); 

    // ─── Row Actions ──────────────────────────────────────────────

    test('Table - Edit button opens detail for first row', async ({ page }) => {
        await alokasi.clickViewOnRow(0);
        await expect(page).toHaveURL(/alokasi|detail|edit/i);
    });

    // ─── Checkboxes ──────────────────────────────────────────────

    test('Checkbox - SN Terisi is checked by default', async ({ page }) => {
        await expect(
            page.getByRole('checkbox', { name: 'SN Terisi' })
        ).toBeChecked();
    });

    test('Checkbox - SN Kosong is checked by default', async ({ page }) => {
        await expect(
            page.getByRole('checkbox', { name: 'SN Kosong' })
        ).toBeChecked();
    });

});
