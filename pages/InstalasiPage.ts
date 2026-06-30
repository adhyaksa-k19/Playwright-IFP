import { expect, Page } from '@playwright/test';

export class InstalasiPage {
    constructor(private readonly page: Page) {}

    private transactionIdInput() {
        return this.page.getByRole('textbox', { name: /^(ID Transaksi|Transaction ID)$/ });
    }

    private searchButton() {
        return this.page.getByRole('button', { name: /^(Cari Alokasi|Search Allocation)$/ });
    }

    async goto() {
        const response = this.waitForData();
        await this.page.goto('/transaksi/list_instalasi');
        await response;
        await expect(this.page.getByRole('button', { name: 'Edit' }).first()).toBeVisible();
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/list_instalasi/);
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(/Daftar Instalasi|Installation/)).toBeVisible();
        await expect(this.searchButton()).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
    }

    async firstTransactionId() {
        const id = this.page.locator('main p').filter({ hasText: /^HI\d+$/ }).first();
        await expect(id).toBeVisible();
        return (await id.textContent())!.trim();
    }

    async searchByTransactionId(id: string) {
        const input = this.transactionIdInput();
        await input.fill(id);
        await input.blur();
        await expect(input).toHaveValue(id);

        const response = this.waitForData((url) =>
            new URL(url).searchParams.get('id_transaksi') === id
        );
        await this.searchButton().click();
        await response;
        await expect(this.page.getByRole('button', { name: 'Edit' })).toHaveCount(1, {
            timeout: 60_000,
        });
        await expect(this.page.getByText(id, { exact: true }).first()).toBeVisible();
    }

    async selectStatus(status: string) {
        await this.page.getByRole('combobox').filter({ hasText: 'Semua Status Progress' }).click();
        await this.page.getByRole('option', { name: status, exact: true }).click();
        const response = this.waitForData();
        await this.searchButton().click();
        await response;
        await expect(this.page.getByText(status, { exact: true }).first()).toBeVisible();
    }

    async reset() {
        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(this.transactionIdInput()).toHaveValue('');
    }

    async changePageSizeTo25() {
        const response = this.waitForData((url) => url.includes('limit=25'));
        await this.page.getByRole('combobox', { name: /Baris per halaman:|Rows per page/ }).click();
        await this.page.getByRole('option', { name: '25', exact: true }).click();
        await response;
        await expect(this.page.getByText(/1.?25 of/)).toBeVisible();
    }

    async goToNextPage() {
        await this.page.getByRole('button', { name: 'Go to next page' }).click();
        await expect(this.page.getByText(/26.?50 of/)).toBeVisible({ timeout: 60_000 });
    }

    private waitForData(extra: (url: string) => boolean = () => true) {
        return this.page.waitForResponse((response) => {
            const url = response.url();
            return url.includes('/api/transaksi/alokasi?') && response.ok() && extra(url);
        });
    }
}
