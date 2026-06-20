import { Page, expect } from '@playwright/test';

export class LoginPage {

    constructor(private page: Page) {}

    async goto() {
        await this.page.goto('/login');
    }

    async login(username: string, password: string) {
        await this.page
            .getByRole('textbox', { name: 'Username' })
            .fill(username);

        await this.page
            .getByRole('textbox', { name: 'Password' })
            .fill(password);

        await this.page
            .getByRole('button', { name: 'Masuk ke Sistem' })
            .click();
    }

    async verifyLoginPageLoaded() {
        await expect(this.page).toHaveURL(/login/);
        await expect(
            this.page.getByRole('textbox', { name: 'Username' })
        ).toBeVisible();
        await expect(
            this.page.getByRole('textbox', { name: 'Password' })
        ).toBeVisible();
        await expect(
            this.page.getByRole('button', { name: 'Masuk ke Sistem' })
        ).toBeVisible();
    }

    async verifyErrorMessage(message: string) {
        await expect(
            this.page.getByText(message)
        ).toBeVisible();
    }

    async verifyStillOnLoginPage() {
        await expect(this.page).toHaveURL(/login/);
    }
}