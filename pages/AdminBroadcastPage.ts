import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export class AdminBroadcastPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/broadcast');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Broadcast Pengumuman', { exact: true })).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: 'Buat Pengumuman Baru' })).toBeVisible();
        await expect(this.page.getByRole('combobox').filter({ hasText: 'Semua Teknisi' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'KIRIM PENGUMUMAN MASSAL' })).toBeDisabled();
        await expect(this.page.getByRole('button', { name: 'Resend' }).first()).toBeVisible();
    }

    async verifyFormValidationWithoutSending() {
        const title = this.page.getByRole('textbox', { name: 'Judul Pengumuman' });
        const message = this.page.getByRole('textbox', { name: 'Isi Pesan' });
        const submit = this.page.getByRole('button', { name: 'KIRIM PENGUMUMAN MASSAL' });

        await title.fill('TEST VALIDASI OTOMASI');
        await expect(submit).toBeDisabled();
        await message.fill('Pesan hanya untuk menguji validasi form dan tidak dikirim.');
        await expect(submit).toBeEnabled();

        await title.clear();
        await message.clear();
        await expect(submit).toBeDisabled();
    }

    async verifyPagination() {
        const next = this.page.getByRole('button', { name: 'Go to next page' });
        const previous = this.page.getByRole('button', { name: 'Go to previous page' });
        await expect(next).toBeEnabled({ timeout: TIMEOUT });
        await next.click();
        await expect(previous).toBeEnabled({ timeout: TIMEOUT });
    }
}
