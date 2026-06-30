import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export interface AdminUserData {
    username: string;
    role: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export class AdminUserAccountPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/user_account');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(/Daftar User|User Account|User List/)).toBeVisible({ timeout: TIMEOUT });
        await this.page.waitForTimeout(2_500);
        await expect(this.page.getByText('Loading data...', { exact: true }))
            .toBeHidden({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: /Pencarian & Filter Data|Filter|Search & Filter/ })).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Cari User Account|Search User Account|Search/ })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'add', exact: true })).toBeVisible();
    }

    async filterAndReset() {
        await this.filterByUsername('AnnatsazZahra');
        const input = this.page.getByRole('textbox', { name: 'Username' });

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

    async addUser(data: AdminUserData) {
        await this.page.getByRole('button', { name: 'add', exact: true }).click();
        const dialog = this.page.getByRole('dialog', { name: /Tambah User Baru|Add New User|Add User/ });
        await expect(dialog).toBeVisible();

        await dialog.getByRole('textbox', { name: 'Username', exact: true }).fill(data.username, { force: true });
        await dialog.getByRole('combobox', { name: 'Role' }).click();
        await this.page.getByRole('option', { name: data.role, exact: true }).click();
        await dialog.getByRole('textbox', { name: 'Password', exact: true }).fill(data.password);
        await dialog.getByRole('textbox', { name: /Ulangi Password|Confirm New Password|Confirm Password/ }).fill(data.password);
        await dialog.getByRole('textbox', { name: /Nama Depan|First Name/ }).fill(data.firstName);
        await dialog.getByRole('textbox', { name: /Nama Belakang|Last Name/ }).fill(data.lastName);
        await dialog.getByRole('textbox', { name: 'Email' }).fill(data.email);
        await dialog.getByRole('textbox', { name: /No\. Telepon|Phone Number/ }).fill(data.phone);
        await dialog.getByRole('button', { name: /Simpan|Save/ }).click();
        await expect(dialog).toBeHidden({ timeout: TIMEOUT });

        await this.page.waitForTimeout(2_000);
        await this.goto();
        await this.expectUserVisible(data.username);
    }

    async editUser(username: string, lastName: string) {
        await this.filterByUsername(username);
        await this.rowAction(username, 0).click();
        const dialog = this.page.getByRole('dialog', { name: 'Edit User' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('textbox', { name: /Nama Belakang|Last Name/ }).fill(lastName);
        await dialog.getByRole('button', { name: /Simpan|Save/ }).click();
        await expect(dialog).toBeHidden({ timeout: TIMEOUT });

        await this.goto();
        await this.filterByUsername(username);
        await expect(this.page.getByText(lastName, { exact: true })).toBeVisible();
    }

    async setPassword(username: string, password: string) {
        await this.filterByUsername(username);
        await this.rowAction(username, 1).click();
        const dialog = this.page.getByRole('dialog', { name: new RegExp(`Ubah Password untuk user ${username}|Change Password.*${username}|Set Password.*${username}|Reset Password.*${username}`) });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
        await dialog.getByRole('textbox', { name: /Ulangi Password|Confirm New Password|Confirm Password/ }).fill(password);
        await dialog.getByRole('button', { name: /Simpan|Save/ }).click();
        await expect(dialog).toBeHidden({ timeout: TIMEOUT });
    }

    async openAudit(username: string) {
        await this.filterByUsername(username);
        await this.rowAction(username, 2).click();
        await expect(this.page).toHaveURL(new RegExp(`/admin/user_account/audit/${username}/?$`));
        await expect(this.page.getByText(`Audit: ${username}`, { exact: true })).toBeVisible();
    }

    async deleteUser(username: string) {
        await this.filterByUsername(username);
        const confirmation = new Promise<void>((resolve) => {
            this.page.once('dialog', async (dialog) => {
                expect(dialog.message()).toContain(username);
                await dialog.accept();
                resolve();
            });
        });
        await this.rowAction(username, 3).click();
        await confirmation;
        await expect(this.page.getByText(username, { exact: true })).toBeHidden({ timeout: TIMEOUT });
    }

    async deleteUserIfExists(username: string) {
        await this.goto();
        await this.filterByUsername(username);
        if (await this.page.getByText(username, { exact: true }).isVisible().catch(() => false)) {
            await this.deleteUser(username);
        }
    }

    async expectUserVisible(username: string) {
        await this.filterByUsername(username);
        await expect(this.page.getByText(username, { exact: true })).toBeVisible({ timeout: TIMEOUT });
    }

    private async filterByUsername(username: string) {
        const input = this.page.getByRole('textbox', { name: 'Username' });
        await input.fill(username);
        await input.blur();
        const response = this.page.waitForResponse((item) => {
            const url = new URL(item.url());
            return url.pathname === '/api/user_account/user' &&
                url.searchParams.get('user_account_username') === username;
        }, { timeout: TIMEOUT });
        await this.page.getByRole('button', { name: /Cari User Account|Search User Account|Search/ }).click();
        const result = await response;
        expect(result.ok(), `HTTP ${result.status()} saat mencari user account`).toBeTruthy();
        await this.page.waitForTimeout(500);
    }

    private rowAction(username: string, index: number) {
        const row = this.page.getByText(username, { exact: true })
            .locator('xpath=ancestor::div[.//button][1]');
        return row.getByRole('button').nth(index);
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }
}
