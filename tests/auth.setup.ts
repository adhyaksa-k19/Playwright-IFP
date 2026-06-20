import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {

    await page.goto('https://ifp-devel.zlpdigital.com/login');

    await page.getByRole('textbox', { name: 'Username' })
        .fill(process.env.IFP_USERNAME!);

    await page.getByRole('textbox', { name: 'Password' })
        .fill(process.env.IFP_PASSWORD!);

    await page.getByRole('button', {
        name: 'Masuk ke Sistem'
    }).click();

    await expect(page).toHaveURL(/dashboard/);

    await page.context().storageState({
        path: 'playwright/.auth/user.json'
    });
});