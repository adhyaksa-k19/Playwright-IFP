import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export interface AdminRoleData {
    code: string;
    name: string;
    description: string;
}

export class AdminUserRolePage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/user_role');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(/Daftar User Role|User Role List|User Roles?/)).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: /Pencarian & Filter Data|Search & Filter Data|Filter/ })).toBeVisible();
        await expect(this.addRoleButton()).toBeVisible();
        await expect(this.permissionButton().first()).toBeVisible();
    }

    async filterWithoutResultAndReset() {
        const input = this.roleSearchInput();
        await input.fill(`ROLE_TIDAK_ADA_${Date.now()}`);
        await this.searchButton().click();
        await expect(this.emptyState()).toBeVisible({ timeout: TIMEOUT });

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(input).toHaveValue('');
    }

    async addRole(data: AdminRoleData) {
        await this.addRoleButton().click();
        const dialog = this.page.getByRole('dialog', { name: /Tambah Role Baru|Add New Role|Add Role/ });
        const roleInputs = dialog.getByRole('textbox', { name: /Kode Role|Role Code|Role Name/ });
        await roleInputs.nth(0).fill(data.code);
        await roleInputs.nth(1).fill(data.name);
        await dialog.getByRole('textbox', { name: /Deskripsi|Description/ }).fill(data.description);
        await dialog.getByRole('button', { name: /Simpan|Save/ }).click();
        await expect(dialog).toBeHidden({ timeout: TIMEOUT });
        await this.page.waitForTimeout(2_000);
        await this.goto();
        await this.expectRoleVisible(data.code);
    }

    async editRole(code: string, name: string) {
        await this.filterByCode(code);
        await this.page.getByRole('button', { name: 'Edit', exact: true }).click();
        const dialog = this.page.getByRole('dialog', { name: 'Edit Role' });
        await dialog.getByRole('textbox', { name: /Nama Role|Role Name/ }).last().fill(name);
        await dialog.getByRole('button', { name: /Simpan|Save/ }).click();
        await expect(dialog).toBeHidden({ timeout: TIMEOUT });

        await this.filterByCode(code);
        await expect(this.page.getByText(name, { exact: true })).toBeVisible();
    }

    async editPermissions(code: string) {
        await this.filterByCode(code);
        await this.permissionButton().click();
        const dialog = this.page.getByRole('dialog', { name: /Edit Permissions|Set Permissions/ });
        await expect(dialog).toBeVisible({ timeout: TIMEOUT });
        const firstView = dialog.getByRole('checkbox', { name: 'View' }).first();
        await firstView.check();
        await dialog.getByRole('button', { name: /Simpan|Save/ }).click();
        await expect(dialog).toBeHidden({ timeout: TIMEOUT });

        await this.filterByCode(code);
        await this.permissionButton().click();
        const reopenedDialog = this.page.getByRole('dialog', { name: /Edit Permissions|Set Permissions/ });
        const savedView = reopenedDialog.getByRole('checkbox', { name: 'View' }).first();
        await expect(savedView).toBeChecked({ timeout: TIMEOUT });
        await savedView.uncheck();
        await reopenedDialog.getByRole('button', { name: /Simpan|Save/ }).click();
        await expect(reopenedDialog).toBeHidden({ timeout: TIMEOUT });
        await this.clearPermissionsViaApi(code);
    }

    async openAudit(code: string) {
        await this.filterByCode(code);
        await this.rowAction(0).click();
        await expect(this.page).toHaveURL(new RegExp(`/admin/user_role/audit/${code}/?$`));
        await expect(this.page.getByText(`Audit: ${code}`, { exact: true })).toBeVisible();
    }

    async deleteRole(code: string) {
        await this.filterByCode(code);
        const response = this.page.waitForResponse((item) =>
            item.request().method() === 'DELETE' && item.url().includes('/api/user_account/user_role/')
        , { timeout: TIMEOUT });
        const confirmation = new Promise<void>((resolve) => {
            this.page.once('dialog', async (dialog) => {
                await dialog.accept();
                resolve();
            });
        });
        await this.rowAction(1).click();
        await confirmation;
        const result = await response;
        const errorBody = result.ok() ? '' : await result.text();
        expect(result.ok(), `HTTP ${result.status()} saat menghapus role ${code}: ${errorBody}`).toBeTruthy();
        await this.page.waitForTimeout(2_000);
        await this.goto();
        await this.filterByCode(code);
        await expect(this.page.getByText(code, { exact: true })).toBeHidden({ timeout: TIMEOUT });
    }

    async deleteRoleIfExists(code: string) {
        await this.goto();
        await this.filterByCode(code);
        if (await this.page.getByText(code, { exact: true }).isVisible().catch(() => false)) {
            await this.clearPermissionsViaApi(code);
            await this.deleteRole(code);
        }
    }

    private async clearPermissionsViaApi(code: string) {
        const apiRequest = this.page.waitForRequest((request) =>
            request.url().includes('/api/user_account/user_role?')
        );
        await this.page.reload();
        const headers = await (await apiRequest).allHeaders();
        const result = await this.page.request.post(
            'https://ifp-api-devel.pyxscreen.co.id/api/user_account/update_role_permissions',
            {
                headers: { authorization: headers.authorization },
                data: {
                    user_account_role_code: code,
                    permissions: [],
                },
            }
        );
        expect(result.ok(), `HTTP ${result.status()} saat membersihkan permission ${code}`).toBeTruthy();
    }

    private async expectRoleVisible(code: string) {
        await this.filterByCode(code);
        await expect(this.page.getByText(code, { exact: true })).toBeVisible({ timeout: TIMEOUT });
    }

    private async filterByCode(code: string) {
        const input = this.roleSearchInput();
        await input.fill(code);
        await input.blur();
        await this.searchButton().click();
        await expect(this.page.getByText(code, { exact: true }).or(this.emptyState()))
            .toBeVisible({ timeout: TIMEOUT });
        if (await this.page.getByText(code, { exact: true }).isVisible().catch(() => false)) {
            await expect(this.page.getByRole('button', { name: 'Edit', exact: true }))
                .toHaveCount(1, { timeout: TIMEOUT });
        }
    }

    private rowAction(index: number) {
        return this.page.getByRole('main').getByRole('button', { name: '', exact: true }).nth(index);
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }

    private roleSearchInput() {
        return this.page.getByRole('textbox', { name: /Cari Role|Search Role|Role/ });
    }

    private searchButton() {
        return this.page.getByRole('button', { name: /Cari|Search/ });
    }

    private addRoleButton() {
        return this.page.getByRole('button', { name: /Tambah User Role|Add User Role|Add Role/ });
    }

    private permissionButton() {
        return this.page.getByRole('button', { name: /Edit Permissions|Set Permissions/ });
    }
}
