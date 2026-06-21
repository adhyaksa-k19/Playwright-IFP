// tests/dump.spec.ts
import { test } from '@playwright/test';
import fs from 'fs';

test('dump aria add koordinator', async ({ page }) => {
    await page.goto('/master/detail_koordinator');
    await page.waitForLoadState('networkidle');

    const snapshot = await page.locator('body').ariaSnapshot();
    fs.writeFileSync('aria_add_koordinator.txt', snapshot);
});