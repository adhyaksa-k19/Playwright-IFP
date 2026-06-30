import { Page, expect } from '@playwright/test';

export class LoginPage {

    constructor(private page: Page) {}

    private signInButton() {
        return this.page.getByRole('button', {
            name: /^(Masuk ke Sistem|Sign In to System)$/,
        });
    }

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

        await this.signInButton().click();
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
            this.signInButton()
        ).toBeVisible();
    }

    async verifyErrorMessage(message: string) {
        await expect(
            this.page.getByText(new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
        ).toBeVisible();
    }

    async verifyStillOnLoginPage() {
        await expect(this.page).toHaveURL(/login/);
    }
}
