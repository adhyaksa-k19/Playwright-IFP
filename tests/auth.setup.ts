import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {

    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Username' })
        .fill(process.env.IFP_USERNAME!);

    await page.getByRole('textbox', { name: 'Password' })
        .fill(process.env.IFP_PASSWORD!);

    await page.getByRole('button', {
        name: /^(Masuk ke Sistem|Sign In to System)$/
    }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });

    await page.context().storageState({
        path: 'playwright/.auth/user.json'
    });
});
