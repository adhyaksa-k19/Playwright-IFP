// tests/dump.spec.ts
import { expect, test } from '@playwright/test';
import fs from 'fs';

test('dump aria snapshot', async ({ page }) => {
    const route = process.env.DUMP_ROUTE ?? '/monitoring/proses_instalasi';
    const output = process.env.DUMP_OUTPUT ?? 'aria_proses_instalasi.txt';

    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main')).toBeVisible();

    const loading = page.getByText(/Loading(?: data)?\.\.\./).first();
    await page.waitForTimeout(500);
    if (await loading.isVisible()) {
        await expect(loading).toBeHidden({ timeout: 60_000 });
    }

    const snapshot = await page.locator('body').ariaSnapshot();
    fs.writeFileSync(output, snapshot);
    console.log(`ARIA snapshot: ${route} -> ${output}`);
});
