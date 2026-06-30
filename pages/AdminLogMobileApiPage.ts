import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export class AdminLogMobileApiPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/log_mobile_api');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(/Log Mobile API|Mobile API Log/)).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: /Filter Log API|Filter/ })).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Cari Log|Search/ })).toBeVisible();
        await expect(this.page.getByRole('textbox', { name: 'Endpoint', exact: true })).toBeVisible();
    }

    async filterWithoutResultAndReset() {
        const input = this.page.getByRole('textbox', { name: 'Endpoint', exact: true });
        await input.fill(`/endpoint-tidak-ada-${Date.now()}`);
        await this.page.getByRole('button', { name: /Cari Log|Search/ }).click();
        await expect(this.emptyState()).toBeVisible({ timeout: TIMEOUT });

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(input).toHaveValue('');
    }

    async verifyPagination() {
        const next = this.page.getByRole('button', { name: 'Go to next page' });
        const previous = this.page.getByRole('button', { name: 'Go to previous page' });
        await expect(next).toBeVisible({ timeout: TIMEOUT });
        await expect(previous).toBeVisible({ timeout: TIMEOUT });
        if (await next.isEnabled()) {
            await next.click();
            await expect(previous).toBeEnabled({ timeout: TIMEOUT });
        } else {
            await expect(previous).toBeDisabled();
        }
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }
}
