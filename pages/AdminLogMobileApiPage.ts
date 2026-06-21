import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export class AdminLogMobileApiPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/log_mobile_api');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Log Mobile API', { exact: true })).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: 'Filter Log API' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Cari Log' })).toBeVisible();
        await expect(this.page.getByRole('textbox', { name: 'Endpoint', exact: true })).toBeVisible();
    }

    async filterWithoutResultAndReset() {
        const input = this.page.getByRole('textbox', { name: 'Endpoint', exact: true });
        await input.fill(`/endpoint-tidak-ada-${Date.now()}`);
        await this.page.getByRole('button', { name: 'Cari Log' }).click();
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

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }
}
