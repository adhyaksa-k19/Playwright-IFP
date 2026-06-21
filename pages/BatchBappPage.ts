import { expect, Page } from '@playwright/test';

export class BatchBappPage {
    constructor(private readonly page: Page) {}

    async goto() {
        const response = this.page.waitForResponse((item) =>
            item.url().includes('/api/bapp-fisik/batch?') && item.ok()
        );
        await this.page.goto('/transaksi/batch_bapp');
        await response;
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/transaksi\/batch_bapp\/?$/);
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Manifest Penyerahan ke APIP')).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Buat Batch Baru' })).toBeVisible();
    }

    async verifyTable() {
        for (const header of [
            'Detail', 'Nomor Batch', 'Status', 'Jml Dokumen', 'Keterangan',
            'Tanggal Dibuat', 'Tanggal Dikirim', 'Pembuat',
        ]) {
            await expect(this.page.getByText(header, { exact: true })).toBeVisible();
        }
        await expect(
            this.page.getByRole('button', { name: 'Lihat Detail Batch' }).first()
                .or(this.page.getByText(/No (?:rows to display|data available)/))
        ).toBeVisible();
    }

    async openFirstDetail() {
        const detail = this.page.getByRole('button', { name: 'Lihat Detail Batch' }).first();
        await expect(detail).toBeVisible();
        await detail.click();
        await expect(this.page).toHaveURL(/\/transaksi\/batch_bapp\/[^/?]+/);
        await expect(this.page.getByRole('heading', { name: /Batch:/ })).toBeVisible();
        await expect(this.page.getByRole('tab', { name: 'Isi Dokumen Batch' })).toBeVisible();
        await expect(this.page.getByRole('tab', { name: 'Tambah Dokumen Baru' })).toBeVisible();
    }

    async createDraftBatch(batchNumber: string, description: string) {
        await this.page.getByRole('button', { name: 'Buat Batch Baru' }).click();
        const dialog = this.page.getByRole('dialog', { name: 'Buat Batch Baru' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('textbox', { name: 'Nomor Surat Pengantar / Batch' })
            .fill(batchNumber);
        await dialog.getByRole('textbox', { name: 'Keterangan Tambahan' })
            .fill(description);

        const response = this.page.waitForResponse((item) =>
            item.url().endsWith('/api/bapp-fisik/batch') &&
            item.request().method() === 'POST'
        );
        await dialog.getByRole('button', { name: 'Simpan & Lanjutkan' }).click();
        const result = await response;
        expect(result.ok(), await result.text()).toBeTruthy();

        await expect(this.page).toHaveURL(/\/transaksi\/batch_bapp\/[^/?]+/);
        await expect(this.page.getByRole('heading', { name: new RegExp(batchNumber) })).toBeVisible();
        await expect(this.page.getByText('DRAFT', { exact: true })).toBeVisible();
    }

    async verifyPagination() {
        await expect(this.page.getByRole('combobox', { name: /Baris per halaman:/ })).toBeVisible();
        const previous = this.page.getByRole('button', { name: 'Go to previous page' });
        const next = this.page.getByRole('button', { name: 'Go to next page' });
        await expect(previous).toBeVisible();
        await expect(next).toBeVisible();
        if (await next.isEnabled()) {
            await next.click();
            await expect(previous).toBeEnabled();
        } else {
            await expect(previous).toBeDisabled();
        }
    }
}
