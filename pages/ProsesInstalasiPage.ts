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

        for (const label of labels) {
            await expect(this.page.getByText(label, { exact: true })).toBeVisible();
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
        await expect(this.firstDataRow()).toBeVisible();
        await expect(this.firstDataRow().getByRole('cell')).toHaveCount(16);
    }

    async getFirstRowNpsn(): Promise<string> {
        const npsn = this.firstDataRow().getByRole('cell').nth(7);
        await expect(npsn).toBeVisible();
        return (await npsn.textContent())?.trim() ?? '';
    }

    async searchByNpsn(npsn: string) {
        await this.page.getByRole('textbox', { name: 'NPSN', exact: true }).fill(npsn);
        await this.page.getByRole('button', { name: 'Cari', exact: true }).click();
        await expect(this.page.getByRole('table')).toContainText(npsn);
    }

    async searchNpsnWithoutResults(npsn: string) {
        await this.page.getByRole('textbox', { name: 'NPSN', exact: true }).fill(npsn);
        await this.page.getByRole('button', { name: 'Cari', exact: true }).click();
        await expect(this.page.getByRole('cell', { name: 'No data available' })).toBeVisible();
    }

    async resetFilters() {
        await this.page.getByRole('button', { name: 'Reset', exact: true }).click();
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
}
