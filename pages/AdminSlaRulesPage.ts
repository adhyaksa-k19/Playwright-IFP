import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export interface SlaRuleData {
    province: string;
    lowerBound: string;
    upperBound: string;
    score: string;
}

export class AdminSlaRulesPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/sla_rules');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Konfigurasi Aturan SLA', { exact: true })).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('button', { name: 'Cari Data' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Tambah Aturan SLA' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Edit Rule' }).first()).toBeVisible();
    }

    async filterWithoutResultAndReset() {
        const input = this.page.getByRole('textbox', { name: 'Cari Propinsi Area...' });
        await input.fill(`PROPINSI_TIDAK_ADA_${Date.now()}`);
        await this.page.getByRole('button', { name: 'Cari Data' }).click();
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

    async verifyAddRuleForm(data: SlaRuleData) {
        await this.page.getByRole('button', { name: 'Tambah Aturan SLA' }).click();
        const dialog = this.page.getByRole('dialog', { name: 'Tambah Aturan SLA Baru' });
        await dialog.getByRole('combobox', { name: 'Pilih Propinsi Tujuan (Bisa Multiple) *' }).click();
        await this.page.getByRole('option', { name: data.province, exact: true }).click();
        await dialog.getByRole('spinbutton', { name: 'Batas Bawah (Jam) *' }).fill(data.lowerBound);
        await dialog.getByRole('spinbutton', { name: 'Batas Atas (Jam)' }).fill(data.upperBound);
        await dialog.getByRole('spinbutton', { name: 'Skor (+ atau -) *' }).fill(data.score);
        await expect(dialog.getByRole('button', { name: 'Simpan Rules' })).toBeEnabled();
        await dialog.getByRole('button', { name: 'Batal' }).click();
        await expect(dialog).toBeHidden({ timeout: TIMEOUT });
    }

    async verifyEditRuleForm(province: string, score: string) {
        await this.filterByProvince(province);
        await this.page.getByRole('button', { name: 'Edit Rule' }).first().click();
        const dialog = this.page.getByRole('dialog', { name: 'Edit Aturan SLA' });
        await expect(dialog.getByRole('spinbutton', { name: 'Batas Bawah (Jam) *' })).not.toHaveValue('');
        await dialog.getByRole('spinbutton', { name: 'Skor (+ atau -) *' }).fill(score);
        await expect(dialog.getByRole('button', { name: 'Simpan Rules' })).toBeEnabled();
        await dialog.getByRole('button', { name: 'Batal' }).click();
        await expect(dialog).toBeHidden({ timeout: TIMEOUT });
    }

    async verifyDeleteRuleConfirmation(province: string) {
        await this.filterByProvince(province);
        const confirmation = new Promise<void>((resolve) => {
            this.page.once('dialog', async (dialog) => {
                expect(dialog.message()).toContain('menghapus Aturan SLA');
                await dialog.dismiss();
                resolve();
            });
        });
        await this.page.getByRole('button', { name: 'Hapus Rule' }).first().click();
        await confirmation;
        await expect(this.page.getByRole('button', { name: 'Hapus Rule' }).first()).toBeVisible();
    }

    private async filterByProvince(province: string) {
        const input = this.page.getByRole('textbox', { name: 'Cari Propinsi Area...' });
        await input.fill(province);
        await this.page.getByRole('button', { name: 'Cari Data' }).click();
        if (province !== 'Prov. Bali') {
            await expect(this.page.getByText('Prov. Bali', { exact: true })).toBeHidden({ timeout: TIMEOUT });
        }
        await expect(this.page.getByText(province, { exact: true }).first().or(this.emptyState()))
            .toBeVisible({ timeout: TIMEOUT });
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }
}
