import { expect, Page } from '@playwright/test';

export class PenerimaanBappFisikPage {
    constructor(private readonly page: Page) {}

    private label(name: string) {
        const labels: Record<string, RegExp> = {
            'Buat Folder Baru': /^(Buat Folder Baru|Create New Folder)$/,
            'Kelola BAPP': /^(Kelola BAPP|Manage BAPP)$/,
            Aksi: /Aksi|Actions/,
            'Nama Folder / Batch': /Nama Folder \/ Batch|Folder \/ Batch Name/,
            'Isi Dokumen': /Isi Dokumen|Document Content/,
            'Tanggal Dibuat': /Tanggal Dibuat|Received Date|Created Date/,
            'Buat Folder Grouping Baru': /Buat Folder Grouping Baru|Create New Grouping Folder|Create New Folder/,
            'Nama / Nomor Folder': /Nama \/ Nomor Folder|Folder Name \/ Number|Folder Name|Gate PIC/,
            'Simpan Folder': /Simpan Folder|Save Folder|Create Batch/,
            Batal: /^(Batal|Cancel)$/,
        };

        return labels[name] ?? new RegExp(`^${name}$`);
    }

    private button(name: string) {
        return this.page.getByRole('button', { name: this.label(name) });
    }

    async goto() {
        const response = this.page.waitForResponse((item) =>
            item.url().includes('/api/bapp-fisik/folder?') && item.ok()
        );
        await this.page.goto('/transaksi/penerimaan_bapp_fisik');
        await response;
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/penerimaan_bapp_fisik/);
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Penerimaan BAPP Fisik')).toBeVisible();
        await expect(this.page.getByRole('heading', { name: 'Pencarian & Filter' })).toBeVisible();
        await expect(this.page.getByRole('tab', { name: this.label('Kelola BAPP') })).toHaveAttribute('aria-selected', 'true');
    }

    async verifyFolderControls() {
        await expect(this.page.getByRole('textbox', { name: 'Cari Nama Folder / Batch' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Cari Data' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
        await expect(this.button('Buat Folder Baru')).toBeVisible();
        for (const header of ['Aksi', 'Nama Folder / Batch', 'Isi Dokumen', 'Status', 'Tanggal Dibuat']) {
            await expect(this.page.getByText(this.label(header)).first()).toBeVisible();
        }
    }

    async firstFolderName() {
        const folder = this.page.locator('main p').filter({ hasText: /Folder|Batch/i }).first();
        await expect(folder).toBeVisible();
        return (await folder.textContent())!.trim();
    }

    async searchFolder(name: string) {
        const input = this.page.getByRole('textbox', { name: 'Cari Nama Folder / Batch' });
        await input.fill(name);
        const response = this.page.waitForResponse((item) =>
            item.url().includes('/api/bapp-fisik/folder?') && item.ok()
        );
        await input.press('Enter');
        await response;
        await expect(this.page.getByText(name, { exact: true })).toBeVisible();
    }

    async resetFolderSearch() {
        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(this.page.getByRole('textbox', { name: 'Cari Nama Folder / Batch' })).toHaveValue('');
    }

    async verifyAuditTrail() {
        await this.page.getByRole('tab', { name: 'Audit Trail' }).click();
        await expect(this.page.getByRole('tab', { name: 'Audit Trail' })).toHaveAttribute('aria-selected', 'true');
        await expect(this.page.getByRole('textbox', { name: /ID Transaksi|Transaction ID/ })).toBeVisible();
        await expect(this.page.getByRole('combobox', { name: 'Koordinator' })).toBeVisible();
        await expect(this.page.getByRole('main')).toContainText(this.label('Nama Folder / Batch'));
    }

    async verifyCreateFolderDialog() {
        await this.page.getByRole('tab', { name: this.label('Kelola BAPP') }).click();
        await this.button('Buat Folder Baru').click();
        const dialog = this.page.getByRole('dialog', { name: this.label('Buat Folder Grouping Baru') });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('textbox', { name: this.label('Nama / Nomor Folder') })).toBeVisible();
        await expect(dialog.getByRole('button', { name: this.label('Simpan Folder') })).toBeVisible();
        await dialog.getByRole('button', { name: this.label('Batal') }).click();
        await expect(dialog).toBeHidden();
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
