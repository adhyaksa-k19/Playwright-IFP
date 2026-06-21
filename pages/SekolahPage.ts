import { expect, Page } from '@playwright/test';

export interface SchoolData {
    npsn: string;
    name: string;
    jenjang: string;
    direktorat: string;
}

export class SekolahPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/master/sekolah');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/master\/sekolah(?:\?|$)/);
        await expect(
            this.page
                .getByRole('navigation', { name: 'breadcrumb' })
                .getByText('Daftar Sekolah', { exact: true })
        ).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Tambah Sekolah' })).toBeVisible();
    }

    async filterByNpsn(npsn: string) {
        await this.page.getByRole('textbox', { name: 'NPSN', exact: true }).fill(npsn);
        await this.page.getByRole('button', { name: 'Cari Sekolah', exact: true }).click();

        await expect(
            this.page.getByText(npsn, { exact: true }).or(
                this.emptyState()
            )
        ).toBeVisible();
    }

    async expectSchoolVisible(npsn: string, name: string) {
        await expect(this.page.getByText(npsn, { exact: true })).toBeVisible();
        await expect(this.page.getByText(name, { exact: true })).toBeVisible();
    }

    async openAddSchool() {
        await this.page.getByRole('button', { name: 'Tambah Sekolah', exact: true }).click();
        await expect(this.page).toHaveURL(/\/master\/detail_sekolah/);
        await expect(this.page.getByRole('heading', { name: 'Informasi Sekolah' })).toBeVisible();
    }

    async addSchool(data: SchoolData) {
        await this.page.getByRole('textbox', { name: 'NPSN', exact: true }).fill(data.npsn);
        await this.page.getByRole('textbox', { name: 'Nama Sekolah', exact: true }).fill(data.name);
        await this.selectOption('Pilih Jenjang', data.jenjang);
        await this.selectOption('Pilih Direktorat', data.direktorat);

        await this.page.getByRole('button', { name: 'Simpan Sekolah', exact: true }).click();
        await expect(this.page).toHaveURL(/\/master\/sekolah(?:\?|$)/);
    }

    async deleteSchoolIfExists(npsn: string): Promise<boolean> {
        await this.goto();
        await this.verifyPageLoaded();
        await this.filterByNpsn(npsn);

        if (!await this.page.getByText(npsn, { exact: true }).isVisible()) {
            return false;
        }

        const confirmation = new Promise<void>((resolve) => {
            this.page.once('dialog', async (dialog) => {
                await dialog.accept();
                resolve();
            });
        });
        await this.page.getByRole('button', { name: 'Hapus', exact: true }).click();
        await confirmation;

        await expect(this.page.getByText(npsn, { exact: true })).not.toBeVisible();
        return true;
    }

    async expectSchoolDeleted(npsn: string) {
        await this.filterByNpsn(npsn);
        await expect(this.page.getByText(npsn, { exact: true })).not.toBeVisible();
        await expect(this.emptyState()).toBeVisible();
    }

    private async selectOption(placeholder: string, option: string) {
        await this.page.getByRole('combobox').filter({ hasText: placeholder }).click();
        await this.page.getByRole('option', { name: option, exact: true }).click();
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }
}
