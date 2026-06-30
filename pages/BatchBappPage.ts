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
            .getByText(/Manifest Penyerahan ke APIP|Manifest Submission to APIP/)).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Buat Batch Baru|Create New Batch/ })).toBeVisible();
    }

    async verifyTable() {
        for (const header of [
            /Detail/,
            /Nomor Batch|Batch Number/,
            /Status/,
            /Jml Dokumen|Document Count/,
            /Keterangan|Description/,
            /Tanggal Dibuat|Date Created/,
            /Tanggal Dikirim|Date Sent/,
            /Pembuat|Created By/,
        ]) {
            await expect(this.page.getByText(header).first()).toBeVisible();
        }
        await expect(
            this.page.getByRole('button', { name: /Lihat Detail Batch|View Batch Detail/ }).first()
                .or(this.page.getByText(/No (?:rows to display|data available)/))
        ).toBeVisible();
    }

    async openFirstDetail() {
        const detail = this.page.getByRole('button', { name: /Lihat Detail Batch|View Batch Detail/ }).first();
        await expect(detail).toBeVisible();
        await detail.click();
        await expect(this.page).toHaveURL(/\/transaksi\/batch_bapp\/[^/?]+/);
        await expect(this.page.getByRole('heading', { name: /Batch:/ })).toBeVisible();
        await expect(this.page.getByRole('tab', { name: /Isi Dokumen Batch|Batch Documents/ })).toBeVisible();
        await expect(this.page.getByRole('tab', { name: /Tambah Dokumen Baru|Add New Document/ })).toBeVisible();
    }

    async createDraftBatch(batchNumber: string, description: string) {
        await this.page.getByRole('button', { name: /Buat Batch Baru|Create New Batch/ }).click();
        const dialog = this.page.getByRole('dialog', { name: /Buat Batch Baru|Create New Batch/ });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('textbox', { name: /Nomor Surat Pengantar \/ Batch|Cover Letter Number \/ Batch|Cover Letter \/ Batch Number|Batch Number/ })
            .fill(batchNumber);
        await dialog.getByRole('textbox', { name: /Keterangan Tambahan|Additional Remarks|Additional Description|Description/ })
            .fill(description);

        const response = this.page.waitForResponse((item) =>
            item.url().endsWith('/api/bapp-fisik/batch') &&
            item.request().method() === 'POST'
        );
        await dialog.getByRole('button', { name: /Simpan & Lanjutkan|Save & Continue/ }).click();
        const result = await response;
        expect(result.ok(), await result.text()).toBeTruthy();

        await expect(this.page).toHaveURL(/\/transaksi\/batch_bapp\/[^/?]+/);
        await expect(this.page.getByRole('heading', { name: new RegExp(batchNumber) })).toBeVisible();
        await expect(this.page.getByText('DRAFT', { exact: true })).toBeVisible();
    }

    async verifyPagination() {
        await expect(this.page.getByRole('combobox', { name: /Baris per halaman:|Rows per page/ })).toBeVisible();
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
