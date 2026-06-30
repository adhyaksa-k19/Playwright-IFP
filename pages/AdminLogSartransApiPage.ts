import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export class AdminLogSartransApiPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/log_sartrans_api');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(/Log Sartrans API|Sartrans API Log/)).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: /Filter Log API|Filter/ })).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Cari Log|Search/ })).toBeVisible();
        await expect(this.page.getByRole('textbox', { name: 'Endpoint / Action' })).toBeVisible();
    }

    async filterWithoutResultAndReset() {
        const input = this.page.getByRole('textbox', { name: 'Endpoint / Action' });
        await input.fill(`/action-tidak-ada-${Date.now()}`);
        await this.page.getByRole('button', { name: /Cari Log|Search/ }).click();
        await expect(this.emptyState()).toBeVisible({ timeout: TIMEOUT });

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(input).toHaveValue('');
    }

    async verifySinglePagePagination() {
        await expect(this.page.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
        await expect(this.page.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }
}
