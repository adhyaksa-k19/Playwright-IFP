import { expect, Page } from '@playwright/test';

export class ProsesInstalasiPage {
    constructor(private readonly page: Page) {}

    private textbox(name: string) {
        const labels: Record<string, RegExp> = {
            Mulai: /^(Mulai|Start)$/,
            Selesai: /^(Selesai|End)$/,
            'Nama Koordinator/Teknisi': /^(Nama Koordinator\/Teknisi|Coordinator\/Technician Name)$/,
            'Nama Sekolah': /^(Nama Sekolah|School Name)$/,
        };

        return this.page.getByRole('textbox', {
            name: labels[name] ?? new RegExp(`^${name}$`),
        });
    }

    private combobox(name: string) {
        const labels: Record<string, RegExp> = {
            Teknisi: /^(Teknisi|Technician)$/,
            'SEMUA PROPINSI': /^(SEMUA PROPINSI|All Provinces)$/,
            'SEMUA KABUPATEN': /^(SEMUA KABUPATEN|All Regencies)$/,
            'SEMUA KECAMATAN': /^(SEMUA KECAMATAN|All Districts)$/,
            'SEMUA STATUS': /^(SEMUA STATUS|ALL STATUS)$/,
        };

        return this.page.getByRole('combobox', {
            name: labels[name] ?? new RegExp(`^${name}$`),
        });
    }

    private button(name: string) {
        const labels: Record<string, RegExp> = {
            Cari: /^(Cari|Search)$/,
        };

        return this.page.getByRole('button', {
            name: labels[name] ?? new RegExp(`^${name}$`),
        });
    }

    async goto() {
        await this.page.goto('/monitoring/proses_instalasi');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/monitoring\/proses_instalasi/);
        await expect(
            this.page
                .getByRole('navigation', { name: 'breadcrumb' })
                .getByText(/Proses Instalasi|Installation Process/)
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
            await expect(this.textbox(name)).toBeVisible();
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
            await expect(this.combobox(name)).toBeVisible();
        }

        await expect(
            this.combobox('SEMUA KABUPATEN')
        ).toBeDisabled();
        await expect(
            this.combobox('SEMUA KECAMATAN')
        ).toBeDisabled();
    }

    async verifyActionButtons() {
        for (const name of ['Cari', 'Reset', 'Excel', 'CSV']) {
            await expect(this.button(name)).toBeVisible();
        }
    }

    async verifySummary() {
        const labels = [
            /TOTAL INSTALASI|TOTAL INSTALLATIONS/,
            /PROSES INSTALASI|INSTALLATION PROCESS/,
            /INSTALASI GAGAL|FAILED INSTALLATION/,
            /INSTALASI SELESAI|COMPLETED INSTALLATION/,
        ];

        const main = this.page.getByRole('main');
        for (const label of labels) {
            await expect(
                main.getByText(label).first()
            ).toBeVisible();
        }
    }

    async verifyTableColumns() {
        const headers = [
            /^(No)$/,
            /^(Nama Teknisi|Technician)$/,
            /^(Telp Teknisi|Phone Number)$/,
            /^(Group)$/,
            /^(No\. Inst|Inst\. No\.)$/,
            /^(Jam|Time)$/,
            /^(Trans\. ID|Transaction ID)$/,
            /^(NPSN)$/,
            /^(Propinsi|Province)$/,
            /^(Kabupaten|Regency \/ City)$/,
            /^(Kecamatan|District)$/,
            /^(Nama Sekolah|School Name)$/,
            /^(PIC)$/,
            /^(Telp PIC|PIC Phone)$/,
            /^(Foto|Photo)$/,
            /^(Status)$/,
        ];

        const table = this.page.getByRole('table');
        for (const header of headers) {
            await expect(
                table.getByRole('columnheader', { name: header })
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
        await this.textbox('NPSN').fill(npsn);
        await this.button('Cari').click();
        await this.waitForTableReady();
        await expect(this.page.getByRole('table')).toContainText(npsn);
    }

    async searchNpsnWithoutResults(npsn: string) {
        await this.textbox('NPSN').fill(npsn);
        await this.button('Cari').click();
        await this.waitForTableReady();
        await expect(this.emptyState()).toBeVisible();
    }

    async resetFilters() {
        await this.button('Reset').click();
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
        return this.page.getByRole('alert').filter({ hasText: /Gagal memuat data|Failed to load data/ });
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
