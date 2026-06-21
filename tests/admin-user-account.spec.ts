import { BrowserContext, Page, test } from '@playwright/test';
import { AdminUserAccountPage, AdminUserData } from '../pages/AdminUserAccountPage';

test.describe.serial('Administrasi - Akun User', () => {
    test.describe.configure({ timeout: 120_000 });

    let context: BrowserContext;
    let page: Page;
    let admin: AdminUserAccountPage;
    const suffix = String(Date.now()).slice(-9);
    const user: AdminUserData = {
        username: `AUTOUSR${suffix}`,
        role: 'BAPP',
        password: 'AutoTest12345',
        firstName: 'Automation',
        lastName: 'User',
        email: `autouser${suffix}@example.com`,
        phone: `0812${suffix}`,
    };

    test.beforeAll(async ({ browser, baseURL }) => {
        context = await browser.newContext({
            baseURL,
            storageState: 'playwright/.auth/user.json',
        });
    });

    test.beforeEach(async () => {
        page = await context.newPage();
        admin = new AdminUserAccountPage(page);
    });

    test.afterEach(async () => {
        await page.close();
    });

    test.afterAll(async () => {
        const cleanupPage = await context.newPage();
        await new AdminUserAccountPage(cleanupPage).deleteUserIfExists(user.username).catch(() => undefined);
        await cleanupPage.close();
        await context?.close();
    });

    test('layout halaman tersedia', async () => {
        await admin.goto();
        await admin.verifyPageLoaded();
    });

    test('filter dan reset', async () => {
        await admin.goto();
        await admin.filterAndReset();
    });

    test('pagination berpindah halaman', async () => {
        await admin.goto();
        await admin.verifyPagination();
    });

    test('add user account', async () => {
        await admin.goto();
        await admin.addUser(user);
    });

    test('edit user account', async () => {
        await admin.goto();
        await admin.editUser(user.username, 'User Edited');
    });

    test('audit user account', async () => {
        await admin.goto();
        await admin.openAudit(user.username);
    });

    test('set password user account', async () => {
        await admin.goto();
        await admin.setPassword(user.username, 'AutoTest67890');
    });

    test('hapus user account', async () => {
        await admin.goto();
        await admin.deleteUser(user.username);
    });
});
