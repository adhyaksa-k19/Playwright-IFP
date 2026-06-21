import { expect, Page } from '@playwright/test';

export class PerbaikanPage {
    constructor(private readonly page: Page) {}

    async goto() {
        const response = this.waitForData();
        await this.page.goto('/transaksi/list_perbaikan');
        await response;
        await expect(this.rowActions().first()).toBeVisible();
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/list_perbaikan/);
        await expect(this.page.getByText('Perbaikan Kerusakan')).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Cari Data' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
    }

    async firstTransactionId() {
        const id = this.page.locator('main p').filter({ hasText: /^HI\d+$/ }).first();
        await expect(id).toBeVisible();
        return (await id.textContent())!.trim();
    }

    async searchByTransactionId(id: string) {
        await this.page.getByRole('textbox', { name: 'ID Transaksi' }).fill(id);
        const response = this.waitForData((url) => url.includes(`id_transaksi=${id}`));
        await this.page.getByRole('button', { name: 'Cari Data' }).click();
        await response;
        await expect(this.page.getByText(id, { exact: true }).first()).toBeVisible();
    }

    async selectStatus(status: string) {
        await this.page.getByRole('combobox').filter({ hasText: 'Semua Status' }).click();
        await this.page.getByRole('option', { name: status, exact: true }).click();
        const response = this.waitForData();
        await this.page.getByRole('button', { name: 'Cari Data' }).click();
        await response;
        await expect(this.page.getByText(status, { exact: true }).first()).toBeVisible();
    }

    async reset() {
        const response = this.waitForData();
        await this.page.getByRole('button', { name: 'Reset' }).click();
        await response;
        await expect(this.page.getByRole('textbox', { name: 'ID Transaksi' })).toHaveValue('');
    }

    async verifyPaginationForCurrentDataset() {
        await expect(this.page.getByRole('combobox', { name: /Baris per halaman:/ })).toHaveText('100');
        await expect(this.page.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
        await expect(this.page.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
    }

    private rowActions() {
        return this.page.getByRole('button', { name: /Evaluasi|Lihat Detail/ });
    }

    private waitForData(extra: (url: string) => boolean = () => true) {
        return this.page.waitForResponse((response) => {
            const url = response.url();
            return url.includes('/api/transaksi/perbaikan?') && response.ok() && extra(url);
        });
    }
}
