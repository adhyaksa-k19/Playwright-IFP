import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export class AdminInboxTeknisiPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/inbox_teknisi');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Log Notifikasi Teknisi', { exact: true })).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: 'Filter Pencarian' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Terapkan Filter' })).toBeVisible();
        await expect(this.page.getByRole('textbox', { name: 'Cari Teknisi (Nama/Kode)' })).toBeVisible();
    }

    async filterWithoutResultAndReset() {
        const input = this.page.getByRole('textbox', { name: 'Cari Teknisi (Nama/Kode)' });
        await input.fill(`TEKNISI_TIDAK_ADA_${Date.now()}`);
        await this.page.getByRole('button', { name: 'Terapkan Filter' }).click();
        await expect(this.emptyState()).toBeVisible({ timeout: TIMEOUT });

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(input).toHaveValue('');
    }

    async verifyPagination() {
        const next = this.page.getByRole('button', { name: 'Go to next page' });
        const previous = this.page.getByRole('button', { name: 'Go to previous page' });
        await expect(next).toBeEnabled({ timeout: TIMEOUT });
        await next.click();
        await expect(previous).toBeEnabled({ timeout: TIMEOUT });
    }

    async expectAnnouncementVisible(title: string, message: string) {
        await expect(this.page.getByText(title, { exact: true }).first())
            .toBeVisible({ timeout: 180_000 });
        await expect(this.page.getByText(message, { exact: true }).first())
            .toBeVisible({ timeout: 180_000 });
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }
}
