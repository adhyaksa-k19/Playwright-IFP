import { BrowserContext, Page, test } from '@playwright/test';
import { AdminRoleData, AdminUserRolePage } from '../pages/AdminUserRolePage';

test.describe.serial('Administrasi - User Role', () => {
    test.describe.configure({ timeout: 120_000 });

    let context: BrowserContext;
    let page: Page;
    let admin: AdminUserRolePage;
    const suffix = String(Date.now()).slice(-8);
    const role: AdminRoleData = {
        code: `AUTO${suffix}`,
        name: `Automation Role ${suffix}`,
        description: 'Role khusus test automation',
    };

    test.beforeAll(async ({ browser, baseURL }) => {
        context = await browser.newContext({
            baseURL,
            storageState: 'playwright/.auth/user.json',
        });
    });

    test.beforeEach(async () => {
        page = await context.newPage();
        admin = new AdminUserRolePage(page);
    });

    test.afterEach(async () => {
        await page.close();
    });

    test.afterAll(async () => {
        const cleanupPage = await context.newPage();
        await new AdminUserRolePage(cleanupPage).deleteRoleIfExists(role.code).catch(() => undefined);
        await cleanupPage.close();
        await context?.close();
    });

    test('layout halaman tersedia', async () => {
        await admin.goto();
        await admin.verifyPageLoaded();
    });

    test('filter tanpa hasil dan reset', async () => {
        await admin.goto();
        await admin.filterWithoutResultAndReset();
    });

    test('add user role', async () => {
        await admin.goto();
        await admin.addRole(role);
    });

    test('edit user role', async () => {
        await admin.goto();
        await admin.editRole(role.code, `${role.name} Edited`);
    });

    test('edit permission user role', async () => {
        await admin.goto();
        await admin.editPermissions(role.code);
    });

    test('audit user role', async () => {
        await admin.goto();
        await admin.openAudit(role.code);
    });

    test('hapus user role', async () => {
        await admin.goto();
        await admin.deleteRole(role.code);
    });
});
