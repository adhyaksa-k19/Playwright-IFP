import { expect, Page } from '@playwright/test';

export interface SchoolAllocation {
    npsn: string;
    nama_sekolah: string;
    current_units: number;
}

export class CreateAlokasiPage {
    constructor(private readonly page: Page) {}

    async goto(): Promise<SchoolAllocation> {
        const data = this.page.waitForResponse((response) =>
            response.url().includes('/api/reference/sekolah_alokasi_count') &&
            response.ok()
        );
        await this.page.goto('/transaksi/create_alokasi');
        const body = await (await data).json();
        await expect(this.dataCheckboxes().first()).toBeVisible({ timeout: 60_000 });
        return body.data.data[0] as SchoolAllocation;
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/create_alokasi/);
        await expect(this.page.getByRole('textbox', { name: 'NPSN' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Cari', exact: true })).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Tambah Alokasi/ })).toBeDisabled();
    }

    async verifyFilters() {
        await expect(this.page.getByRole('textbox', { name: 'Nama Sekolah' })).toBeVisible();
        await expect(this.page.getByRole('combobox', { name: /Propinsi/ })).toBeVisible();
        await expect(this.page.getByRole('combobox', { name: /Kabupaten/ })).toBeVisible();
        await expect(this.page.getByRole('spinbutton', { name: 'Min Alokasi' })).toBeVisible();
        await expect(this.page.getByRole('spinbutton', { name: 'Max Alokasi' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset', exact: true })).toBeVisible();
    }

    async searchByNpsn(npsn: string) {
        await this.page.getByRole('textbox', { name: 'NPSN' }).fill(npsn);
        const response = this.page.waitForResponse((item) =>
            item.url().includes('/api/reference/sekolah_alokasi_count') &&
            item.url().includes(`npsn=${npsn}`) && item.ok()
        );
        await this.page.getByRole('button', { name: 'Cari', exact: true }).click();
        await response;
        await expect(this.page.getByText(npsn, { exact: true }).first()).toBeVisible();
    }

    async reset() {
        await this.page.getByRole('button', { name: 'Reset', exact: true }).click();
        await expect(this.page.getByRole('textbox', { name: 'NPSN' })).toHaveValue('');
    }

    async goToNextPage() {
        await this.page.getByRole('button', { name: 'Go to next page' }).click();
        await expect(this.page.getByText(/26.?50 of/)).toBeVisible({ timeout: 60_000 });
    }

    async selectFirstSchool() {
        await this.dataCheckboxes().first().check();
        await expect(this.page.getByRole('button', { name: 'Tambah Alokasi (1 Sekolah)' })).toBeEnabled();
    }

    async openAddDialog() {
        await this.page.getByRole('button', { name: 'Tambah Alokasi (1 Sekolah)' }).click();
        const dialog = this.page.getByRole('dialog', { name: 'Input Alokasi Unit' });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('spinbutton', { name: 'Jumlah Per Sekolah' })).toHaveValue('1');
        return dialog;
    }

    async submitAllocation(count = 1) {
        const dialog = this.page.getByRole('dialog', { name: 'Input Alokasi Unit' });
        await dialog.getByRole('spinbutton', { name: 'Jumlah Per Sekolah' }).fill(String(count));
        const response = this.page.waitForResponse((item) =>
            item.url().includes('/api/transaksi/bulk_create_alokasi') &&
            item.request().method() === 'POST'
        );
        await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
        const result = await response;
        const text = await result.text();
        expect(result.ok(), text).toBeTruthy();
        await expect(dialog).toBeHidden();
        return text ? JSON.parse(text) : null;
    }

    private dataCheckboxes() {
        return this.page.getByRole('checkbox').nth(1);
    }
}
