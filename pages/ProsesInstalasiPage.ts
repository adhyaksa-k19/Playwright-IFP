import { expect, Page } from '@playwright/test';

export class ProsesInstalasiPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/monitoring/proses_instalasi');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/monitoring\/proses_instalasi/);
        await expect(
            this.page
                .getByRole('navigation', { name: 'breadcrumb' })
                .getByText('Proses Instalasi', { exact: true })
        ).toBeVisible();
        await expect(this.page.getByRole('table')).toBeVisible();
    }

    async verifyFilterSection() {
        const textboxes = [
            'Mulai',
            'Selesai',
            'Nama Koordinator/Teknisi',
            'Nama Sekolah',
            'NPSN',
        ];

        for (const name of textboxes) {
            await expect(this.page.getByRole('textbox', { name, exact: true })).toBeVisible();
        }

        const comboboxes = [
            'Teknisi',
            'All Group',
            'SEMUA PROPINSI',
            'SEMUA KABUPATEN',
            'SEMUA KECAMATAN',
            'SEMUA STATUS',
        ];

        for (const name of comboboxes) {
            await expect(this.page.getByRole('combobox', { name, exact: true })).toBeVisible();
        }

        await expect(
            this.page.getByRole('combobox', { name: 'SEMUA KABUPATEN', exact: true })
        ).toBeDisabled();
        await expect(
            this.page.getByRole('combobox', { name: 'SEMUA KECAMATAN', exact: true })
        ).toBeDisabled();
    }

    async verifyActionButtons() {
        for (const name of ['Cari', 'Reset', 'Excel', 'CSV']) {
            await expect(this.page.getByRole('button', { name, exact: true })).toBeVisible();
        }
    }

    async verifySummary() {
        const labels = [
            'TOTAL INSTALASI',
            'PROSES INSTALASI',
            'INSTALASI GAGAL',
            'INSTALASI SELESAI',
        ];

        const main = this.page.getByRole('main');
        for (const label of labels) {
            await expect(
                main.getByText(label, { exact: true }).first()
            ).toBeVisible();
        }
    }

    async verifyTableColumns() {
        const headers = [
            'No',
            'Nama Teknisi',
            'Telp Teknisi',
            'Group',
            'No. Inst',
            'Jam',
            'Trans. ID',
            'NPSN',
            'Propinsi',
            'Kabupaten',
            'Kecamatan',
            'Nama Sekolah',
            'PIC',
            'Telp PIC',
            'Foto',
            'Status',
        ];

        const table = this.page.getByRole('table');
        for (const header of headers) {
            await expect(
                table.getByRole('columnheader', { name: header, exact: true })
            ).toBeVisible();
        }
    }

    async verifyTableHasData() {
        await this.waitForDataRowWithRetry();
        await expect(this.firstDataRow()).toBeVisible();
        await expect(this.firstDataRow().getByRole('cell')).toHaveCount(16);
    }

    async getFirstRowNpsn(): Promise<string> {
        await this.waitForDataRowWithRetry();
        const npsn = this.firstDataRow().getByRole('cell').nth(7);
        await expect(npsn).toBeVisible();
        return (await npsn.textContent())?.trim() ?? '';
    }

    async searchByNpsn(npsn: string) {
        await this.page.getByRole('textbox', { name: 'NPSN', exact: true }).fill(npsn);
        await this.page.getByRole('button', { name: 'Cari', exact: true }).click();
        await this.waitForTableReady();
        await expect(this.page.getByRole('table')).toContainText(npsn);
    }

    async searchNpsnWithoutResults(npsn: string) {
        await this.page.getByRole('textbox', { name: 'NPSN', exact: true }).fill(npsn);
        await this.page.getByRole('button', { name: 'Cari', exact: true }).click();
        await this.waitForTableReady();
        await expect(this.emptyState()).toBeVisible();
    }

    async resetFilters() {
        await this.page.getByRole('button', { name: 'Reset', exact: true }).click();
        await this.waitForTableReady();
        await this.verifyTableHasData();
    }

    async verifyPagination() {
        await expect(this.page.getByText(/\d+[–-]\d+ of \d+/)).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Go to previous page' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Go to next page' })).toBeVisible();
    }

    private firstDataRow() {
        return this.page.getByRole('table').locator('tbody tr').filter({
            has: this.page.locator('td:nth-child(16)'),
        }).first();
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }

    private loadError() {
        return this.page.getByRole('alert').filter({ hasText: 'Gagal memuat data' });
    }

    private async waitForDataRowWithRetry() {
        for (let attempt = 0; attempt < 3; attempt++) {
            await this.waitForTableReady();
            if (await this.firstDataRow().isVisible().catch(() => false)) return;

            const apiFailed = await this.loadError().isVisible().catch(() => false);
            if (!apiFailed || attempt === 2) break;

            await this.page.reload();
            await this.verifyPageLoaded();
        }

        await expect(
            this.firstDataRow(),
            'Data instalasi tidak tersedia setelah 3 kali percobaan'
        ).toBeVisible();
    }

    private async waitForTableReady() {
        const loading = this.page.getByText('Loading data...', { exact: true });
        if (await loading.isVisible().catch(() => false)) {
            await expect(loading).toBeHidden({ timeout: 60_000 });
        }

        await expect(
            this.firstDataRow().or(this.emptyState())
        ).toBeVisible({ timeout: 60_000 });
    }
}
