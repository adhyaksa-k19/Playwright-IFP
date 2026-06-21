import { Page, expect } from '@playwright/test';

export class AlokasiPage {

    private selectedStatusProgress: string | null = null;
    private selectedPayment: string | null = null;

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
        const input = this.page.getByRole('textbox', { name: 'ID Transaksi' });
        await input.fill(value);
        await input.blur();
        await expect(input).toHaveValue(value);
    }

    async fillNpsn(value: string) {
        const input = this.page.getByRole('textbox', { name: 'NPSN' });
        await input.fill(value);
        await input.blur();
        await expect(input).toHaveValue(value);
    }

    async fillNamaInstansi(value: string) {
        const input = this.page.getByRole('textbox', { name: 'Nama Instansi' });
        await input.fill(value);
        await input.blur();
        await expect(input).toHaveValue(value);
    }

    async selectStatusProgress(value: string) {
        await this.page.getByRole('combobox').filter({ hasText: 'Semua Status Progress' }).click();
        await this.page.getByRole('option', { name: value }).click();
        this.selectedStatusProgress = value;
    }

    async selectPembayaran(value: string) {
        await this.page
            .getByRole('combobox')
            .filter({ hasText: 'Semua Pembayaran' })
            .click();

        await this.page
            .locator(`[role="option"][data-value="${value}"]`)
            .click();
        this.selectedPayment = value;
    }

async clickCariAlokasi() {
    const idTransaksi = await this.page
        .getByRole('textbox', { name: 'ID Transaksi' })
        .inputValue();
    const npsn = await this.page
        .getByRole('textbox', { name: 'NPSN' })
        .inputValue();
    const namaSekolah = await this.page
        .getByRole('textbox', { name: 'Nama Instansi' })
        .inputValue();

    const response = this.page.waitForResponse((item) => {
        if (!item.url().includes('/api/transaksi/alokasi?')) {
            return false;
        }
        const params = new URL(item.url()).searchParams;
        return params.get('search') === 'true' &&
            (!idTransaksi || params.get('id_transaksi') === idTransaksi) &&
            (!npsn || params.get('npsn') === npsn) &&
            (!namaSekolah || params.get('nama_sekolah') === namaSekolah) &&
            (!this.selectedStatusProgress ||
                params.get('kode_status_progress') === this.selectedStatusProgress) &&
            (!this.selectedPayment ||
                params.get('kode_status_pembayaran') === this.selectedPayment);
    }, { timeout: 75_000 });

    await this.page.getByRole('button', { name: 'Cari Alokasi' }).click();

    const result = await response;
    expect(result.ok(), `HTTP ${result.status()} saat mencari alokasi`).toBeTruthy();
    await this.page.waitForTimeout(5_000);
}

async clickReset() {
    await this.page.getByRole('button', { name: 'Reset' }).click();
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

    async verifyTableIsEmpty() {
        await expect(
            this.emptyState()
        ).toBeVisible({ timeout: 60_000 });
    }

    async verifyPaymentFilterResult(value: string) {
        const firstRow = this.getDataRows().first();
        await expect(firstRow.or(this.emptyState())).toBeVisible({ timeout: 60_000 });

        if (await firstRow.isVisible().catch(() => false)) {
            await expect(this.page.getByText(value, { exact: true }).first()).toBeVisible();
        }
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
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }
}
