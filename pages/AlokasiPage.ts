import { Page, expect } from '@playwright/test';

export class AlokasiPage {

    constructor(private page: Page) {}

    // ─── Navigation ──────────────────────────────────────────────

    async goto() {
        await this.page.goto('/monitoring/list_alokasi');
    }

    // ─── Core Checks ─────────────────────────────────────────────

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/list_alokasi/);
        await expect(this.page.getByRole('button', { name: 'Edit' }).first()).toBeVisible();
        await expect(
            this.page.getByRole('navigation', { name: 'breadcrumb' })
                .getByText('Daftar Alokasi')
        ).toBeVisible();
    }

    // ─── Filter Section ───────────────────────────────────────────

    async verifyFilterSection() {
        await expect(
            this.page.getByRole('textbox', { name: 'ID Transaksi' })
        ).toBeVisible();

        await expect(
            this.page.getByRole('textbox', { name: 'NPSN' })
        ).toBeVisible();

        await expect(
            this.page.getByRole('textbox', { name: 'Nama Instansi' })
        ).toBeVisible();

        await expect(
            this.page.getByRole('textbox', { name: 'AWB' })
        ).toBeVisible();

        await expect(
            this.page.getByRole('textbox', { name: 'Serial Number' })
        ).toBeVisible();
    }

async verifyDropdowns() {
    const dropdowns = [
        'Semua Status Progress', 'Semua Pembayaran', 'Semua Jenjang',
        'Semua Direktorat', 'Semua Propinsi', 'Semua Kabupaten Kota',
        'Semua Kecamatan', 'Semua Kelurahan',
    ];
    for (const dropdown of dropdowns) {
        await expect(
            this.page.getByRole('combobox').filter({ hasText: dropdown })
        ).toBeVisible();
    }
}

    async verifyCheckboxes() {
        await expect(
            this.page.getByRole('checkbox', { name: 'SN Terisi' })
        ).toBeVisible();

        await expect(
            this.page.getByRole('checkbox', { name: 'SN Kosong' })
        ).toBeVisible();
    }

    async verifyActionButtons() {
        await expect(
            this.page.getByRole('button', { name: 'Cari Alokasi' })
        ).toBeVisible();

        await expect(
            this.page.getByRole('button', { name: 'Reset' })
        ).toBeVisible();

        await expect(
            this.page.getByRole('button', { name: 'Excel' })
        ).toBeVisible();

        await expect(
            this.page.getByRole('button', { name: 'CSV' })
        ).toBeVisible();
    }

    // ─── Table ────────────────────────────────────────────────────

    async verifyTableColumns() {
        const headers = [
            'Aksi',
            'ID Transaksi',
            'Status',
            'Pembayaran',
            'NPSN',
            'Propinsi',
            'Kabupaten',
            'Nama Instansi',
        ];

        for (const header of headers) {
            await expect(
                this.page.getByText(header, { exact: true })
            ).toBeVisible();
        }
    }


    // ─── Filter Actions ───────────────────────────────────────────

    async fillIdTransaksi(value: string) {
        await this.page.getByRole('textbox', { name: 'ID Transaksi' }).fill(value);
    }

    async fillNpsn(value: string) {
        await this.page.getByRole('textbox', { name: 'NPSN' }).fill(value);
    }

    async fillNamaInstansi(value: string) {
        await this.page.getByRole('textbox', { name: 'Nama Instansi' }).fill(value);
    }

    async selectStatusProgress(value: string) {
        await this.page.getByRole('combobox').filter({ hasText: 'Semua Status Progress' }).click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async selectPembayaran(value: string) {
        await this.page
            .getByRole('combobox')
            .filter({ hasText: 'Semua Pembayaran' })
            .click();

        await this.page
            .locator(`[role="option"][data-value="${value}"]`)
            .click();
    }

async clickCariAlokasi() {
    await this.page.getByRole('button', { name: 'Cari Alokasi' }).click();

    await this.page.waitForLoadState('networkidle');
}

async clickReset() {
    await this.page.getByRole('button', { name: 'Reset' }).click();

    await this.page.waitForLoadState('networkidle');
}

    async verifyInputIsEmpty(name: string) {
    await expect(
        this.page.getByRole('textbox', { name })
    ).toHaveValue('');
    }

// ─── Row Actions ──────────────────────────────────────────────

    private getDataRows() {
        return this.page.getByRole('button', { name: 'Edit' });
    }

    async verifyTableHasRows() {
        await expect(this.getDataRows().first()).toBeVisible();
    }

    async getIdTransaksiOnRow(index: number): Promise<string> {
        const idLocator = this.page
            .locator('p.css-f2u90h')
            .nth(index);

        await expect(idLocator).toBeVisible();

        return (await idLocator.textContent())?.trim() ?? '';
    }

    async clickViewOnRow(index: number) {
        await this.getDataRows().nth(index).click();
        await this.page.waitForLoadState('networkidle');
    }
}
